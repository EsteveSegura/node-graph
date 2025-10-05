<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const canvasRef = ref(null)
const contentRef = ref(null)

const pan = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, panX: 0, panY: 0 })

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
  centerContent()
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
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
      :style="{
        transform: `translate(${pan.x}px, ${pan.y}px)`
      }"
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
  background: #1a1a1a;
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
