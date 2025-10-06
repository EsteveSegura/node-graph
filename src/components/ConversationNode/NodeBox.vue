<script setup>
import { useNodeLabels } from '../../composables/useNodeLabels'
import { useConversationStore } from '../../stores/conversation'
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

const emit = defineEmits(['add-user-child', 'add-llm-child', 'update-text', 'regenerate', 'delete'])

const store = useConversationStore()
const { nodeTypeLabel } = useNodeLabels(computed(() => props.node))

const isGenerating = computed(() => store.isGenerating(props.node.id))
const hasChildren = computed(() => props.node.children.length > 0)
const shouldBeReadonly = computed(() =>
  hasChildren.value || props.node.type === 'llm'
)
const isEditing = ref(false)
const isRootNode = computed(() => props.node.type === 'system' && !props.node.parentId)

const MAX_COLLAPSED_LENGTH = 300
const isExpanded = ref(false)
const isLongText = computed(() => (props.node.text || '').length > MAX_COLLAPSED_LENGTH)
const displayText = computed(() => {
  if (!isLongText.value || isExpanded.value) {
    return props.node.text || 'No content...'
  }
  return (props.node.text || '').substring(0, MAX_COLLAPSED_LENGTH) + '...'
})

const toggleExpand = () => {
  if (isLongText.value) {
    isExpanded.value = !isExpanded.value
  }
}

const isCopied = ref(false)
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.node.text || '')
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const startEditing = () => {
  isEditing.value = true
}

const stopEditing = () => {
  if (shouldBeReadonly.value) {
    isEditing.value = false
  }
}

// Exponer el elemento raíz para que pueda ser accedido por el padre
const nodeBoxEl = ref(null)
defineExpose({ nodeBoxEl })
</script>

<template>
  <div
    ref="nodeBoxEl"
    class="node-box"
    :class="[`node-${node.type}`, { 'has-children': node.children.length > 0, 'is-generating': isGenerating }]"
  >
    <div class="node-header">
      <span class="node-type">
        {{ nodeTypeLabel }}
        <span v-if="isGenerating" class="generating-indicator">⏳ Generating...</span>
      </span>
      <span class="node-id">{{ node.id }}</span>
      <div class="header-actions">
        <button
          v-if="shouldBeReadonly && !isEditing"
          @click="copyToClipboard"
          class="btn-copy"
          :class="{ 'is-copied': isCopied }"
        >
          {{ isCopied ? '✓ Copied!' : '📋 Copy' }}
        </button>
        <button
          v-if="shouldBeReadonly && !isEditing"
          @click="startEditing"
          class="btn-edit"
        >
          ✏️ Edit
        </button>
        <button
          v-if="!isRootNode"
          @click="emit('delete')"
          class="btn-delete"
          :disabled="isGenerating"
        >
          🗑️
        </button>
      </div>
    </div>

    <textarea
      v-if="!shouldBeReadonly || isEditing"
      class="node-content"
      :value="node.text"
      @input="emit('update-text', $event)"
      @blur="stopEditing"
      :disabled="isGenerating"
      rows="4"
      placeholder="Write here..."
    />

    <div
      v-else
      class="node-content-readonly"
      :class="{ 'is-expandable': isLongText, 'is-expanded': isExpanded }"
      @click="toggleExpand"
    >
      <div class="readonly-text">{{ displayText }}</div>
      <div v-if="isLongText" class="expand-indicator">
        {{ isExpanded ? '▲ Click to collapse' : '▼ Click to expand' }}
      </div>
    </div>

    <div class="node-actions">
      <button
        v-if="node.type === 'system' || node.type === 'llm'"
        @click="emit('add-user-child')"
        :disabled="isGenerating"
        class="btn-action"
      >
        ➕ Branch: User Prompt
      </button>

      <button
        v-if="node.type === 'user'"
        @click="emit('add-llm-child')"
        :disabled="!canAddLlm || isGenerating"
        class="btn-action"
        :class="{ disabled: !canAddLlm || isGenerating }"
      >
        ↳ Generate LLM Response
      </button>

      <button
        v-if="node.type === 'llm' && !isGenerating"
        @click="emit('regenerate')"
        class="btn-action btn-regenerate"
      >
        🔄 Regenerate
      </button>
    </div>
  </div>
</template>

<style scoped>
.node-box {
  width: 450px;
  border: 2px solid #404040;
  border-radius: 8px;
  padding: 16px;
  background: #2d2d2d;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  position: relative;
  z-index: 2;
}

/* Bottom connector dot - for nodes with children */
.node-box.has-children::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  background: #606060;
  border-radius: 50%;
  border: 2px solid #1a1a1a;
  z-index: 3;
}

.node-system {
  border-color: #4a90e2;
  background: #1a2942;
}

.node-user {
  border-color: #50c878;
  background: #1a3325;
}

.node-llm {
  border-color: #ff6b6b;
  background: #3d1f1f;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: bold;
  font-size: 14px;
  gap: 8px;
}

.node-type {
  color: #e0e0e0;
  flex: 1;
}

.node-id {
  color: #808080;
  font-size: 12px;
  font-weight: normal;
}

.header-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.btn-copy,
.btn-edit,
.btn-delete {
  padding: 4px 10px;
  border: 1px solid #505050;
  border-radius: 4px;
  background: #3a3a3a;
  color: #e0e0e0;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-copy:hover,
.btn-edit:hover,
.btn-delete:hover:not(:disabled) {
  background: #454545;
  border-color: #606060;
}

.btn-copy.is-copied {
  background: #1a4d1a;
  border-color: #50c878;
  color: #50c878;
}

.btn-delete {
  padding: 4px 8px;
}

.btn-delete:hover:not(:disabled) {
  background: #4d2020;
  border-color: #ff6b6b;
}

.btn-delete:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.node-content {
  width: 100%;
  padding: 10px;
  border: 1px solid #404040;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  min-height: 80px;
  background: #1f1f1f;
  color: #e0e0e0;
}

.node-content:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.node-content-readonly {
  width: 100%;
  padding: 10px;
  border: 1px solid #353535;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  min-height: 80px;
  background: #252525;
  color: #a0a0a0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.node-content-readonly.is-expandable {
  cursor: pointer;
  transition: all 0.2s;
}

.node-content-readonly.is-expandable:hover {
  background: #2a2a2a;
  border-color: #404040;
}

.readonly-text {
  margin-bottom: 8px;
}

.expand-indicator {
  font-size: 12px;
  color: #4a90e2;
  font-weight: 500;
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid #353535;
  user-select: none;
}

.node-content-readonly.is-expandable:hover .expand-indicator {
  color: #5aa0f2;
}

.node-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.btn-action {
  padding: 8px 14px;
  border: 1px solid #505050;
  border-radius: 6px;
  background: #3a3a3a;
  color: #e0e0e0;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-action:hover:not(.disabled) {
  background: #454545;
  border-color: #606060;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.btn-action.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-regenerate {
  background: #3d3100;
  border-color: #ffaa00;
  color: #ffaa00;
}

.btn-regenerate:hover {
  background: #4d3d00;
  border-color: #ffbb33;
}

/* Generation indicator */
.generating-indicator {
  font-size: 11px;
  color: #ff8800;
  font-weight: normal;
  margin-left: 8px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.node-box.is-generating {
  border-color: #ffaa00 !important;
  box-shadow: 0 0 0 2px rgba(255, 170, 0, 0.2);
}

.node-box.is-generating .node-content {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
