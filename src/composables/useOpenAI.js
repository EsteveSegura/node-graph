import { ref } from 'vue'

/**
 * Composable to interact with OpenAI API
 * ⚠️ WARNING: This exposes your API key in the client. Only for development/testing.
 */
export function useOpenAI() {
  const isGenerating = ref(false)
  const error = ref(null)

  /**
   * Gets current configuration (reads dynamically to allow real-time changes)
   */
  const getConfig = () => ({
    apiKey: localStorage.getItem('VITE_OPENAI_API_KEY') || import.meta.env.VITE_OPENAI_API_KEY,
    model: localStorage.getItem('VITE_OPENAI_MODEL') || import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
    temperature: parseFloat(localStorage.getItem('VITE_OPENAI_TEMPERATURE') || import.meta.env.VITE_OPENAI_TEMPERATURE) || 0.7,
    maxTokens: parseInt(localStorage.getItem('VITE_OPENAI_MAX_TOKENS') || import.meta.env.VITE_OPENAI_MAX_TOKENS) || 1000
  })

  /**
   * Generates a response using OpenAI API
   * @param {Array} messages - Array of messages in OpenAI format [{role, content}]
   * @returns {Promise<string>} - Response content
   */
  const generateCompletion = async (messages) => {
    const { apiKey, model, temperature, maxTokens } = getConfig()

    if (!apiKey || apiKey === 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
      throw new Error('OpenAI API Key not configured. Create a .env.local file with VITE_OPENAI_API_KEY')
    }

    isGenerating.value = true
    error.value = null

    try {
      // GPT-5 models have special restrictions
      const isGpt5Model = model.startsWith('gpt-5')
      const requestBody = {
        model: model,
        messages: messages,
        stream: false
      }

      // GPT-5 only supports temperature = 1 (default value), so we omit it
      // Other models can use custom temperature
      if (!isGpt5Model) {
        requestBody.temperature = temperature
      }

      // GPT-5 uses 'max_completion_tokens', other models use 'max_tokens'
      if (isGpt5Model) {
        requestBody.max_completion_tokens = maxTokens
      } else {
        requestBody.max_tokens = maxTokens
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response received from the model')
      }

      const assistantMessage = data.choices[0].message.content
      return assistantMessage

    } catch (err) {
      error.value = err.message
      console.error('Error calling OpenAI API:', err)
      throw err
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * Generates a short title for a conversation based on its context
   * @param {string} conversationContext - String representation of the conversation
   * @returns {Promise<string>} - Generated title
   */
  const generateTitle = async (conversationContext) => {
    const { apiKey, model } = getConfig()

    if (!apiKey || apiKey === 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
      throw new Error('OpenAI API Key not configured')
    }

    try {
      // Use a simple prompt to generate a title
      const prompt = `Generate a short, concise title (maximum 5 words) for this conversation.
Return ONLY the title without quotes or punctuation at the end.

Conversation:
${conversationContext}

Title:`

      // GPT-5 models have special restrictions
      const isGpt5Model = model.startsWith('gpt-5')
      const requestBody = {
        model: model,
        messages: [
          { role: 'user', content: prompt }
        ],
        stream: false
      }

      // GPT-5 only supports temperature = 1, so we omit it
      if (!isGpt5Model) {
        requestBody.temperature = 0.7
      }

      // Use low max_tokens for title generation (we only need a few words)
      if (isGpt5Model) {
        requestBody.max_completion_tokens = 30
      } else {
        requestBody.max_tokens = 30
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No title generated')
      }

      const title = data.choices[0].message.content.trim()
      // Remove surrounding quotes if present
      return title.replace(/^["']|["']$/g, '')

    } catch (err) {
      console.error('Error generating title:', err)
      throw err
    }
  }

  return {
    generateCompletion,
    generateTitle,
    isGenerating,
    error
  }
}
