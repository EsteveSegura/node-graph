import { defineStore } from 'pinia'
import { useOpenAI } from '../composables/useOpenAI'

export const useConversationStore = defineStore('conversation', {
  state: () => ({
    nodes: [],
    nodesById: {},
    seq: 0,
    generatingNodes: new Set() // Node IDs currently generating responses
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

      return newNode.id
    },

    updateText(nodeId, newText) {
      const node = this.nodesById[nodeId]
      if (!node) {
        throw new Error(`Node ${nodeId} not found`)
      }
      node.text = newText
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

      } catch (error) {
        console.error('Error generating LLM response:', error)
        this.updateText(nodeId, `❌ Error: ${error.message}`)
        throw error
      } finally {
        // Remove from generating set
        this.generatingNodes.delete(nodeId)
      }
    }
  }
})
