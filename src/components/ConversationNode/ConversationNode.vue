<script setup>
import { ref, computed } from 'vue'
import NodeBox from './NodeBox.vue'
import NodeConnectorsSVG from './NodeConnectorsSVG.vue'
import { useNodeConnectors } from '../../composables/useNodeConnectors'
import { useNodeActions } from '../../composables/useNodeActions'

const props = defineProps({
  nodeId: {
    type: String,
    required: true
  }
})

// Local refs for DOM elements
const containerRef = ref(null)
const parentBoxRef = ref(null)

// Composables
const {
  node,
  canAddLlm,
  handleAddUserChild,
  handleAddLlmChild,
  handleUpdateText,
  handleRegenerate,
  handleDelete
} = useNodeActions(props.nodeId)

// Computed to get actual NodeBox element
const parentBoxElement = computed(() => parentBoxRef.value?.nodeBoxEl)

const {
  svgSize,
  edges
} = useNodeConnectors(node, containerRef, parentBoxElement)
</script>

<template>
  <div v-if="node" class="node-container child-column" ref="containerRef">
    <!-- SVG layer for lines -->
    <NodeConnectorsSVG
      :edges="edges"
      :svgSize="svgSize"
      :hasChildren="node.children.length > 0"
    />

    <!-- Node box -->
    <NodeBox
      ref="parentBoxRef"
      :node="node"
      :canAddLlm="canAddLlm"
      @add-user-child="handleAddUserChild"
      @add-llm-child="handleAddLlmChild"
      @update-text="handleUpdateText"
      @regenerate="handleRegenerate"
      @delete="handleDelete"
    />

    <!-- Children (horizontal) -->
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
/* --- Node layout --- */
.node-container {
  position: relative; /* needed to position SVG on top */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px;
}

.children-container {
  display: flex;
  flex-direction: row;
  gap: 40px;
  align-items: flex-start;
  margin-top: 20px;
  position: relative;
}

.child-column {
  flex: 0 0 auto;
  position: relative;
  z-index: 2;
}

/* Top connector dot - for all child nodes */
.child-column :deep(.node-box)::before {
  content: '';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  background: #606060;
  border-radius: 50%;
  border: 2px solid #1a1a1a;
  z-index: 3;
}
</style>
