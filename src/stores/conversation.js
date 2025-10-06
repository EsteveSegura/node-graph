import { defineStore } from 'pinia'
import { useOpenAI } from '../composables/useOpenAI'

export const useConversationStore = defineStore('conversation', {
  state: () => ({
    nodes: [],
    nodesById: {},
    seq: 0,
    generatingNodes: new Set(), // Node IDs currently generating responses
    conversationId: null, // Current conversation UUID for autosave
    title: 'Untitled', // Conversation title
    titleGenerated: false, // Flag to track if title has been auto-generated
    createdAt: null, // ISO timestamp when conversation was created
    updatedAt: null // ISO timestamp when conversation was last updated
  }),

  getters: {
    getNodeById: (state) => (id) => state.nodesById[id],

    getRootNode: (state) => state.nodes.find(n => n.type === 'system' && n.parentId === null),

    canAddLlmChild: (state) => (nodeId) => {
      const node = state.nodesById[nodeId]
      return node && node.type === 'user' && node.children.length === 0
    },

    isGenerating: (state) => (nodeId) => {
      return state.generatingNodes.has(nodeId)
    }
  },

  actions: {
    initialize() {
      // Create root system node
      const systemNode = {
        id: `n${this.seq++}`,
        type: 'system',
        parentId: null,
        children: [],
        text: 'System instructions:'
      }
      this.nodes.push(systemNode)
      this.nodesById[systemNode.id] = systemNode

      // Initialize timestamps for new conversation
      const now = new Date().toISOString()
      this.createdAt = now
      this.updatedAt = now
    },

    addChild(parentId, childType) {
      const parent = this.nodesById[parentId]
      if (!parent) {
        throw new Error(`Parent node ${parentId} not found`)
      }

      // Validate typing rules
      if (parent.type === 'system' || parent.type === 'llm') {
        if (childType !== 'user') {
          throw new Error(`Node type ${parent.type} can only have user children`)
        }
      } else if (parent.type === 'user') {
        if (childType !== 'llm') {
          throw new Error('User nodes can only have llm children')
        }
        if (parent.children.length >= 1) {
          throw new Error('User nodes can only have one llm child')
        }
      }

      // Create new node
      const newNode = {
        id: `n${this.seq++}`,
        type: childType,
        parentId: parentId,
        children: [],
        text: childType === 'user' ? 'New prompt...' : 'LLM response...'
      }

      // Add to structures
      this.nodes.push(newNode)
      this.nodesById[newNode.id] = newNode
      parent.children.push(newNode.id)

      // Autosave after creating node
      this.autosave()

      return newNode.id
    },

    updateText(nodeId, newText) {
      const node = this.nodesById[nodeId]
      if (!node) {
        throw new Error(`Node ${nodeId} not found`)
      }
      node.text = newText

      // Autosave after text update
      this.autosave()
    },

    /**
     * Deletes a node and all its descendants recursively
     */
    deleteNode(nodeId) {
      const node = this.nodesById[nodeId]
      if (!node) {
        throw new Error(`Node ${nodeId} not found`)
      }

      // Don't allow deleting the root node
      if (node.type === 'system' && node.parentId === null) {
        throw new Error('Cannot delete the system root node')
      }

      // Recursively delete all children
      const childrenIds = [...node.children]
      for (const childId of childrenIds) {
        this.deleteNode(childId)
      }

      // Remove reference from parent
      if (node.parentId) {
        const parent = this.nodesById[node.parentId]
        if (parent) {
          parent.children = parent.children.filter(id => id !== nodeId)
        }
      }

      // Remove from data structures
      const index = this.nodes.findIndex(n => n.id === nodeId)
      if (index !== -1) {
        this.nodes.splice(index, 1)
      }
      delete this.nodesById[nodeId]

      // Remove from generating set if present
      this.generatingNodes.delete(nodeId)

      // Autosave after deleting node
      this.autosave()
    },

    /**
     * Builds the message array from root to the specified node
     * to send to OpenAI API
     */
    buildMessagesFromTree(targetNodeId) {
      const messages = []
      const path = []

      // Find path from root to target node
      const findPath = (nodeId) => {
        const node = this.nodesById[nodeId]
        if (!node) return false

        path.push(node)

        if (nodeId === targetNodeId) return true

        for (const childId of node.children) {
          if (findPath(childId)) return true
        }

        path.pop()
        return false
      }

      const root = this.getRootNode
      if (root) {
        findPath(root.id)
      }

      // Convert path to OpenAI message format
      for (const node of path) {
        if (node.type === 'system') {
          messages.push({
            role: 'system',
            content: node.text || 'You are a helpful assistant.'
          })
        } else if (node.type === 'user') {
          messages.push({
            role: 'user',
            content: node.text
          })
        } else if (node.type === 'llm' && node.id !== targetNodeId) {
          // Only include previous LLM responses, not the node we're generating
          messages.push({
            role: 'assistant',
            content: node.text
          })
        }
      }

      return messages
    },

    /**
     * Generates an LLM response for the specified node
     */
    async generateLLMResponse(nodeId) {
      const node = this.nodesById[nodeId]
      if (!node || node.type !== 'llm') {
        throw new Error('Can only generate response for LLM nodes')
      }

      // Mark as generating
      this.generatingNodes.add(nodeId)

      try {
        const { generateCompletion } = useOpenAI()

        // Build message context
        const messages = this.buildMessagesFromTree(nodeId)

        // Call OpenAI
        const response = await generateCompletion(messages)

        // Update node text
        this.updateText(nodeId, response)

        // Autosave after successful generation
        // (note: updateText already calls autosave, but we ensure it here too)

        // Trigger title generation in background after first LLM response
        if (!this.titleGenerated) {
          this.generateConversationTitle().catch(err => {
            console.warn('Failed to auto-generate title:', err)
          })
        }

      } catch (error) {
        console.error('Error generating LLM response:', error)
        this.updateText(nodeId, `❌ Error: ${error.message}`)
        throw error
      } finally {
        // Remove from generating set
        this.generatingNodes.delete(nodeId)
      }
    },

    /**
     * Auto-generates a conversation title using the LLM
     * Runs in background after the first LLM response
     */
    async generateConversationTitle() {
      // Only generate once
      if (this.titleGenerated) {
        return
      }

      try {
        // Build conversation context from all nodes
        const contextParts = []

        for (const node of this.nodes) {
          if (node.type === 'system') {
            contextParts.push(`[System]: ${node.text}`)
          } else if (node.type === 'user') {
            contextParts.push(`[User]: ${node.text}`)
          } else if (node.type === 'llm') {
            contextParts.push(`[Assistant]: ${node.text}`)
          }
        }

        const conversationContext = contextParts.join('\n')

        // Call OpenAI to generate title
        const { generateTitle } = useOpenAI()
        const newTitle = await generateTitle(conversationContext)

        // Update state
        this.title = newTitle
        this.titleGenerated = true

        // Save to localStorage
        this.autosave()

      } catch (error) {
        console.error('Error generating conversation title:', error)
        // Don't throw - title generation is non-critical
      }
    },

    /**
     * Set the current conversation ID for autosave
     */
    setConversationId(uuid) {
      this.conversationId = uuid
    },

    /**
     * Serialize the current state to JSON-compatible object
     */
    serializeState() {
      // Update the updatedAt timestamp on every save
      this.updatedAt = new Date().toISOString()

      return {
        nodes: this.nodes,
        nodesById: this.nodesById,
        seq: this.seq,
        title: this.title,
        titleGenerated: this.titleGenerated,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        version: 1
      }
    },

    /**
     * Deserialize and restore state from a saved object
     */
    deserializeState(data) {
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid conversation data')
      }

      // Restore state
      this.nodes = data.nodes || []
      this.nodesById = data.nodesById || {}
      this.seq = data.seq || 0
      this.title = data.title || 'Untitled'
      this.titleGenerated = data.titleGenerated || false

      // Restore timestamps with fallback for backward compatibility
      const now = new Date().toISOString()
      this.createdAt = data.createdAt || data.timestamp || now
      this.updatedAt = data.updatedAt || data.timestamp || now

      // Clear transient state
      this.generatingNodes.clear()
    },

    /**
     * Save current state to localStorage
     */
    saveToLocalStorage(uuid) {
      if (!uuid) {
        console.warn('Cannot save: no conversation ID provided')
        return
      }

      try {
        const data = this.serializeState()
        const key = `conversation_${uuid}`
        localStorage.setItem(key, JSON.stringify(data))
      } catch (error) {
        console.error('Error saving conversation to localStorage:', error)
      }
    },

    /**
     * Load state from localStorage
     */
    loadFromLocalStorage(uuid) {
      if (!uuid) {
        console.warn('Cannot load: no conversation ID provided')
        return false
      }

      try {
        const key = `conversation_${uuid}`
        const data = localStorage.getItem(key)

        if (!data) {
          return false
        }

        const parsed = JSON.parse(data)
        this.deserializeState(parsed)
        return true
      } catch (error) {
        console.error('Error loading conversation from localStorage:', error)
        return false
      }
    },

    /**
     * Autosave current state
     */
    autosave() {
      if (this.conversationId) {
        this.saveToLocalStorage(this.conversationId)
      }
    }
  }
})
