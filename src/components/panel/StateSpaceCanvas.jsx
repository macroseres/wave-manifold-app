import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MathLabel from './MathLabel'
import { formatNumber } from '../../ui/display'
import { buildImplicitHysPlusMinusStateSegments, buildImplicitHysPlusPlusStateSegments } from '../../entities/stateSpace/hysteresisSegments'
import {
  buildCharacteristicProjectionSamples,
  buildImplicitInflectionStateSegments,
  buildImplicitHugoniotMinusStateSegments,
  buildImplicitCoincidenceStateSegments,
  buildSonicRightSeparatorMinusProjection,
  buildSonicLeftSeparatorPlusProjection,
  stateFromScreenPoint,
  refineCharacteristicProjectionFromState,
  projectionBounds,
} from '../../geometry/stateSpaceProjection.js'
import { drawSolutionCanvas, drawStateSpaceCanvas } from '../../entities/stateSpace/canvasDrawing'
import { coordsOf, PROBE_Z_EXTENSION_MARGIN, sampleHugoniot, sampleRarefaction, withStates } from '../../entities/inspection/probeHelpers.jsx'
import { FORWARD_HUGONIOT, BACKWARD_HUGONIOT } from '../../entities/hugoniot/directions.js'

function projectProbeSegments(segments, side, params) {
  return (segments ?? []).map((segment) => (segment ?? []).map((point) => {
    const coords = coordsOf(point)
    if (!coords) return null
    const normalized = Array.isArray(point)
      ? { t: coords[0], Y: coords[1], z: coords[2], coords }
      : { ...point, t: coords[0], Y: coords[1], z: coords[2], coords }
    const decorated = withStates(normalized, params)
    const u = side === 'plus' ? decorated.uPlus : decorated.uMinus
    const v = side === 'plus' ? decorated.vPlus : decorated.vMinus
    return { manifold: decorated, state: { u, v } }
  }).filter((sample) => sample && Number.isFinite(sample.state.u) && Number.isFinite(sample.state.v)))
    .filter((segment) => segment.length >= 2)
}

