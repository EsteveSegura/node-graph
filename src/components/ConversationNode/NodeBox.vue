<script setup>
import { useNodeLabels } from '../../composables/useNodeLabels'
import { computed, ref } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  canAddLlm: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['add-user-child', 'add-llm-child', 'update-text'])

const { nodeTypeLabel } = useNodeLabels(computed(() => props.node))

// Exponer el elemento raíz para que pueda ser accedido por el padre
const nodeBoxEl = ref(null)
defineExpose({ nodeBoxEl })
</script>

<template>
  <div
    ref="nodeBoxEl"
    class="node-box"
    :class="[`node-${node.type}`, { 'has-children': node.children.length > 0 }]"
  >
    <div class="node-header">
      <span class="node-type">{{ nodeTypeLabel }}</span>
      <span class="node-id">{{ node.id }}</span>
    </div>

    <textarea
      class="node-content"
      :value="node.text"
      @input="emit('update-text', $event)"
      rows="4"
      placeholder="Escribe aquí..."
    />

    <div class="node-actions">
      <button
        v-if="node.type === 'system' || node.type === 'llm'"
        @click="emit('add-user-child')"
        class="btn-action"
      >
        ➕ Branch: User Prompt
      </button>

      <button
        v-if="node.type === 'user'"
        @click="emit('add-llm-child')"
        :disabled="!canAddLlm"
        class="btn-action"
        :class="{ disabled: !canAddLlm }"
      >
        ↳ Generar LLM Response
      </button>
    </div>
  </div>
</template>

<style scoped>
.node-box {
  width: 450px;
  border: 2px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  position: relative;
  z-index: 2;
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
  z-index: 3;
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
</style>
