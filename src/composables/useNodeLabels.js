import { computed } from 'vue'

/**
 * Composable para gestionar labels y formateo de visualización de nodos
 */
export function useNodeLabels(node) {
  const nodeTypeLabel = computed(() => {
    if (!node.value) return 'Unknown'

    const labels = {
      system: 'System',
      user: 'User Prompt',
      llm: 'LLM Response'
    }
    return labels[node.value.type] || 'Unknown'
  })

  return {
    nodeTypeLabel
  }
}
