<script setup>
import { onMounted } from 'vue'
import ConversationNode from './components/ConversationNode.vue'
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
      <ConversationNode v-if="store.getRootNode" :node-id="store.getRootNode.id" />
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
  background: #f5f5f5;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: #2c3e50;
  color: white;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.app-header h1 {
  font-size: 24px;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  opacity: 0.8;
}

.conversation-area {
  flex: 1;
  padding: 40px 20px;
  overflow-x: auto;
  overflow-y: auto;
  min-width: 0; /* permite que el flex item se encoja */
}

/* Wrapper interno para centrar cuando el contenido es pequeño */
.conversation-area > * {
  min-width: min-content;
  margin: 0 auto;
}
</style>
