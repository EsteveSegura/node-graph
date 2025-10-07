<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import ConversationNode from '../components/ConversationNode'
import InfiniteCanvas from '../components/InfiniteCanvas.vue'
import SettingsModal from '../components/SettingsModal.vue'
import { useConversationStore } from '../stores/conversation'
import { useConversationId } from '../composables/useConversationId'

const router = useRouter()
const store = useConversationStore()
const showSettings = ref(false)
const { ensureConversationId } = useConversationId()

// Check if OpenAI API key is configured
const hasApiKey = ref(false)
const checkApiKey = () => {
  const apiKey = localStorage.getItem('VITE_OPENAI_API_KEY') || import.meta.env.VITE_OPENAI_API_KEY
  hasApiKey.value = apiKey && apiKey !== 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
}

onMounted(() => {
  checkApiKey()
  // Get or generate conversation UUID
  const uuid = ensureConversationId()

  // Clear the store state before loading
  store.$reset()

  // Try to load existing conversation from localStorage
  const loaded = store.loadFromLocalStorage(uuid)

  // If no saved conversation exists, initialize a new one
  if (!loaded) {
    store.initialize()
  }

  // Set the conversation ID for autosave
  store.setConversationId(uuid)

  // Set initial document title
  document.title = store.title || 'Untitled'
})

// Update document title when conversation title changes
watch(
  () => store.title,
  (newTitle) => {
    document.title = newTitle || 'Untitled'
  }
)

const openSettings = () => {
  showSettings.value = true
}

const closeSettings = () => {
  showSettings.value = false
  checkApiKey()
}

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="conversation-view">
    <div v-if="!hasApiKey" class="api-key-warning" @click="openSettings">
      ⚠️ Configure your OpenAI API key in Settings
    </div>

    <header class="app-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack" title="Back to home">
          ← Back
        </button>
        <h1>{{ store.title || 'Untitled' }}</h1>
      </div>
      <div class="header-right">
        <button class="btn-settings" @click="openSettings">
          ⚙️ Settings
        </button>
      </div>
    </header>

    <main class="conversation-area">
      <InfiniteCanvas>
        <ConversationNode v-if="store.getRootNode" :node-id="store.getRootNode.id" />
      </InfiniteCanvas>
    </main>

    <SettingsModal v-if="showSettings" @close="closeSettings" />
  </div>
</template>

<style scoped>
.conversation-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-header {
  background: rgba(45, 45, 45, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #e0e0e0;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  flex-shrink: 0;
  border-bottom: 1px solid rgba(64, 64, 64, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h1 {
  font-size: 20px;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
}

.btn-back {
  padding: 8px 16px;
  border: 1px solid #505050;
  border-radius: 6px;
  background: #3a3a3a;
  color: #e0e0e0;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-back:hover {
  background: #454545;
  border-color: #606060;
}

.btn-settings {
  padding: 8px 16px;
  border: 1px solid #505050;
  border-radius: 6px;
  background: #3a3a3a;
  color: #e0e0e0;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-settings:hover {
  background: #454545;
  border-color: #606060;
}

.conversation-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #1a1a1a;
  min-height: 0;
}

.api-key-warning {
  width: 100%;
  background: #dc3545;
  color: white;
  padding: 12px 24px;
  text-align: center;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.api-key-warning:hover {
  background: #c82333;
}
</style>
