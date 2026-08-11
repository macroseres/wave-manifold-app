import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MathLabel from './MathLabel'
import { formatNumber } from '../../ui/display'
import { buildImplicitHysPlusMinusStateSegments, buildImplicitHysPlusPlusStateSegments } from '../../entities/stateSpace/hysteresisSegments'
import {
  buildCharacteristicProjectionSamples,
  buildImplicitInflectionStateSegments,
  stateFromScreenPoint,
  refineCharacteristicProjectionFromState,
  projectionBounds,
} from '../../geometry/stateSpaceProjection.js'
import { drawSolutionCanvas, drawStateSpaceCanvas } from '../../entities/stateSpace/canvasDrawing'

function StateSpaceCanvas({
  params,
  view,
  selectedEntries = [],
  onSelectCharacteristicPoint,
  showInflectionSlow = false,
  showInflectionFast = false,
  showHysteresis = false,
  inspectionModeEnabled = false,
}) {
  const canvasRef = useRef(null)
  const draggingBranchRef = useRef(null)
  const pendingDragSampleRef = useRef(null)
  const dragFrameRef = useRef(null)
  const [hoverBranch, setHoverBranch] = useState(null)

  const samples = useMemo(() => {
    const slow = buildCharacteristicProjectionSamples(view, params, 'slow')
    const fast = buildCharacteristicProjectionSamples(view, params, 'fast')
    return { slow, fast, all: [...slow, ...fast] }
  }, [view, params])

  const bounds = useMemo(() => projectionBounds(samples.all), [samples])

  const hysPlusProjectionSegments = useMemo(() => ({
    minus: showHysteresis ? buildImplicitHysPlusMinusStateSegments(bounds, params, 420) : [],
    plus: showHysteresis ? buildImplicitHysPlusPlusStateSegments(bounds, params, 420) : [],
  }), [bounds, params, showHysteresis])

  const implicitInflectionSegments = useMemo(() => (
    (showInflectionSlow || showInflectionFast)
      ? buildImplicitInflectionStateSegments(bounds, params, 220)
      : []
  ), [bounds, params, showInflectionSlow, showInflectionFast])
  const selectedMap = useMemo(() => Object.fromEntries(selectedEntries.map((entry) => [entry.branch, entry])), [selectedEntries])

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
    const projected = refineCharacteristicProjectionFromState(targetState, view, params, branch)
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

  useEffect(() => () => {
    if (dragFrameRef.current) cancelAnimationFrame(dragFrameRef.current)
  }, [])

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
    if (inspectionModeEnabled) return
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
      if (draggingBranchRef.current) {
        draggingBranchRef.current = null
        event.currentTarget.releasePointerCapture?.(event.pointerId)
      }
      if (hoverBranch) setHoverBranch(null)
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
      draggingBranchRef.current = null
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
      hysPlusProjectionSegments,
    })

    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [bounds, selectedMap, hoverBranch, view, params, toScreen, implicitInflectionSegments, hysPlusProjectionSegments])

  const cursor = draggingBranchRef.current ? 'grabbing' : hoverBranch ? 'grab' : 'default'
  const slowLabelPosition = selectedLabelPosition('slow')
  const fastLabelPosition = selectedLabelPosition('fast')
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
        onPointerLeave={() => { if (!draggingBranchRef.current) setHoverBranch(null) }}
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
