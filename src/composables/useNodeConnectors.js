import { ref, reactive, onMounted, onBeforeUnmount, onUpdated, nextTick, watch } from 'vue'

/**
 * Composable to manage SVG connector lines between parent and child nodes
 * @param {Ref} node - Reactive node
 * @param {Ref} containerRef - Ref to container element
 * @param {Ref} parentBoxRef - Ref to parent's node-box element
 */
export function useNodeConnectors(node, containerRef, parentBoxRef) {

  const svgSize = reactive({ width: 0, height: 0 })
  const edges = reactive({
    trunk: null,          // {x1,y1,x2,y2}
    bar: null,            // {x1,y1,x2,y2}
    branches: []          // array of {x1,y1,x2,y2}
  })

  let resizeObs = null
  let rafId = 0

  const CONNECTOR_OFFSET_UP = 6    // tiny margin to not overlap child's dot
  const CONNECTOR_OFFSET_DOWN = 6  // margin to not overlap parent's dot

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

      // Container measurements for viewBox/relative coords
      svgSize.width = containerEl.offsetWidth
      svgSize.height = containerEl.offsetHeight

      // Helper to get position relative to container
      const getRelativePosition = (el) => {
        let x = 0, y = 0
        let current = el
        while (current && current !== containerEl) {
          x += current.offsetLeft
          y += current.offsetTop
          current = current.offsetParent
        }
        return { x, y }
      }

      // Get parent position relative to container
      const parentPos = getRelativePosition(parentEl)
      const parentCenterX = parentPos.x + parentEl.offsetWidth / 2
      const parentBottomY = parentPos.y + parentEl.offsetHeight

      // NOTE: direct children are components with "child-column" class at their root
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
        const pos = getRelativePosition(b)
        return pos.x + b.offsetWidth / 2
      })
      const childTopYs = childBoxes.map(b => {
        const pos = getRelativePosition(b)
        return pos.y
      })

      // Bar height: slightly above the top of the child(ren)
      const barY = Math.min(...childTopYs) - CONNECTOR_OFFSET_UP

      // Trunk goes down from parent center to the bar
      edges.trunk = {
        x1: parentCenterX,
        y1: parentBottomY + CONNECTOR_OFFSET_DOWN,
        x2: parentCenterX,
        y2: barY
      }

      // Bar must cover from leftmost to rightmost point
      // also including parent's x to guarantee connection
      const minX = Math.min(parentCenterX, ...childCentersX)
      const maxX = Math.max(parentCenterX, ...childCentersX)

      edges.bar = {
        x1: minX,
        y1: barY,
        x2: maxX,
        y2: barY
      }

      // Vertical branches from bar to top of each child
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

    // Also observe parent's box (changes from textarea)
    if (parentBoxRef.value) resizeObs.observe(parentBoxRef.value)

    // 🔑 Observe direct children (their boxes) to detect height/width changes
    const childBoxes = containerRef.value.querySelectorAll(':scope > .children-container .node-box')
    childBoxes.forEach(el => resizeObs.observe(el))

    // Also observe children container for layout changes
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

  return {
    svgSize,
    edges
  }
}
