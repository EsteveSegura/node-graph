<script setup>
import { computed } from 'vue'
import { useConversationStore } from '../stores/conversation'

const props = defineProps({
  nodeId: {
    type: String,
    required: true
  }
})

const store = useConversationStore()

const node = computed(() => store.getNodeById(props.nodeId))

const canAddLlm = computed(() => store.canAddLlmChild(props.nodeId))

const nodeTypeLabel = computed(() => {
  const labels = {
    system: 'System',
    user: 'User Prompt',
    llm: 'LLM Response'
  }
  return labels[node.value?.type] || 'Unknown'
})

const handleAddUserChild = () => {
  try {
    store.addChild(props.nodeId, 'user')
  } catch (error) {
    console.error('Error adding user child:', error)
  }
}

const handleAddLlmChild = () => {
  try {
    store.addChild(props.nodeId, 'llm')
  } catch (error) {
    console.error('Error adding llm child:', error)
  }
}

const handleUpdateText = (event) => {
  store.updateText(props.nodeId, event.target.value)
}
</script>

<template>
  <div v-if="node" class="node-container">
    <div class="node-box" :class="`node-${node.type}`">
      <div class="node-header">
        <span class="node-type">{{ nodeTypeLabel }}</span>
        <span class="node-id">{{ node.id }}</span>
      </div>

      <textarea
        class="node-content"
        :value="node.text"
        @input="handleUpdateText"
        rows="4"
        placeholder="Escribe aquí..."
      />

      <div class="node-actions">
        <button
          v-if="node.type === 'system' || node.type === 'llm'"
          @click="handleAddUserChild"
          class="btn-action"
        >
          ➕ Branch: User Prompt
        </button>

        <button
          v-if="node.type === 'user'"
          @click="handleAddLlmChild"
          :disabled="!canAddLlm"
          class="btn-action"
          :class="{ disabled: !canAddLlm }"
        >
          ↳ Generar LLM Response
        </button>
      </div>
    </div>

    <!-- Guía vertical decorativa -->
    <div v-if="node.children.length > 0" class="vertical-guide"></div>

    <!-- Contenedor horizontal para hijos -->
    <div v-if="node.children.length > 0" class="children-container">
      <ConversationNode
        v-for="childId in node.children"
        :key="childId"
        :node-id="childId"
        class="child-column"
      />
    </div>
  </div>
</template>

<style scoped>
.node-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px;
}

.node-box {
  width: 400px;
  border: 2px solid #ccc;
  border-radius: 8px;
  padding: 12px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.node-system {
  border-color: #4a90e2;
  background: #f0f7ff;
}

.node-user {
  border-color: #50c878;
  background: #f0fff4;
}

.node-llm {
  border-color: #ff6b6b;
  background: #fff5f5;
}

.node-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: bold;
  font-size: 14px;
}

.node-type {
  color: #333;
}

.node-id {
  color: #888;
  font-size: 12px;
}

.node-content {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  min-height: 60px;
}

.node-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-action {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-action:hover:not(.disabled) {
  background: #f0f0f0;
  border-color: #999;
}

.btn-action.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vertical-guide {
  width: 2px;
  height: 20px;
  background: #ccc;
  margin: 4px 0;
}

.children-container {
  display: flex;
  flex-direction: row;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.child-column {
  flex: 0 0 auto;
}
</style>
