import { defineStore } from 'pinia'

export const useConversationStore = defineStore('conversation', {
  state: () => ({
    nodes: [],
    nodesById: {},
    seq: 0
  }),

  getters: {
    getNodeById: (state) => (id) => state.nodesById[id],

    getRootNode: (state) => state.nodes.find(n => n.type === 'system' && n.parentId === null),

    canAddLlmChild: (state) => (nodeId) => {
      const node = state.nodesById[nodeId]
      return node && node.type === 'user' && node.children.length === 0
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
    }
  }
})
