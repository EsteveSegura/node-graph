<script setup>
import { ref, computed, provide, onMounted, onBeforeUnmount, nextTick } from 'vue'

const canvasRef = ref(null)
const contentRef = ref(null)

const pan = ref({ x: 0, y: 0 })
const zoom = ref(1.0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, panX: 0, panY: 0 })

// Zoom limits and sensitivity
const MIN_ZOOM = 0.25
const MAX_ZOOM = 2.5
const ZOOM_INTENSITY = 0.0015

// Provide zoom to child components
provide('canvasZoom', zoom)

// Combined transform style
const contentStyle = computed(() => ({
  transform: `translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value})`,
  transformOrigin: '0 0'
}))

const handleMouseDown = (event) => {
  // Solo iniciar drag si se hace clic en el fondo (no en nodos, botones, inputs)
  const target = event.target

  // Ignorar si el clic es en elementos interactivos
  if (
    target.closest('.node-box') ||
    target.closest('button') ||
    target.closest('textarea') ||
    target.closest('input')
  ) {
    return
  }

  isDragging.value = true
  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
    panX: pan.value.x,
    panY: pan.value.y
  }

  event.preventDefault()
}

const handleMouseMove = (event) => {
  if (!isDragging.value) return

  const deltaX = event.clientX - dragStart.value.x
  const deltaY = event.clientY - dragStart.value.y

  pan.value = {
    x: dragStart.value.panX + deltaX,
    y: dragStart.value.panY + deltaY
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleWheel = (event) => {
  // Ignore if over input elements
  if (event.target.closest('input, textarea, select')) return

  const rect = canvasRef.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // Smooth exponential zoom
  const factor = Math.exp(-event.deltaY * ZOOM_INTENSITY)
  const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.value * factor))
  const scale = newZoom / zoom.value

  if (scale === 1) return

  // Keep cursor position fixed: pan' = mouse - (mouse - pan) * scale
  pan.value = {
    x: mouseX - (mouseX - pan.value.x) * scale,
    y: mouseY - (mouseY - pan.value.y) * scale
  }

  zoom.value = newZoom
  event.preventDefault()
}

const centerContent = () => {
  nextTick(() => {
    if (!canvasRef.value || !contentRef.value) return

    const canvasRect = canvasRef.value.getBoundingClientRect()
    const contentRect = contentRef.value.getBoundingClientRect()

    // Centrar horizontalmente
    const centerX = (canvasRect.width - contentRect.width) / 2

    pan.value = {
      x: centerX,
      y: 40 // Padding top
    }
  })
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
  if (canvasRef.value) {
    canvasRef.value.addEventListener('wheel', handleWheel, { passive: false })
  }
  centerContent()
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  if (canvasRef.value) {
    canvasRef.value.removeEventListener('wheel', handleWheel)
  }
})
</script>

<template>
  <div
    ref="canvasRef"
    class="infinite-canvas"
    :class="{ 'is-dragging': isDragging }"
    @mousedown="handleMouseDown"
  >
    <div
      ref="contentRef"
      class="canvas-content"
      :style="contentStyle"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.infinite-canvas {
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: grab;
  position: relative;
  background-color: #1a1a1a;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
  background-size:
    20px 20px,
    20px 20px,
    100px 100px,
    100px 100px;
  background-position:
    -1px -1px,
    -1px -1px,
    -1px -1px,
    -1px -1px;
}

.infinite-canvas.is-dragging {
  cursor: grabbing;
  user-select: none;
}

.canvas-content {
  min-width: min-content;
  min-height: min-content;
  transition: transform 0.05s ease-out;
  will-change: transform;
}

.is-dragging .canvas-content {
  transition: none;
}
</style>