function StateSpaceCanvas({
  params,
  view,
  probeView = view,
  selectedEntries = [],
  onSelectCharacteristicPoint,
  showInflectionSlow = false,
  showInflectionFast = false,
  showCoincidence = false,
  showHysteresis = false,
  showHugoniotMinus = false,
  showExtensionCoincidenceMinus = false,
  showExtensionCoincidencePlus = false,
  inspectionModeEnabled = false,
  inspectionProbesByBranch = { slow: null, fast: null },
  inspectionCurveVisibility = null,
  onMoveInspectionProbe = null,
  resolution = 40,
}) {
  const canvasRef = useRef(null)
  const draggingBranchRef = useRef(null)
  const draggingProbeBranchRef = useRef(null)
  const pendingDragSampleRef = useRef(null)
  const pendingProbeSampleRef = useRef(null)
  const dragFrameRef = useRef(null)
  const probeFrameRef = useRef(null)
  const [hoverBranch, setHoverBranch] = useState(null)

  const samples = useMemo(() => {
    const slow = buildCharacteristicProjectionSamples(view, params, 'slow')
    const fast = buildCharacteristicProjectionSamples(view, params, 'fast')
    return { slow, fast, all: [...slow, ...fast] }
  }, [view, params])
  const selectedMap = useMemo(() => Object.fromEntries(selectedEntries.map((entry) => [entry.branch, entry])), [selectedEntries])

  const probeProjection = useMemo(() => {
    const result = {}
    const hugoniotSamples = Math.max(220, Math.min(520, resolution * 7))
    const rarefactionSamples = Math.max(260, Math.min(720, resolution * 8))
    for (const branch of ['slow', 'fast']) {
      const point = inspectionProbesByBranch?.[branch]
      if (!point) continue
      const decorated = withStates(point, params)
      const visibility = inspectionCurveVisibility?.[branch] ?? {}
      const drawRarefaction = point.mode === 'characteristic' || !point.attachedCurve || point.attachedCurve === 'J'
      const minusSegments = point.attachedCurve === 'H_-' || visibility.hugoniotMinus === false
        ? []
        : sampleHugoniot({ point: decorated, params, view: probeView, direction: FORWARD_HUGONIOT, samples: hugoniotSamples, zExtensionMargin: PROBE_Z_EXTENSION_MARGIN })
      const plusSegments = point.attachedCurve === 'H_+' || visibility.hugoniotPlus === false
        ? []
        : sampleHugoniot({ point: decorated, params, view: probeView, direction: BACKWARD_HUGONIOT, samples: hugoniotSamples, zExtensionMargin: PROBE_Z_EXTENSION_MARGIN })
      const rarefactionSegments = drawRarefaction && visibility.rarefaction !== false
        ? sampleRarefaction({ point: decorated, params, view: probeView, branch, samples: rarefactionSamples, zExtensionMargin: PROBE_Z_EXTENSION_MARGIN })
        : []
      result[branch] = {
        point: decorated,
        minusSegments: projectProbeSegments(minusSegments, 'plus', params),
        plusSegments: projectProbeSegments(plusSegments, 'minus', params),
        rarefactionSegments: projectProbeSegments(rarefactionSegments, branch === 'slow' ? 'plus' : 'minus', params),
      }
    }
    return result
  }, [inspectionProbesByBranch, inspectionCurveVisibility, params, probeView, resolution])

  const bounds = useMemo(() => {
    const probeSamples = Object.values(probeProjection).flatMap((projection) => [
      ...(projection.minusSegments ?? []).flat(),
      ...(projection.plusSegments ?? []).flat(),
      ...(projection.rarefactionSegments ?? []).flat(),
      { state: { u: projection.point?.uMinus, v: projection.point?.vMinus } },
      { state: { u: projection.point?.uPlus, v: projection.point?.vPlus } },
    ])
    return projectionBounds([...samples.all, ...probeSamples])
  }, [samples, probeProjection])

  const hysPlusProjectionSegments = useMemo(() => ({
    minus: showHysteresis ? buildImplicitHysPlusMinusStateSegments(bounds, params, 420) : [],
    plus: showHysteresis ? buildImplicitHysPlusPlusStateSegments(bounds, params, 420) : [],
  }), [bounds, params, showHysteresis])

  const implicitInflectionSegments = useMemo(() => (
    (showInflectionSlow || showInflectionFast)
      ? buildImplicitInflectionStateSegments(bounds, params, 220)
      : []
  ), [bounds, params, showInflectionSlow, showInflectionFast])
  // A coincidência é sempre necessária aqui: além de poder ser exibida
  // como curva, ela é a fronteira tau=0 compartilhada pelas características.
  const implicitCoincidenceSegments = useMemo(() => (
    buildImplicitCoincidenceStateSegments(bounds, params, 260)
  ), [bounds, params])
  const implicitHugoniotMinusSegments = useMemo(() => (
    showHugoniotMinus
      ? buildImplicitHugoniotMinusStateSegments(bounds, selectedMap.slow?.selectedState, params, 260)
      : []
  ), [bounds, selectedMap, params, showHugoniotMinus])
  const sonicRightSeparatorMinusSegments = useMemo(() => (
    showExtensionCoincidencePlus ? buildSonicRightSeparatorMinusProjection(bounds, params) : []
  ), [bounds, params, showExtensionCoincidencePlus])
  const sonicLeftSeparatorPlusSegments = useMemo(() => (
    showExtensionCoincidenceMinus ? buildSonicLeftSeparatorPlusProjection(bounds, params) : []
  ), [bounds, params, showExtensionCoincidenceMinus])

  const statePercent = (state) => {
    if (!state || !Number.isFinite(state.uMinus) || !Number.isFinite(state.vMinus)) return null
    const left = ((state.uMinus - bounds.uMin) / Math.max(1e-12, bounds.uMax - bounds.uMin)) * 100
    const top = ((bounds.vMax - state.vMinus) / Math.max(1e-12, bounds.vMax - bounds.vMin)) * 100
    return { left, top }
  }

  const selectedLabelPosition = (branch) => statePercent(selectedMap[branch]?.selectedState)

  const projectedStatePercent = (state) => {
    if (!state || !Number.isFinite(state.u) || !Number.isFinite(state.v)) return null
    const left = ((state.u - bounds.uMin) / Math.max(1e-12, bounds.uMax - bounds.uMin)) * 100
    const top = ((bounds.vMax - state.v) / Math.max(1e-12, bounds.vMax - bounds.vMin)) * 100
    return { left, top }
  }

  const axisLabelPositions = useMemo(() => {
    const axisUPercent = bounds.uMin <= 0 && bounds.uMax >= 0
      ? ((0 - bounds.uMin) / Math.max(1e-12, bounds.uMax - bounds.uMin)) * 100
      : 50
    const axisVPercent = bounds.vMin <= 0 && bounds.vMax >= 0
      ? ((bounds.vMax - 0) / Math.max(1e-12, bounds.vMax - bounds.vMin)) * 100
      : 50
    return { axisUPercent, axisVPercent }
  }, [bounds])

  const toScreen = useCallback((state, rect) => {
    const x = ((state.u - bounds.uMin) / Math.max(1e-12, bounds.uMax - bounds.uMin)) * rect.width
    const y = ((bounds.vMax - state.v) / Math.max(1e-12, bounds.vMax - bounds.vMin)) * rect.height
    return { x, y }
  }, [bounds])

  const fromEvent = (event) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, rect }
  }

  const pointOnCharacteristicFromEvent = (branch, event) => {
    const pointer = fromEvent(event)
    if (!pointer) return null
    const targetState = stateFromScreenPoint(pointer, bounds)
    const projected = refineCharacteristicProjectionFromState(targetState, view, params, branch, bounds)
    if (!projected) return null
    const screen = toScreen(projected.state, pointer.rect)
    return {
      ...projected,
      screenDistance: Math.hypot(pointer.x - screen.x, pointer.y - screen.y),
    }
  }

  const selectedScreenDistance = (branch, event) => {
    const pointer = fromEvent(event)
    const entry = selectedMap[branch]
    const state = entry?.selectedState
    if (!pointer || !state || !Number.isFinite(state.uMinus) || !Number.isFinite(state.vMinus)) {
      return Number.POSITIVE_INFINITY
    }
    const screen = toScreen({ u: state.uMinus, v: state.vMinus }, pointer.rect)
    return Math.hypot(pointer.x - screen.x, pointer.y - screen.y)
  }

  const probeScreenDistance = (branch, event) => {
    const pointer = fromEvent(event)
    const point = probeProjection?.[branch]?.point
    if (!pointer || !Number.isFinite(point?.uMinus) || !Number.isFinite(point?.vMinus)) return Number.POSITIVE_INFINITY
    const screen = toScreen({ u: point.uMinus, v: point.vMinus }, pointer.rect)
    return Math.hypot(pointer.x - screen.x, pointer.y - screen.y)
  }

  const probePointFromEvent = (branch, event) => {
    const current = inspectionProbesByBranch?.[branch]
    if (!current) return null
    if (current.mode === 'characteristic' || !current.attachedCurve) {
      const projected = pointOnCharacteristicFromEvent(branch, event)
      return projected?.manifold ? { ...projected.manifold, branch, Y: 0, mode: 'characteristic', attachedCurve: null } : null
    }
    const pointer = fromEvent(event)
    if (!pointer) return null
    const samplesOnCurves = [
      ...(probeProjection?.[branch]?.minusSegments ?? []).flat(),
      ...(probeProjection?.[branch]?.plusSegments ?? []).flat(),
      ...(probeProjection?.[branch]?.rarefactionSegments ?? []).flat(),
    ]
    let nearest = null
    let distance = Number.POSITIVE_INFINITY
    for (const sample of samplesOnCurves) {
      const screen = toScreen(sample.state, pointer.rect)
      const candidateDistance = Math.hypot(pointer.x - screen.x, pointer.y - screen.y)
      if (candidateDistance < distance) { distance = candidateDistance; nearest = sample }
    }
    return nearest?.manifold ? { ...current, ...nearest.manifold, branch } : null
  }

  useEffect(() => () => {
    if (dragFrameRef.current) cancelAnimationFrame(dragFrameRef.current)
    if (probeFrameRef.current) cancelAnimationFrame(probeFrameRef.current)
  }, [])

  const scheduleProbeUpdate = (branch, point) => {
    pendingProbeSampleRef.current = { branch, point }
    if (probeFrameRef.current) return
    probeFrameRef.current = requestAnimationFrame(() => {
      probeFrameRef.current = null
      const pending = pendingProbeSampleRef.current
      pendingProbeSampleRef.current = null
      if (pending) onMoveInspectionProbe?.(pending.branch, pending.point, { dragging: true })
    })
  }

  const flushScheduledBranchUpdate = () => {
    dragFrameRef.current = null
    const pending = pendingDragSampleRef.current
    pendingDragSampleRef.current = null
    if (!pending) return
    onSelectCharacteristicPoint?.(
      { ...pending.sample.manifold, branch: pending.branch },
      { dragging: true },
    )
  }

  const scheduleBranchUpdate = (branch, sample) => {
    pendingDragSampleRef.current = { branch, sample }
    if (!dragFrameRef.current) {
      dragFrameRef.current = requestAnimationFrame(flushScheduledBranchUpdate)
    }
  }

  const updateBranchFromEvent = (branch, event) => {
    const sample = pointOnCharacteristicFromEvent(branch, event)
    if (!sample) return
    scheduleBranchUpdate(branch, sample)
  }

  const handlePointerDown = (event) => {
    if (inspectionModeEnabled) {
      const candidates = ['slow', 'fast']
        .map((branch) => ({ branch, distance: probeScreenDistance(branch, event) }))
        .sort((a, b) => a.distance - b.distance)
      if (candidates[0]?.distance > 20) return
      event.preventDefault()
      event.stopPropagation()
      draggingProbeBranchRef.current = candidates[0].branch
      setHoverBranch(candidates[0].branch)
      event.currentTarget.setPointerCapture?.(event.pointerId)
      return
    }
    const candidates = ['slow', 'fast']
      .map((branch) => ({ branch, distance: selectedScreenDistance(branch, event) }))
      .sort((a, b) => a.distance - b.distance)
    if (candidates[0]?.distance > 16) return
    event.preventDefault()
    event.stopPropagation()
    draggingBranchRef.current = candidates[0].branch
    setHoverBranch(candidates[0].branch)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (inspectionModeEnabled) {
      const branch = draggingProbeBranchRef.current
      if (branch) {
        event.preventDefault()
        const point = probePointFromEvent(branch, event)
        if (point) scheduleProbeUpdate(branch, point)
        return
      }
      const candidates = ['slow', 'fast']
        .map((candidateBranch) => ({ branch: candidateBranch, distance: probeScreenDistance(candidateBranch, event) }))
        .sort((a, b) => a.distance - b.distance)
      setHoverBranch(candidates[0]?.distance <= 20 ? candidates[0].branch : null)
      return
    }
    if (draggingBranchRef.current) {
      event.preventDefault()
      updateBranchFromEvent(draggingBranchRef.current, event)
      return
    }
    const candidates = ['slow', 'fast']
      .map((branch) => ({ branch, distance: selectedScreenDistance(branch, event) }))
      .sort((a, b) => a.distance - b.distance)
    setHoverBranch(candidates[0]?.distance <= 16 ? candidates[0].branch : null)
  }

  const handlePointerUp = (event) => {
    if (inspectionModeEnabled) {
      const branch = draggingProbeBranchRef.current
      if (probeFrameRef.current) cancelAnimationFrame(probeFrameRef.current)
      probeFrameRef.current = null
      pendingProbeSampleRef.current = null
      const point = branch ? probePointFromEvent(branch, event) : null
      if (branch && point) onMoveInspectionProbe?.(branch, point, { dragging: false, final: true })
      draggingProbeBranchRef.current = null
      event.currentTarget.releasePointerCapture?.(event.pointerId)
      return
    }
    const branch = draggingBranchRef.current
    if (!branch) return
    if (dragFrameRef.current) {
      cancelAnimationFrame(dragFrameRef.current)
      dragFrameRef.current = null
      pendingDragSampleRef.current = null
    }
    const sample = pointOnCharacteristicFromEvent(branch, event)
    if (sample) onSelectCharacteristicPoint?.({ ...sample.manifold, branch }, { dragging: false, final: true })
    draggingBranchRef.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const draw = () => drawStateSpaceCanvas(canvas, {
      bounds,
      selectedMap,
      hoverBranch,
      draggingBranch: draggingBranchRef.current,
      view,
      params,
      toScreen,
      implicitInflectionSegments,
      implicitCoincidenceSegments,
      showCoincidence,
      implicitHugoniotMinusSegments,
      sonicRightSeparatorMinusSegments,
      sonicLeftSeparatorPlusSegments,
      hysPlusProjectionSegments,
      probeProjection,
    })

    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [bounds, selectedMap, hoverBranch, view, params, toScreen, implicitInflectionSegments, implicitCoincidenceSegments, showCoincidence, implicitHugoniotMinusSegments, sonicRightSeparatorMinusSegments, sonicLeftSeparatorPlusSegments, hysPlusProjectionSegments, probeProjection])

  const cursor = draggingBranchRef.current || draggingProbeBranchRef.current ? 'grabbing' : hoverBranch ? 'grab' : 'default'
  const slowLabelPosition = selectedLabelPosition('slow')
  const fastLabelPosition = selectedLabelPosition('fast')
  const probeLabelPositions = Object.fromEntries(['slow', 'fast'].map((branch) => {
    const point = probeProjection?.[branch]?.point
    return [branch, projectedStatePercent({ u: point?.uMinus, v: point?.vMinus })]
  }))
  const implicitInflectionLabelPosition = (() => {
    const firstSegment = implicitInflectionSegments?.find((segment) => segment?.length)
    if (!firstSegment) return null
    const sample = firstSegment[Math.floor(firstSegment.length / 2)]
    return projectedStatePercent(sample?.state)
  })()
  const hysLabelPosition = (side) => {
    const segments = hysPlusProjectionSegments?.[side]
    const firstSegment = segments?.find((segment) => segment?.length)
    if (!firstSegment) return null
    const sample = firstSegment[Math.floor(firstSegment.length / 2)]
    return projectedStatePercent(sample?.state)
  }

  const renderStateLatexLabel = (branch, tex, position) => {
    if (!position) return null
    const highlighted = hoverBranch === branch || draggingBranchRef.current === branch
    const state = selectedMap[branch]?.selectedState
    return (
      <div
        className={`state-space-latex-label ${highlighted ? 'state-space-latex-label--hover' : ''}`}
        style={{ left: `${position.left}%`, top: `${position.top}%` }}
      >
        <MathLabel tex={tex} />
        <span className="state-space-coordinate-label">
          ({formatNumber(state.uMinus)}, {formatNumber(state.vMinus)})
        </span>
      </div>
    )
  }

  const renderInflectionLatexLabel = (tex, position) => {
    if (!position) return null
    return (
      <div
        className="state-space-latex-label state-space-inflection-label"
        style={{ left: `${position.left}%`, top: `${position.top}%` }}
      >
        <MathLabel tex={tex} />
      </div>
    )
  }

  const renderProbeLabel = (branch) => {
    const position = probeLabelPositions[branch]
    const point = probeProjection?.[branch]?.point
    if (!position || !point) return null
    return (
      <div
        className={`state-space-probe-label state-space-probe-label--${branch}`}
        style={{ left: `${position.left}%`, top: `${position.top}%` }}
      >
        <span className="state-space-probe-dot" />
        <MathLabel tex={branch === 'slow' ? 'P_s' : 'P_f'} />
        <span className="state-space-coordinate-label">
          ({formatNumber(point.uMinus)}, {formatNumber(point.vMinus)})
        </span>
      </div>
    )
  }

  return (
    <div className="state-space-canvas-wrap">
      <canvas
        className="stage-2d-canvas"
        ref={canvasRef}
        style={{ cursor, pointerEvents: 'auto', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => { if (!draggingBranchRef.current && !draggingProbeBranchRef.current) setHoverBranch(null) }}
      />
      <div className="state-space-latex-overlay" aria-hidden="true">
        <span
          className="state-space-axis-label state-space-axis-label--u"
          style={{ left: 'calc(100% - 18px)', top: `calc(${axisLabelPositions.axisVPercent}% - 18px)` }}
        >
          <MathLabel tex="u" />
        </span>
        <span
          className="state-space-axis-label state-space-axis-label--v"
          style={{ left: `calc(${axisLabelPositions.axisUPercent}% + 8px)`, top: '8px' }}
        >
          <MathLabel tex="v" />
        </span>
        {(showInflectionSlow || showInflectionFast) ? renderInflectionLatexLabel('\\mathcal{J}', implicitInflectionLabelPosition) : null}
        {showHysteresis ? renderInflectionLatexLabel('\\mathcal{Hys}^{+}_{-}', hysLabelPosition('minus')) : null}
        {showHysteresis ? renderInflectionLatexLabel('\\mathcal{Hys}^{+}_{+}', hysLabelPosition('plus')) : null}
        {renderStateLatexLabel('slow', 'U_L', slowLabelPosition)}
        {renderStateLatexLabel('fast', 'U_R', fastLabelPosition)}
        {renderProbeLabel('slow')}
        {renderProbeLabel('fast')}
        {(!selectedMap.slow || !selectedMap.fast) && (
          <div className="state-space-help-label">
            Selecione <MathLabel tex="C_s" /> com clique e <MathLabel tex="C_f" /> com Shift+clique na visualização 3D.
          </div>
        )}
      </div>
    </div>
  )
}

function SolutionCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const draw = () => drawSolutionCanvas(canvas)
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  return <canvas className="stage-2d-canvas" ref={canvasRef} />
}

export { SolutionCanvas }
export default StateSpaceCanvas
