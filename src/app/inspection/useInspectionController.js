import { useCallback, useEffect, useMemo, useRef } from 'react'

import { computeInspectionProbe, computeWavePointDiagnostics } from '../../entities/shared/diagnostics/wavePointDiagnostics'
import { waveSpeed } from '../../entities/characteristic/equations'

function pointHoverKey(point) {
  if (!point) return 'none'
  const t = Number.isFinite(point.t) ? point.t.toFixed(5) : 'x'
  const y = Number.isFinite(point.Y) ? point.Y.toFixed(5) : 'x'
  const z = Number.isFinite(point.z) ? point.z.toFixed(5) : 'x'
  return `${point.branch ?? ''}|${point.curveType ?? ''}|${point.attachedCurve ?? ''}|${t}|${y}|${z}`
}

function shouldMoveTooltip(previous, next) {
  if (!previous) return true
  return Math.abs(previous.x - next.x) >= 2 || Math.abs(previous.y - next.y) >= 2
}

export function useInspectionController({
  params,
  inspectionModeEnabled,
  draggingCharacteristicPoint,
  inspectionCurveVisibility,
  showHugoniotMinus,
  showHugoniotPlus,
  showRarefactionSlow,
  showRarefactionFast,
  showCompositeSlow,
  showCompositeFast,
  showInflectionSlow,
  showInflectionFast,
  setInspectionProbesByBranch,
  setActiveBranch,
  setInspectedCurvePoint,
  setHoveredInspectionPoint,
  setHoverTooltipPosition,
  isOrbiting3DRef,
}) {
  const visibleCurves = useMemo(() => ({
    slow: {
      hugoniot: showHugoniotMinus,
      hugoniotMinus: inspectionCurveVisibility.slow?.hugoniotMinus,
      hugoniotPlus: inspectionCurveVisibility.slow?.hugoniotPlus,
      rarefaction: showRarefactionSlow,
      rarefactionProbe: inspectionCurveVisibility.slow?.rarefaction,
      composite: showCompositeSlow,
      inflection: showInflectionSlow,
    },
    fast: {
      hugoniot: showHugoniotPlus,
      hugoniotMinus: inspectionCurveVisibility.fast?.hugoniotMinus,
      hugoniotPlus: inspectionCurveVisibility.fast?.hugoniotPlus,
      rarefaction: showRarefactionFast,
      rarefactionProbe: inspectionCurveVisibility.fast?.rarefaction,
      composite: showCompositeFast,
      inflection: showInflectionFast,
    },
  }), [
    inspectionCurveVisibility,
    showCompositeFast,
    showCompositeSlow,
    showHugoniotMinus,
    showHugoniotPlus,
    showInflectionFast,
    showInflectionSlow,
    showRarefactionFast,
    showRarefactionSlow,
  ])

  const hoverFrameRef = useRef(null)
  const pendingTooltipPositionRef = useRef(null)
  const lastTooltipPositionRef = useRef(null)
  const lastHoveredPointKeyRef = useRef('none')

  useEffect(() => () => {
    if (hoverFrameRef.current) cancelAnimationFrame(hoverFrameRef.current)
  }, [])

  useEffect(() => {
    lastHoveredPointKeyRef.current = 'none'
    lastTooltipPositionRef.current = null
  }, [params])

  const decoratePoint = useCallback((point) => computeWavePointDiagnostics(point, params), [params])
  const decorateProbe = useCallback((point) => computeInspectionProbe(point, params), [params])

  const inspectCurvePoint = useCallback((point) => {
    setInspectedCurvePoint(decoratePoint(point))
  }, [decoratePoint, setInspectedCurvePoint])

  const hoverInspectionPoint = useCallback((point) => {
    if (draggingCharacteristicPoint || isOrbiting3DRef.current) return

    const nextKey = pointHoverKey(point)
    if (nextKey === lastHoveredPointKeyRef.current) return

    lastHoveredPointKeyRef.current = nextKey
    setHoveredInspectionPoint(point ? decoratePoint(point) : null)
  }, [decoratePoint, draggingCharacteristicPoint, isOrbiting3DRef, setHoveredInspectionPoint])

  const createInspectionProbe = useCallback((point) => {
    if (!inspectionModeEnabled || !point?.branch) return
    const isAttachedToCurve = Boolean(point.attachedCurve)
    const selected = decorateProbe({
      ...point,
      Y: Number.isFinite(point.Y) ? point.Y : 0,
      mode: isAttachedToCurve ? 'solution-arc' : 'characteristic',
      attachedCurve: point.attachedCurve ?? null,
      s: Number.isFinite(point.s) ? point.s : waveSpeed(point.t, point.z, params),
    })
    setInspectionProbesByBranch((prev) => ({ ...prev, [point.branch]: selected }))
    setActiveBranch(point.branch)
    setInspectedCurvePoint(decoratePoint({
      ...selected,
      curveType: isAttachedToCurve
        ? `Sonda em ${point.attachedCurve}`
        : point.branch === 'fast' ? 'Sonda em C_f' : 'Sonda em C_s',
      status: 'inspection-probe',
    }))
  }, [decoratePoint, decorateProbe, inspectionModeEnabled, params, setActiveBranch, setInspectedCurvePoint, setInspectionProbesByBranch])

  const moveInspectionProbe = useCallback((branch, point) => {
    if (!branch || !point) return
    setInspectionProbesByBranch((previous) => {
      const current = previous?.[branch]
      if (!current) return previous
      const moved = decorateProbe({
        ...current,
        ...point,
        branch,
        Y: Number.isFinite(point.Y) ? point.Y : current.Y ?? 0,
      })
      return { ...previous, [branch]: moved }
    })
  }, [decorateProbe, setInspectionProbesByBranch])

  const scenePointerMove = useCallback((event, hoveredInspectionPoint) => {
    if (!hoveredInspectionPoint) return

    pendingTooltipPositionRef.current = { x: event.clientX, y: event.clientY }
    if (hoverFrameRef.current) return

    hoverFrameRef.current = requestAnimationFrame(() => {
      hoverFrameRef.current = null
      const nextPosition = pendingTooltipPositionRef.current
      if (!nextPosition || !shouldMoveTooltip(lastTooltipPositionRef.current, nextPosition)) return

      lastTooltipPositionRef.current = nextPosition
      setHoverTooltipPosition(nextPosition)
    })
  }, [setHoverTooltipPosition])

  const scenePointerLeave = useCallback(() => {
    if (hoverFrameRef.current) {
      cancelAnimationFrame(hoverFrameRef.current)
      hoverFrameRef.current = null
    }
    pendingTooltipPositionRef.current = null
    lastTooltipPositionRef.current = null
    lastHoveredPointKeyRef.current = 'none'
    setHoverTooltipPosition(null)
    setHoveredInspectionPoint(null)
  }, [setHoverTooltipPosition, setHoveredInspectionPoint])

  return {
    visibleCurves,
    inspectCurvePoint,
    hoverInspectionPoint,
    createInspectionProbe,
    moveInspectionProbe,
    scenePointerMove,
    scenePointerLeave,
  }
}
