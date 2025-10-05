<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['close'])

const availableModels = [
  { api_name: 'gpt-5', readable_name: 'GPT-5' },
  { api_name: 'gpt-5-mini', readable_name: 'GPT-5 Mini' },
  { api_name: 'gpt-5-nano', readable_name: 'GPT-5 Nano' },
  { api_name: 'gpt-4.1', readable_name: 'GPT-4.1' },
  { api_name: 'gpt-4.1-mini', readable_name: 'GPT-4.1 Mini' },
  { api_name: 'gpt-4.1-nano', readable_name: 'GPT-4.1 Nano' },
  { api_name: 'gpt-4o', readable_name: 'GPT-4o' },
  { api_name: 'gpt-4o-mini', readable_name: 'GPT-4o Mini' }
]

const apiKey = ref('')
const model = ref('')
const temperature = ref('')
const maxTokens = ref('')

onMounted(() => {
  // Load current values (from localStorage or env vars)
  apiKey.value = localStorage.getItem('VITE_OPENAI_API_KEY') || import.meta.env.VITE_OPENAI_API_KEY || ''
  model.value = localStorage.getItem('VITE_OPENAI_MODEL') || import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'
  temperature.value = localStorage.getItem('VITE_OPENAI_TEMPERATURE') || import.meta.env.VITE_OPENAI_TEMPERATURE || '0.7'
  maxTokens.value = localStorage.getItem('VITE_OPENAI_MAX_TOKENS') || import.meta.env.VITE_OPENAI_MAX_TOKENS || '1000'
})

const handleSave = () => {
  // Save to localStorage
  if (apiKey.value) localStorage.setItem('VITE_OPENAI_API_KEY', apiKey.value)
  if (model.value) localStorage.setItem('VITE_OPENAI_MODEL', model.value)
  if (temperature.value) localStorage.setItem('VITE_OPENAI_TEMPERATURE', temperature.value)
  if (maxTokens.value) localStorage.setItem('VITE_OPENAI_MAX_TOKENS', maxTokens.value)

  // Close modal
  emit('close')
}

const handleClose = () => {
  emit('close')
}

const handleBackdropClick = (event) => {
  if (event.target === event.currentTarget) {
    handleClose()
  }
}
</script>

<template>
  <div class="modal-backdrop" @click="handleBackdropClick">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Settings</h2>
        <button class="btn-close" @click="handleClose">✕</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="apiKey">OpenAI API Key</label>
          <input
            id="apiKey"
            v-model="apiKey"
            type="password"
            placeholder="sk-proj-..."
          />
        </div>

        <div class="form-group">
          <label for="model">Model</label>
          <select
            id="model"
            v-model="model"
          >
            <option
              v-for="modelOption in availableModels"
              :key="modelOption.api_name"
              :value="modelOption.api_name"
            >
              {{ modelOption.readable_name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="temperature">Temperature</label>
          <input
            id="temperature"
            v-model="temperature"
            type="number"
            step="0.1"
            min="0"
            max="2"
            placeholder="0.7"
          />
          <small>Controls randomness (0-2)</small>
        </div>

        <div class="form-group">
          <label for="maxTokens">Max Tokens</label>
          <input
            id="maxTokens"
            v-model="maxTokens"
            type="number"
            placeholder="1000"
          />
          <small>Maximum response length</small>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleClose">Cancel</button>
        <button class="btn btn-primary" @click="handleSave">Save</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: #2d2d2d;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid #404040;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #404040;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #e0e0e0;
}

.btn-close {
  background: none;
  border: none;
  color: #a0a0a0;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #404040;
  color: #e0e0e0;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #e0e0e0;
  font-size: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #404040;
  border-radius: 6px;
  background: #1f1f1f;
  color: #e0e0e0;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
}

.form-group select {
  cursor: pointer;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.form-group small {
  display: block;
  margin-top: 6px;
  color: #808080;
  font-size: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #404040;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: #3a3a3a;
  color: #e0e0e0;
  border: 1px solid #505050;
}

.btn-secondary:hover {
  background: #454545;
}

.btn-primary {
  background: #4a90e2;
  color: white;
}

.btn-primary:hover {
  background: #3a7bc8;
}
</style>
