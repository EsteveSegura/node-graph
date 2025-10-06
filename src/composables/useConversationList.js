/**
 * Composable to manage the list of conversations from localStorage
 */
export function useConversationList() {

  /**
   * Get all conversations from localStorage
   * @returns {Array} Array of conversation metadata objects
   */
  const getConversationList = () => {
    const conversations = []

    // Iterate through all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      // Only process conversation keys
      if (key && key.startsWith('conversation_')) {
        try {
          const uuid = key.replace('conversation_', '')
          const data = localStorage.getItem(key)

          if (data) {
            const parsed = JSON.parse(data)

            // Extract metadata
            conversations.push({
              uuid: uuid,
              title: parsed.title || 'Untitled',
              createdAt: parsed.createdAt || parsed.timestamp || new Date().toISOString(),
              updatedAt: parsed.updatedAt || parsed.timestamp || new Date().toISOString(),
              nodeCount: parsed.nodes ? parsed.nodes.length : 0
            })
          }
        } catch (error) {
          console.error(`Error parsing conversation ${key}:`, error)
          // Skip corrupted conversations
        }
      }
    }

    // Sort by updatedAt descending (most recent first)
    conversations.sort((a, b) => {
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })

    return conversations
  }

  /**
   * Delete a conversation from localStorage
   * @param {string} uuid - The conversation UUID
   */
  const deleteConversation = (uuid) => {
    try {
      const key = `conversation_${uuid}`
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Error deleting conversation:', error)
      return false
    }
  }

  /**
   * Format a date to relative time (e.g., "2 hours ago")
   * @param {string} isoDate - ISO date string
   * @returns {string} Formatted relative time
   */
  const formatRelativeTime = (isoDate) => {
    const date = new Date(isoDate)
    const now = new Date()
    const diffMs = now - date
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSeconds < 60) {
      return 'just now'
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    } else {
      // Format as date for older conversations
      return date.toLocaleDateString()
    }
  }

  return {
    getConversationList,
    deleteConversation,
    formatRelativeTime
  }
}
