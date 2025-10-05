import { ref, reactive, onMounted, onBeforeUnmount, onUpdated, nextTick, watch } from 'vue'

/**
 * Composable para gestionar las líneas conectoras SVG entre nodos padre e hijos
 * @param {Ref} node - Nodo reactivo
 * @param {Ref} containerRef - Ref al elemento contenedor
 * @param {Ref} parentBoxRef - Ref al elemento node-box del padre
 */
export function useNodeConnectors(node, containerRef, parentBoxRef) {

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

  return {
    svgSize,
    edges
  }
}
