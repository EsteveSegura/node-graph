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
    <div class="node-box" :class="[`node-${node.type}`, { 'has-children': node.children.length > 0 }]">
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
  padding: 0 16px;
}

.node-box {
  width: 450px;
  border: 2px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  position: relative;
}

/* Punto conector inferior - para nodos con hijos */
.node-box.has-children::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  background: #888;
  border-radius: 50%;
  border: 2px solid white;
  z-index: 2;
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
  align-items: center;
  margin-bottom: 12px;
  font-weight: bold;
  font-size: 14px;
}

.node-type {
  color: #333;
}

.node-id {
  color: #888;
  font-size: 12px;
  font-weight: normal;
}

.node-content {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  min-height: 80px;
}

.node-content:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
}

.node-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.btn-action {
  padding: 8px 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-action:hover:not(.disabled) {
  background: #f8f8f8;
  border-color: #999;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-action.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.children-container {
  display: flex;
  flex-direction: row;
  gap: 40px;
  align-items: flex-start;
  margin-top: 20px;
}

.child-column {
  flex: 0 0 auto;
  position: relative;
}

/* Punto conector superior - para todos los nodos hijo */
.child-column .node-box::before {
  content: '';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  background: #888;
  border-radius: 50%;
  border: 2px solid white;
  z-index: 2;
}
</style>
