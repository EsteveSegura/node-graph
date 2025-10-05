import { computed } from 'vue'

/**
 * Composable to manage labels and display formatting for nodes
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
