import { computed } from 'vue'
import { useConversationStore } from '../stores/conversation'

/**
 * Composable para gestionar las acciones de un nodo (añadir hijos, actualizar texto)
 */
export function useNodeActions(nodeId) {
  const store = useConversationStore()

  const node = computed(() => store.getNodeById(nodeId))
  const canAddLlm = computed(() => store.canAddLlmChild(nodeId))

  const handleAddUserChild = () => {
    try {
      store.addChild(nodeId, 'user')
    } catch (error) {
      console.error('Error adding user child:', error)
    }
  }

  const handleAddLlmChild = () => {
    try {
      store.addChild(nodeId, 'llm')
    } catch (error) {
      console.error('Error adding llm child:', error)
    }
  }

  const handleUpdateText = (event) => {
    store.updateText(nodeId, event.target.value)
  }

  return {
    node,
    canAddLlm,
    handleAddUserChild,
    handleAddLlmChild,
    handleUpdateText
  }
}
