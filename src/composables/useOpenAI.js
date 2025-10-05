import { ref } from 'vue'

/**
 * Composable para interactuar con la API de OpenAI
 * ⚠️ ADVERTENCIA: Esto expone tu API key en el cliente. Solo para desarrollo/testing.
 */
export function useOpenAI() {
  const isGenerating = ref(false)
  const error = ref(null)

  /**
   * Obtiene la configuración actual (lee dinámicamente para permitir cambios en tiempo real)
   */
  const getConfig = () => ({
    apiKey: localStorage.getItem('VITE_OPENAI_API_KEY') || import.meta.env.VITE_OPENAI_API_KEY,
    model: localStorage.getItem('VITE_OPENAI_MODEL') || import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
    temperature: parseFloat(localStorage.getItem('VITE_OPENAI_TEMPERATURE') || import.meta.env.VITE_OPENAI_TEMPERATURE) || 0.7,
    maxTokens: parseInt(localStorage.getItem('VITE_OPENAI_MAX_TOKENS') || import.meta.env.VITE_OPENAI_MAX_TOKENS) || 1000
  })

  /**
   * Genera una respuesta usando la API de OpenAI
   * @param {Array} messages - Array de mensajes en formato OpenAI [{role, content}]
   * @returns {Promise<string>} - Contenido de la respuesta
   */
  const generateCompletion = async (messages) => {
    const { apiKey, model, temperature, maxTokens } = getConfig()

    if (!apiKey || apiKey === 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
      throw new Error('API Key de OpenAI no configurada. Crea un archivo .env.local con VITE_OPENAI_API_KEY')
    }

    isGenerating.value = true
    error.value = null

    try {
      // Los modelos GPT-5 tienen restricciones especiales
      const isGpt5Model = model.startsWith('gpt-5')
      const requestBody = {
        model: model,
        messages: messages,
        stream: false
      }

      // GPT-5 solo soporta temperature = 1 (valor por defecto), así que lo omitimos
      // Otros modelos pueden usar temperature personalizada
      if (!isGpt5Model) {
        requestBody.temperature = temperature
      }

      // GPT-5 usa 'max_completion_tokens', otros modelos usan 'max_tokens'
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
