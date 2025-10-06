<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConversationList } from '../composables/useConversationList'

const router = useRouter()
const { getConversationList, deleteConversation, formatRelativeTime } = useConversationList()

const conversations = ref([])

const loadConversations = () => {
  conversations.value = getConversationList()
}

const createNewConversation = () => {
  router.push('/t')
}

const handleDelete = (uuid) => {
  if (confirm('Are you sure you want to delete this conversation?')) {
    deleteConversation(uuid)
    loadConversations()
  }
}

const openConversation = (uuid) => {
  router.push(`/t/${uuid}`)
}

onMounted(() => {
  document.title = 'Conversation Graph'
  loadConversations()
})
</script>

<template>
  <div class="home-page">
    <div class="container">
      <header class="page-header">
        <h1>Conversation Graph</h1>
        <p class="subtitle">Your AI conversations, visualized as a tree</p>
      </header>

      <div class="actions">
        <button class="btn-new-conversation" @click="createNewConversation">
          ➕ New Conversation
        </button>
      </div>

      <div class="conversations-section">
        <h2 class="section-title">Recent Conversations</h2>

        <div v-if="conversations.length === 0" class="empty-state">
          <p>No conversations yet</p>
          <p class="empty-hint">Click "New Conversation" to get started</p>
        </div>

        <div v-else class="conversations-list">
          <div
            v-for="conv in conversations"
            :key="conv.uuid"
            class="conversation-item"
            @click="openConversation(conv.uuid)"
          >
            <div class="conversation-content">
              <h3 class="conversation-title">{{ conv.title }}</h3>
              <p class="conversation-meta">
                Updated {{ formatRelativeTime(conv.updatedAt) }}
                <span class="separator">•</span>
                {{ conv.nodeCount }} nodes
              </p>
            </div>
            <button
              class="btn-delete"
              @click.stop="handleDelete(conv.uuid)"
              title="Delete conversation"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #1a1a1a;
  background-image:
    linear-gradient(rgba(64, 64, 64, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(64, 64, 64, 0.3) 1px, transparent 1px);
  background-size: 20px 20px;
  color: #e0e0e0;
  padding: 40px 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 48px;
  font-weight: 300;
  margin: 0 0 10px 0;
}

.subtitle {
  font-size: 18px;
  color: #999;
  margin: 0;
}

.actions {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.btn-new-conversation {
  padding: 14px 28px;
  background: rgba(70, 130, 180, 0.2);
  border: 1px solid rgba(70, 130, 180, 0.5);
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.btn-new-conversation:hover {
  background: rgba(70, 130, 180, 0.3);
  border-color: rgba(70, 130, 180, 0.7);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(70, 130, 180, 0.3);
}

.conversations-section {
  background: rgba(45, 45, 45, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(64, 64, 64, 0.5);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.section-title {
  font-size: 24px;
  font-weight: 400;
  margin: 0 0 20px 0;
  color: #e0e0e0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state p {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.empty-hint {
  font-size: 14px;
  color: #777;
}

.conversations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.conversation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(55, 55, 55, 0.5);
  border: 1px solid rgba(64, 64, 64, 0.5);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.conversation-item:hover {
  background: rgba(65, 65, 65, 0.6);
  border-color: rgba(70, 130, 180, 0.5);
  transform: translateX(4px);
}

.conversation-content {
  flex: 1;
}

.conversation-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 6px 0;
  color: #e0e0e0;
}

.conversation-meta {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.separator {
  margin: 0 8px;
}

.btn-delete {
  background: transparent;
  border: 1px solid transparent;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
  opacity: 0.6;
}

.btn-delete:hover {
  opacity: 1;
  background: rgba(220, 53, 69, 0.2);
  border-color: rgba(220, 53, 69, 0.5);
}
</style>
