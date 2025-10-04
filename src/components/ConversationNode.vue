<script setup>
import { computed, ref, reactive, onMounted, onBeforeUnmount, onUpdated, nextTick, watch } from 'vue'
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

/* ---------------------------- Líneas (SVG) ---------------------------- */
const containerRef = ref(null)     // raíz del nodo actual
const parentBoxRef = ref(null)     // .node-box del nodo actual

const svgSize = reactive({ width: 0, height: 0 })
const edges = reactive({
  trunk: null,          // {x1,y1,x2,y2}
  bar: null,            // {x1,y1,x2,y2}
  branches: []          // array de {x1,y1,x2,y2}
})

let resizeObs = null
let rafId = 0

const CONNECTOR_OFFSET_UP = 6    // pequeñísimo margen para no pisar el punto del hijo
const CONNECTOR_OFFSET_DOWN = 6  // margen para no pisar el punto del padre

function scheduleCompute() {
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    computeEdges()
  })
}

function computeEdges() {
  nextTick(() => {
    const containerEl = containerRef.value
    const parentEl = parentBoxRef.value
    if (!containerEl || !parentEl || !node.value) {
      edges.trunk = null
      edges.bar = null
      edges.branches = []
      return
    }

    // Medidas del contenedor para el viewBox/coords relativas
    svgSize.width = containerEl.offsetWidth
    svgSize.height = containerEl.offsetHeight

    const containerRect = containerEl.getBoundingClientRect()
    const parentRect = parentEl.getBoundingClientRect()
    const parentCenterX = parentRect.left - containerRect.left + parentRect.width / 2
    const parentBottomY = parentRect.bottom - containerRect.top

    // OJO: los hijos directos son componentes con clase "child-column" en su raíz.
    const childContainers = containerEl.querySelectorAll(':scope > .children-container > .child-column')
    const childBoxes = Array.from(childContainers)
      .map(c => c.querySelector('.node-box'))
      .filter(Boolean)

    if (!childBoxes.length) {
      edges.trunk = null
      edges.bar = null
      edges.branches = []
      return
    }

    const childCentersX = childBoxes.map(b => {
      const r = b.getBoundingClientRect()
      return r.left - containerRect.left + r.width / 2
    })
    const childTopYs = childBoxes.map(b => b.getBoundingClientRect().top - containerRect.top)

    // Altura de la barra: un poco por encima del tope del/los hijos
    const barY = Math.min(...childTopYs) - CONNECTOR_OFFSET_UP

    // El tronco baja desde el centro del padre hasta la barra
    edges.trunk = {
      x1: parentCenterX,
      y1: parentBottomY + CONNECTOR_OFFSET_DOWN,
      x2: parentCenterX,
      y2: barY
    }

    // La barra debe cubrir desde el punto más a la izquierda hasta el más a la derecha
    // incluyendo también la x del padre para garantizar la conexión.
    const minX = Math.min(parentCenterX, ...childCentersX)
    const maxX = Math.max(parentCenterX, ...childCentersX)

    edges.bar = {
      x1: minX,
      y1: barY,
      x2: maxX,
      y2: barY
    }

    // Ramitas verticales desde la barra hasta el top de cada hijo
    edges.branches = childCentersX.map((x, i) => ({
      x1: x,
      y1: barY,
      x2: x,
      y2: childTopYs[i] - CONNECTOR_OFFSET_UP
    }))
  })
}

function setupObservers() {
  cleanupObservers()
  if (!containerRef.value) return

  resizeObs = new ResizeObserver(() => scheduleCompute())
  resizeObs.observe(containerRef.value)

  // También observamos el propio box del padre (cambios por textarea)
  if (parentBoxRef.value) resizeObs.observe(parentBoxRef.value)

  // 🔑 Observar los hijos directos (sus cajas) para detectar cambios de alto/ancho
  const childBoxes = containerRef.value.querySelectorAll(':scope > .children-container .node-box')
  childBoxes.forEach(el => resizeObs.observe(el))

  // También observar el contenedor de hijos por cambios de layout
  const childrenContainer = containerRef.value.querySelector(':scope > .children-container')
  if (childrenContainer) resizeObs.observe(childrenContainer)
}

function cleanupObservers() {
  if (resizeObs) {
    resizeObs.disconnect()
    resizeObs = null
  }
}

onMounted(() => {
  setupObservers()
  scheduleCompute()
})

// Recalcular tras cualquier update del componente
onUpdated(() => {
  scheduleCompute()
})

// Recalcular cuando cambia el número de hijos (añadir/eliminar)
watch(() => node.value?.children?.length, () => {
  nextTick(() => {
    setupObservers()  // reatacha a los nuevos .child .node-box
    scheduleCompute() // mide en el frame siguiente
  })
})

// Recalcular en resize de ventana
const onWinResize = () => scheduleCompute()
if (typeof window !== 'undefined') {
  window.addEventListener('resize', onWinResize)
}

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  cleanupObservers()
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onWinResize)
  }
})
</script>

<template>
  <div v-if="node" class="node-container child-column" ref="containerRef">
    <!-- Capa SVG para las líneas -->
    <svg
      v-if="node.children.length > 0"
      class="edges-svg"
      :viewBox="`0 0 ${svgSize.width} ${svgSize.height}`"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <!-- Tronco vertical -->
      <line
        v-if="edges.trunk"
        :x1="edges.trunk.x1" :y1="edges.trunk.y1"
        :x2="edges.trunk.x2" :y2="edges.trunk.y2"
        class="edge-line"
      />
      <!-- Barra horizontal -->
      <line
        v-if="edges.bar && edges.bar.x1 !== edges.bar.x2"
        :x1="edges.bar.x1" :y1="edges.bar.y1"
        :x2="edges.bar.x2" :y2="edges.bar.y2"
        class="edge-line"
      />
      <!-- Ramitas a cada hijo -->
      <line
        v-for="(b, i) in edges.branches"
        :key="i"
        :x1="b.x1" :y1="b.y1"
        :x2="b.x2" :y2="b.y2"
        class="edge-line"
      />
    </svg>

    <div class="node-box" ref="parentBoxRef" :class="[`node-${node.type}`, { 'has-children': node.children.length > 0 }]">
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

.node-box {
  width: 450px;
  border: 2px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  position: relative;
  z-index: 2; /* por encima de las líneas */
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

.children-container {
  display: flex;
  flex-direction: row;
  gap: 40px;
  align-items: flex-start;
  margin-top: 20px;
  position: relative; /* opcional, por si quieres más control local */
}

.child-column {
  flex: 0 0 auto;
  position: relative;
  z-index: 2; /* por encima de las líneas */
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
  z-index: 3;
}

/* --- Capa de líneas --- */
.edges-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;           /* debajo de las cajas y puntos */
  pointer-events: none; /* no bloquear clics */
}

.edge-line {
  stroke: #B0B0B0;
  stroke-width: 2;
  stroke-linecap: round;
  shape-rendering: geometricPrecision;
}
</style>
