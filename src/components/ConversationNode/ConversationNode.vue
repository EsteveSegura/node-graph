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

// Refs locales para elementos DOM
const containerRef = ref(null)
const parentBoxRef = ref(null)

// Composables
const {
  node,
  canAddLlm,
  handleAddUserChild,
  handleAddLlmChild,
  handleUpdateText,
  handleRegenerate
} = useNodeActions(props.nodeId)

// Computed para obtener el elemento real de NodeBox
const parentBoxElement = computed(() => parentBoxRef.value?.nodeBoxEl)

const {
  svgSize,
  edges
} = useNodeConnectors(node, containerRef, parentBoxElement)
</script>

<template>
  <div v-if="node" class="node-container child-column" ref="containerRef">
    <!-- Capa SVG para las líneas -->
    <NodeConnectorsSVG
      :edges="edges"
      :svgSize="svgSize"
      :hasChildren="node.children.length > 0"
    />

    <!-- Caja del nodo -->
    <NodeBox
      ref="parentBoxRef"
      :node="node"
      :canAddLlm="canAddLlm"
      @add-user-child="handleAddUserChild"
      @add-llm-child="handleAddLlmChild"
      @update-text="handleUpdateText"
      @regenerate="handleRegenerate"
    />

    <!-- Hijos (horizontal) -->
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
/* --- Layout del nodo --- */
.node-container {
  position: relative; /* necesario para posicionar el SVG encima */
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

/* Punto conector superior - para todos los nodos hijo */
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
