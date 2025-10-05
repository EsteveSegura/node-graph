import { ref } from 'vue'

/**
 * Composable para interactuar con la API de OpenAI
 * ⚠️ ADVERTENCIA: Esto expone tu API key en el cliente. Solo para desarrollo/testing.
 */
export function useOpenAI() {
  const isGenerating = ref(false)
  const error = ref(null)

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'
  const temperature = parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE) || 0.7
  const maxTokens = parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS) || 1000

  /**
   * Genera una respuesta usando la API de OpenAI
   * @param {Array} messages - Array de mensajes en formato OpenAI [{role, content}]
   * @returns {Promise<string>} - Contenido de la respuesta
   */
  const generateCompletion = async (messages) => {
    if (!apiKey || apiKey === 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
      throw new Error('API Key de OpenAI no configurada. Crea un archivo .env.local con VITE_OPENAI_API_KEY')
    }

    isGenerating.value = true
    error.value = null

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens,
          stream: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No se recibió respuesta del modelo')
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

  return {
    generateCompletion,
    isGenerating,
    error
  }
}
