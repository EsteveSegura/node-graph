import { defineStore } from 'pinia'
import { useOpenAI } from '../composables/useOpenAI'

export const useConversationStore = defineStore('conversation', {
  state: () => ({
    nodes: [],
    nodesById: {},
    seq: 0,
    generatingNodes: new Set() // IDs de nodos que están generando respuesta
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
      // Crear nodo root system
      const systemNode = {
        id: `n${this.seq++}`,
        type: 'system',
        parentId: null,
        children: [],
        text: 'Instrucciones del sistema:'
      }
      this.nodes.push(systemNode)
      this.nodesById[systemNode.id] = systemNode
    },

    addChild(parentId, childType) {
      const parent = this.nodesById[parentId]
      if (!parent) {
        throw new Error(`Parent node ${parentId} not found`)
      }

      // Validar reglas de tipado
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

      // Crear nuevo nodo
      const newNode = {
        id: `n${this.seq++}`,
        type: childType,
        parentId: parentId,
        children: [],
        text: childType === 'user' ? 'Nuevo prompt...' : 'Respuesta del LLM...'
      }

      // Agregar a estructuras
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
     * Construye el array de mensajes desde la raíz hasta el nodo especificado
     * para enviar a la API de OpenAI
     */
    buildMessagesFromTree(targetNodeId) {
      const messages = []
      const path = []

      // Encontrar el path desde la raíz hasta el nodo target
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

      // Convertir el path a mensajes en formato OpenAI
      for (const node of path) {
        if (node.type === 'system') {
          messages.push({
            role: 'system',
            content: node.text || 'Eres un asistente útil.'
          })
        } else if (node.type === 'user') {
          messages.push({
            role: 'user',
            content: node.text
          })
        } else if (node.type === 'llm' && node.id !== targetNodeId) {
          // Solo incluir respuestas LLM anteriores, no el nodo que estamos generando
          messages.push({
            role: 'assistant',
            content: node.text
          })
        }
      }

      return messages
    },

    /**
     * Genera una respuesta LLM para el nodo especificado
     */
    async generateLLMResponse(nodeId) {
      const node = this.nodesById[nodeId]
      if (!node || node.type !== 'llm') {
        throw new Error('Solo se puede generar respuesta para nodos LLM')
      }

      // Marcar como generando
      this.generatingNodes.add(nodeId)

      try {
        const { generateCompletion } = useOpenAI()

        // Construir contexto de mensajes
        const messages = this.buildMessagesFromTree(nodeId)

        // Llamar a OpenAI
        const response = await generateCompletion(messages)

        // Actualizar el texto del nodo
        this.updateText(nodeId, response)

      } catch (error) {
        console.error('Error generating LLM response:', error)
        this.updateText(nodeId, `❌ Error: ${error.message}`)
        throw error
      } finally {
        // Quitar del set de generando
        this.generatingNodes.delete(nodeId)
      }
    }
  }
})
