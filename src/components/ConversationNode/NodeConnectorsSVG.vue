<script setup>
defineProps({
  edges: {
    type: Object,
    required: true
  },
  svgSize: {
    type: Object,
    required: true
  },
  hasChildren: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <svg
    v-if="hasChildren"
    class="edges-svg"
    :viewBox="`0 0 ${svgSize.width} ${svgSize.height}`"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <!-- Tronco vertical -->
    <line
      v-if="edges.trunk"
      :x1="edges.trunk.x1"
      :y1="edges.trunk.y1"
      :x2="edges.trunk.x2"
      :y2="edges.trunk.y2"
      class="edge-line"
      vector-effect="non-scaling-stroke"
    />
    <!-- Barra horizontal -->
    <line
      v-if="edges.bar && edges.bar.x1 !== edges.bar.x2"
      :x1="edges.bar.x1"
      :y1="edges.bar.y1"
      :x2="edges.bar.x2"
      :y2="edges.bar.y2"
      class="edge-line"
      vector-effect="non-scaling-stroke"
    />
    <!-- Ramitas a cada hijo -->
    <line
      v-for="(b, i) in edges.branches"
      :key="i"
      :x1="b.x1"
      :y1="b.y1"
      :x2="b.x2"
      :y2="b.y2"
      class="edge-line"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>

<style scoped>
.edges-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.edge-line {
  stroke: #606060;
  stroke-width: 2;
  stroke-linecap: round;
  shape-rendering: geometricPrecision;
}
</style>
