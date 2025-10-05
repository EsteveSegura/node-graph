<script setup>
import { onMounted } from 'vue'
import ConversationNode from './components/ConversationNode'
import InfiniteCanvas from './components/InfiniteCanvas.vue'
import { useConversationStore } from './stores/conversation'

const store = useConversationStore()

onMounted(() => {
  store.initialize()
})
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Conversación como Grafo Top→Bottom</h1>
      <p class="subtitle">MVP - Árbol de conversación con LLM</p>
    </header>

    <main class="conversation-area">
      <InfiniteCanvas>
        <ConversationNode v-if="store.getRootNode" :node-id="store.getRootNode.id" />
      </InfiniteCanvas>
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #1a1a1a;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-header {
  background: #2d2d2d;
  color: #e0e0e0;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  flex-shrink: 0;
  border-bottom: 1px solid #404040;
}

.app-header h1 {
  font-size: 24px;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #a0a0a0;
}

.conversation-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #1a1a1a;
  min-height: 0;
}
</style>
