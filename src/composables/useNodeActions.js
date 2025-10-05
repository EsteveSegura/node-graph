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

  const handleAddLlmChild = async () => {
    try {
      const llmNodeId = store.addChild(nodeId, 'llm')
      // Generar respuesta automáticamente
      await store.generateLLMResponse(llmNodeId)
    } catch (error) {
      console.error('Error adding/generating llm child:', error)
    }
  }

  const handleUpdateText = (event) => {
    store.updateText(nodeId, event.target.value)
  }

  const handleRegenerate = async () => {
    try {
      await store.generateLLMResponse(nodeId)
    } catch (error) {
      console.error('Error regenerating llm response:', error)
    }
  }

  return {
    node,
    canAddLlm,
    handleAddUserChild,
    handleAddLlmChild,
    handleUpdateText,
    handleRegenerate
  }
}
