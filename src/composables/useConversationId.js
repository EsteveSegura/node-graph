import { useRoute, useRouter } from 'vue-router'

/**
 * Composable to manage conversation UUID in the route
 */
export function useConversationId() {
  const route = useRoute()
  const router = useRouter()

  /**
   * Generates a new UUID using crypto.randomUUID()
   * Falls back to a simple implementation if not available
   */
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  /**
   * Gets the current conversation UUID from route params
   * If no UUID exists, generates one and redirects
   * @returns {string} The conversation UUID
   */
  const ensureConversationId = () => {
    const uuid = route.params.uuid

    if (!uuid) {
      // Generate new UUID and redirect
      const newUuid = generateUUID()
      router.replace({ name: 'conversation', params: { uuid: newUuid } })
      return newUuid
    }

    return uuid
  }

  /**
   * Gets the current conversation UUID without redirecting
   * @returns {string|null} The conversation UUID or null if not present
   */
  const getConversationId = () => {
    return route.params.uuid || null
  }

  return {
    ensureConversationId,
    getConversationId,
    generateUUID
  }
}
