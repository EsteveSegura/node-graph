<script setup>
import { ref, onMounted } from 'vue'
import ConversationNode from '../components/ConversationNode'
import InfiniteCanvas from '../components/InfiniteCanvas.vue'
import SettingsModal from '../components/SettingsModal.vue'
import { useConversationStore } from '../stores/conversation'

const store = useConversationStore()
const showSettings = ref(false)

onMounted(() => {
  store.initialize()
})

const openSettings = () => {
  showSettings.value = true
}

const closeSettings = () => {
  showSettings.value = false
}
</script>

<template>
  <div class="conversation-view">
    <header class="app-header">
      <div class="header-left">
        <h1>Conversation Graph</h1>
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

.header-left h1 {
  font-size: 20px;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
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
</style>
