import { findHysteresisDoubleStates } from '../../geometry/hysteresisSelfIntersection.js'
import { buildDoubleSonicStateProjection } from '../../geometry/doubleSonicStateProjection.js'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MathLabel from './MathLabel'
import CompositeSegmentsWorker from '../../workers/compositeSegments.worker?worker'
import { RAREFACTION, clampResolutionSamples } from '../../config/numerics'
import { computeCompositeSlowInflectionPoint } from '../objects/composite/compositeInflectionUtils'
import { filterCompositeBranchesThroughPoint, normalizeSegment, keepDrawableSegment } from '../../entities/composite/admissibleGeometry'
import { buildDrawableCompositeSegments } from '../../geometry/compositeCurveGeometry'
import RarefactionSegmentsWorker from '../../workers/rarefactionSegments.worker?worker'
import { useWorkerTask } from '../../hooks/useWorkerTask'
import { useStateViewport } from './useStateViewport'
import { formatNumber } from '../../ui/display'
import { buildImplicitHysPlusMinusStateSegments, buildImplicitHysPlusPlusStateSegments } from '../../entities/stateSpace/hysteresisSegments'
import {
  buildCharacteristicProjectionSamples,
  buildImplicitInflectionStateSegments,
  buildImplicitHugoniotMinusStateSegments,
  buildImplicitCoincidenceStateSegments,
  buildSonicRightSeparatorMinusProjection,
  buildSonicRightSeparatorPlusProjection,
  buildSonicLeftSeparatorPlusProjection,
  buildSonicLeftSeparatorMinusProjection,
  stateFromScreenPoint,
  refineCharacteristicProjectionFromState,
  projectionBounds,
} from '../../geometry/stateSpaceProjection.js'
import { drawSolutionCanvas, drawStateSpaceCanvas } from '../../entities/stateSpace/canvasDrawing'
import { coordsOf, PROBE_Z_EXTENSION_MARGIN, sampleHugoniot, sampleRarefaction, withStates } from '../../entities/inspection/probeHelpers.jsx'
import { FORWARD_HUGONIOT, BACKWARD_HUGONIOT } from '../../entities/hugoniot/directions.js'

const createRarefactionWorker = () => new RarefactionSegmentsWorker()
const createCompositeSegmentsWorker = () => new CompositeSegmentsWorker()

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
  showInflectionMinusProjection = false,
  showInflectionPlusProjection = false,
  showCoincidenceMinusProjection = false,
  showCoincidencePlusProjection = false,
  showRarefactionSlowMinusProjection = false,
  showRarefactionFastMinusProjection = false,
  showRarefactionSlowPlusProjection = false,
  showRarefactionFastPlusProjection = false,
  showCompositeSlowMinusProjection = false,
  showCompositeFastMinusProjection = false,
  showCompositeSlowPlusProjection = false,
  showCompositeFastPlusProjection = false,
  showHysPlusMinusProjection = false,
  showHysPlusPlusProjection = false,
  showHysMinusMinusProjection = false,
  showHysMinusPlusProjection = false,
  showHugoniotMinusPlusProjection = false,
  showHugoniotPlusPlusProjection = false,
  showHugoniotMinusMinusProjection = false,
  showHugoniotPlusMinusProjection = false,
  showExtensionMinusPlusProjection = false,
  showExtensionPlusMinusProjection = false,
  showExtensionPlusPlusProjection = false,
  showDoubleSonicMinusProjection = false,
  showHysteresisSelfIntersectionMinusProjection = false,
  showHysteresisSelfIntersectionPlusProjection = false,
  showDoubleSonicPlusProjection = false,
  showExtensionMinusMinusProjection = false,
  inspectionModeEnabled = false,
  inspectionProbesByBranch = { slow: null, fast: null },
  inspectionCurveVisibility = null,
  onCreateInspectionProbe = null,
  onMoveInspectionProbe = null,
  resolution = 40,
}) {
  const canvasRef = useRef(null)
  const showCoincidence = showCoincidenceMinusProjection || showCoincidencePlusProjection
  const draggingBranchRef = useRef(null)
  const draggingProbeBranchRef = useRef(null)
  const pendingDragSampleRef = useRef(null)
  const pendingProbeSampleRef = useRef(null)
  const dragFrameRef = useRef(null)
  const probeFrameRef = useRef(null)
  const [hoverBranch, setHoverBranch] = useState(null)
  const [dragPreview, setDragPreview] = useState(null)

  const samples = useMemo(() => {
    const slow = buildCharacteristicProjectionSamples(view, params, 'slow')
    const fast = buildCharacteristicProjectionSamples(view, params, 'fast')
    return { slow, fast, all: [...slow, ...fast] }
  }, [view, params])
  const selectedMap = useMemo(() => Object.fromEntries(selectedEntries.map((entry) => [entry.branch, entry])), [selectedEntries])
  const slowSeedKey = JSON.stringify(selectedMap.slow?.seed ?? null)
  const slowSeed = useMemo(() => JSON.parse(slowSeedKey), [slowSeedKey])
  const slowStateKey = JSON.stringify(selectedMap.slow?.selectedState ?? null)
  const slowState = useMemo(() => JSON.parse(slowStateKey), [slowStateKey])
  const fastSeedKey = JSON.stringify(selectedMap.fast?.seed ?? null)
  const fastSeed = useMemo(() => JSON.parse(fastSeedKey), [fastSeedKey])
  const fastStateKey = JSON.stringify(selectedMap.fast?.selectedState ?? null)
  const fastState = useMemo(() => JSON.parse(fastStateKey), [fastStateKey])
  const displayMap = useMemo(() => dragPreview ? {
    ...selectedMap,
    [dragPreview.branch]: { ...selectedMap[dragPreview.branch], selectedState: withStates(dragPreview.sample.manifold, params) },
  } : selectedMap, [selectedMap, dragPreview, params])
  const showComposite = showCompositeSlowMinusProjection || showCompositeSlowPlusProjection
  const compositePayload = useMemo(() => ({
    fixedState: slowSeed, params, view: probeView, resolution,
    samples: clampResolutionSamples(resolution * RAREFACTION.SAMPLES_PER_RESOLUTION, RAREFACTION.MIN_SAMPLES, RAREFACTION.MAX_SAMPLES),
    inflectionBranch: 'slow', direction: FORWARD_HUGONIOT, sonicTarget: 'left',
    renderView: { ...probeView, compactifiedZ: true },
  }), [slowSeed, params, probeView, resolution])
  const { data: compositeData, loading: compositeLoading, error: compositeError } = useWorkerTask(createCompositeSegmentsWorker, compositePayload, showComposite && Boolean(slowSeed))
  const compositeProjectionSegments = useMemo(() => {
    if (!showComposite || !slowSeed || !compositeData) return { minus: [], plus: [] }
    const raw = (compositeData.segments ?? []).map(normalizeSegment).filter(segment => segment.length >= 2)
    const anchor = computeCompositeSlowInflectionPoint(slowSeed, params, probeView, resolution)
    const branches = filterCompositeBranchesThroughPoint(raw, anchor, probeView, { tolerance: Math.max(0.025, 0.10 / Math.max(1, resolution)) })
    const segments = buildDrawableCompositeSegments(branches).filter(segment => keepDrawableSegment(segment, probeView))
    return {
      minus: showCompositeSlowMinusProjection ? projectProbeSegments(segments, 'minus', params) : [],
      plus: showCompositeSlowPlusProjection ? projectProbeSegments(segments, 'plus', params) : [],
    }
  }, [showComposite, slowSeed, compositeData, params, probeView, resolution, showCompositeSlowMinusProjection, showCompositeSlowPlusProjection])
  const rarefactionPayload = useMemo(() => ({
    fixedState: slowSeed,
    params, view: probeView, resolution, constrainZ: true,
    direction: FORWARD_HUGONIOT, compactifiedZ: true,
  }), [slowSeed, params, probeView, resolution])
  const showRarefaction = showRarefactionSlowMinusProjection || showRarefactionSlowPlusProjection
  const { data: rarefactionData, loading: rarefactionLoading, error: rarefactionError } = useWorkerTask(createRarefactionWorker, rarefactionPayload, showRarefaction && Boolean(slowSeed))
  const rarefactionSlowSegments = useMemo(() => (
    showRarefaction && slowSeed ? projectProbeSegments(rarefactionData, 'minus', params) : []
  ), [showRarefaction, slowSeed, rarefactionData, params])

  const showFastComposite = showCompositeFastMinusProjection || showCompositeFastPlusProjection
  const fastCompositePayload = useMemo(() => ({
    fixedState: fastSeed, params, view: probeView, resolution,
    samples: clampResolutionSamples(resolution * RAREFACTION.SAMPLES_PER_RESOLUTION, RAREFACTION.MIN_SAMPLES, RAREFACTION.MAX_SAMPLES),
    inflectionBranch: 'fast', direction: BACKWARD_HUGONIOT, sonicTarget: 'right',
    renderView: { ...probeView, compactifiedZ: true },
  }), [fastSeed, params, probeView, resolution])
  const { data: fastCompositeData, loading: fastCompositeLoading, error: fastCompositeError } = useWorkerTask(createCompositeSegmentsWorker, fastCompositePayload, showFastComposite && Boolean(fastSeed))
  const fastCompositeProjectionSegments = useMemo(() => {
    if (!showFastComposite || !fastSeed || !fastCompositeData) return { minus: [], plus: [] }
    const raw = (fastCompositeData.segments ?? []).map(normalizeSegment).filter(segment => segment.length >= 2)
    const anchor = fastCompositeData.sonicAnchorPoint
    const branches = filterCompositeBranchesThroughPoint(raw, anchor, probeView, { tolerance: Math.max(0.025, 0.10 / Math.max(1, resolution)) })
    const segments = buildDrawableCompositeSegments(branches).filter(segment => keepDrawableSegment(segment, probeView))
    return {
      minus: showCompositeFastMinusProjection ? projectProbeSegments(segments, 'minus', params) : [],
      plus: showCompositeFastPlusProjection ? projectProbeSegments(segments, 'plus', params) : [],
    }
  }, [showFastComposite, fastSeed, fastCompositeData, params, probeView, resolution, showCompositeFastMinusProjection, showCompositeFastPlusProjection])
  const fastRarefactionPayload = useMemo(() => ({
    fixedState: fastSeed,
    params, view: probeView, resolution, constrainZ: true,
    direction: BACKWARD_HUGONIOT, compactifiedZ: true,
  }), [fastSeed, params, probeView, resolution])
  const showFastRarefaction = showRarefactionFastMinusProjection || showRarefactionFastPlusProjection
  const { data: fastRarefactionData, loading: fastRarefactionLoading, error: fastRarefactionError } = useWorkerTask(createRarefactionWorker, fastRarefactionPayload, showFastRarefaction && Boolean(fastSeed))
  const rarefactionFastSegments = useMemo(() => (
    showFastRarefaction && fastSeed ? projectProbeSegments(fastRarefactionData, 'minus', params) : []
  ), [showFastRarefaction, fastSeed, fastRarefactionData, params])

  const probeProjection = useMemo(() => {
    if (!inspectionModeEnabled) return {}
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
  }, [inspectionModeEnabled, inspectionProbesByBranch, inspectionCurveVisibility, params, probeView, resolution])

  const baseBounds = useMemo(() => {
    // O enquadramento pertence ao espaço de estados, não às camadas temporárias
    // de inspeção. Mantê-lo independente das sondas evita saltos de escala ao
    // ativar ou desativar o modo de inspeção.
    return projectionBounds(samples.all)
  }, [samples])
  const navigation = useStateViewport(baseBounds)
  const bounds = navigation.bounds

  const hysMinusSegments = useMemo(() => (
    (showHysPlusMinusProjection || showHysMinusPlusProjection) ? buildImplicitHysPlusMinusStateSegments(bounds, params, 420) : []
  ), [bounds, params, showHysPlusMinusProjection, showHysMinusPlusProjection])
  const hysPlusSegments = useMemo(() => (
    (showHysPlusPlusProjection || showHysMinusMinusProjection) ? buildImplicitHysPlusPlusStateSegments(bounds, params, 420) : []
  ), [bounds, params, showHysPlusPlusProjection, showHysMinusMinusProjection])
  const hysPlusProjectionSegments = useMemo(() => ({
    minus: showHysPlusMinusProjection ? hysMinusSegments : [],
    plus: showHysPlusPlusProjection ? hysPlusSegments : [],
    // Reflection Y -> -Y exchanges the two state projections of Hys.
    leftMinus: showHysMinusMinusProjection ? hysPlusSegments : [],
    leftPlus: showHysMinusPlusProjection ? hysMinusSegments : [],
  }), [hysMinusSegments, hysPlusSegments, showHysPlusMinusProjection, showHysPlusPlusProjection, showHysMinusMinusProjection, showHysMinusPlusProjection])

  const implicitInflectionSegments = useMemo(() => (
    (showInflectionMinusProjection || showInflectionPlusProjection)
      ? buildImplicitInflectionStateSegments(bounds, params, 220)
      : []
  ), [bounds, params, showInflectionMinusProjection, showInflectionPlusProjection])
  // A coincidência é sempre necessária aqui: além de poder ser exibida
  // como curva, ela é a fronteira tau=0 compartilhada pelas características.
  const implicitCoincidenceSegments = useMemo(() => (
    buildImplicitCoincidenceStateSegments(bounds, params, 260)
  ), [bounds, params])
  const implicitHugoniotMinusSegments = useMemo(() => (
    showHugoniotMinusPlusProjection
      ? buildImplicitHugoniotMinusStateSegments(bounds, slowState, params, 260)
      : []
  ), [bounds, slowState, params, showHugoniotMinusPlusProjection])
  const implicitHugoniotPlusSegments = useMemo(() => (
    showHugoniotPlusMinusProjection
      ? buildImplicitHugoniotMinusStateSegments(bounds, fastState, params, 260)
      : []
  ), [bounds, fastState, params, showHugoniotPlusMinusProjection])
  const sonicRightSeparatorMinusSegments = useMemo(() => (
    showExtensionPlusMinusProjection ? buildSonicRightSeparatorMinusProjection(bounds, params) : []
  ), [bounds, params, showExtensionPlusMinusProjection])
  const sonicRightSeparatorPlusSegments = useMemo(() => (
    showExtensionPlusPlusProjection ? buildSonicRightSeparatorPlusProjection(bounds, params) : []
  ), [bounds, params, showExtensionPlusPlusProjection])
  const sonicLeftSeparatorPlusSegments = useMemo(() => (
    showExtensionMinusPlusProjection ? buildSonicLeftSeparatorPlusProjection(bounds, params) : []
  ), [bounds, params, showExtensionMinusPlusProjection])
  const selfIntersectionStates = useMemo(() => (
    showHysteresisSelfIntersectionMinusProjection || showHysteresisSelfIntersectionPlusProjection
      ? findHysteresisDoubleStates(params) : []
  ), [params, showHysteresisSelfIntersectionMinusProjection, showHysteresisSelfIntersectionPlusProjection])
  const selfIntersectionProjection = useMemo(() => ({
    points: showHysteresisSelfIntersectionMinusProjection
      ? selfIntersectionStates.map(p => ({ u: p.uMinus, v: p.vMinus })) : [],
    plus: showHysteresisSelfIntersectionPlusProjection
      ? selfIntersectionStates.flatMap(p => buildImplicitHugoniotMinusStateSegments(
        bounds, { u: p.uMinus, v: p.vMinus }, params, 260)) : [],
  }), [bounds, params, selfIntersectionStates, showHysteresisSelfIntersectionMinusProjection, showHysteresisSelfIntersectionPlusProjection])
  const doubleSonicMinusSegments = useMemo(() => (
    showDoubleSonicMinusProjection ? buildDoubleSonicStateProjection(bounds, params, 'minus') : []
  ), [bounds, params, showDoubleSonicMinusProjection])
  const doubleSonicPlusSegments = useMemo(() => (
    showDoubleSonicPlusProjection ? buildDoubleSonicStateProjection(bounds, params, 'plus') : []
  ), [bounds, params, showDoubleSonicPlusProjection])
  const sonicLeftSeparatorMinusSegments = useMemo(() => (
    showExtensionMinusMinusProjection ? buildSonicLeftSeparatorMinusProjection(bounds, params) : []
  ), [bounds, params, showExtensionMinusMinusProjection])

  const statePercent = (state) => {
    if (!state || !Number.isFinite(state.uMinus) || !Number.isFinite(state.vMinus)) return null
    const left = ((state.uMinus - bounds.uMin) / Math.max(1e-12, bounds.uMax - bounds.uMin)) * 100
    const top = ((bounds.vMax - state.vMinus) / Math.max(1e-12, bounds.vMax - bounds.vMin)) * 100
    return { left, top }
  }

  const selectedLabelPosition = (branch) => statePercent(displayMap[branch]?.selectedState)

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

  useEffect(() => {
    if (inspectionModeEnabled) return
    draggingProbeBranchRef.current = null
    pendingProbeSampleRef.current = null
    if (probeFrameRef.current) cancelAnimationFrame(probeFrameRef.current)
    probeFrameRef.current = null
    setHoverBranch(null)
  }, [inspectionModeEnabled])

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
    setDragPreview(pending)
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
    if (navigation.down(event)) return
    if (inspectionModeEnabled) {
      const candidates = ['slow', 'fast']
        .map((branch) => ({ branch, distance: probeScreenDistance(branch, event) }))
        .sort((a, b) => a.distance - b.distance)
      if (candidates[0]?.distance <= 20) {
        event.preventDefault()
        event.stopPropagation()
        draggingProbeBranchRef.current = candidates[0].branch
        setHoverBranch(candidates[0].branch)
        event.currentTarget.setPointerCapture?.(event.pointerId)
        return
      }

      const characteristicCandidates = ['slow', 'fast']
        .map((branch) => ({ branch, sample: pointOnCharacteristicFromEvent(branch, event) }))
        .filter((candidate) => candidate.sample)
        .sort((a, b) => a.sample.screenDistance - b.sample.screenDistance)
      const nearest = characteristicCandidates[0]
      if (!nearest || nearest.sample.screenDistance > 20) return

      event.preventDefault()
      event.stopPropagation()
      const point = {
        ...nearest.sample.manifold,
        branch: nearest.branch,
        Y: 0,
        mode: 'characteristic',
        attachedCurve: null,
      }
      onCreateInspectionProbe?.(point)
      draggingProbeBranchRef.current = nearest.branch
      setHoverBranch(nearest.branch)
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
    if (navigation.move(event)) return
    if (navigation.mode !== 'select') return
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
      if (candidates[0]?.distance <= 20) {
        setHoverBranch(candidates[0].branch)
        return
      }
      const characteristicCandidates = ['slow', 'fast']
        .map((candidateBranch) => ({ branch: candidateBranch, sample: pointOnCharacteristicFromEvent(candidateBranch, event) }))
        .filter((candidate) => candidate.sample)
        .sort((a, b) => a.sample.screenDistance - b.sample.screenDistance)
      const nearest = characteristicCandidates[0]
      setHoverBranch(nearest?.sample.screenDistance <= 20 ? nearest.branch : null)
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
    if (navigation.up(event)) return
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
    setDragPreview(null)
    if (sample && event.type !== 'pointercancel') onSelectCharacteristicPoint?.({ ...sample.manifold, branch }, { dragging: false, final: true })
    draggingBranchRef.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const draw = () => drawStateSpaceCanvas(canvas, {
      bounds,
      selectedMap: displayMap,
      hoverBranch: inspectionModeEnabled ? null : hoverBranch,
      draggingBranch: draggingBranchRef.current,
      view,
      params,
      toScreen,
      implicitInflectionSegments,
      implicitCoincidenceSegments,
      showCoincidence,
      showHugoniotMinusMinusProjection,
      implicitHugoniotMinusSegments,
      sonicRightSeparatorMinusSegments,
      sonicLeftSeparatorPlusSegments,
      selfIntersectionProjection,
      doubleSonicMinusSegments,
      doubleSonicPlusSegments,
      sonicLeftSeparatorMinusSegments,
      hysPlusProjectionSegments,
      rarefactionFastSegments,
      fastCompositeProjectionSegments,
      implicitHugoniotPlusSegments,
      showHugoniotPlusPlusProjection,
      rarefactionSlowSegments,
      compositeProjectionSegments,
      sonicRightSeparatorPlusSegments,
      probeProjection,
    })

    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [rarefactionFastSegments, fastCompositeProjectionSegments, implicitHugoniotPlusSegments, showHugoniotPlusPlusProjection, displayMap, showHugoniotMinusMinusProjection, selfIntersectionProjection, bounds, selectedMap, hoverBranch, inspectionModeEnabled, view, params, toScreen, implicitInflectionSegments, implicitCoincidenceSegments, showCoincidence, implicitHugoniotMinusSegments, sonicRightSeparatorMinusSegments, sonicRightSeparatorPlusSegments, sonicLeftSeparatorPlusSegments, sonicLeftSeparatorMinusSegments, doubleSonicMinusSegments, doubleSonicPlusSegments, hysPlusProjectionSegments, rarefactionSlowSegments, compositeProjectionSegments, probeProjection])

  const cursor = draggingBranchRef.current || draggingProbeBranchRef.current ? 'grabbing' : hoverBranch ? 'grab' : 'default'
  const slowLabelPosition = selectedLabelPosition('slow')
  const fastLabelPosition = selectedLabelPosition('fast')
  const probeLabelPositions = Object.fromEntries(['slow', 'fast'].map((branch) => {
    const point = probeProjection?.[branch]?.point
    return [branch, projectedStatePercent({ u: point?.uMinus, v: point?.vMinus })]
  }))
  const renderStateLatexLabel = (branch, tex, position) => {
    if (!position) return null
    const highlighted = !inspectionModeEnabled && (hoverBranch === branch || draggingBranchRef.current === branch)
    const state = displayMap[branch]?.selectedState
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
    <div className="state-space-canvas-wrap" tabIndex={0} onKeyDown={event => {
      if (event.key === 'Escape') navigation.cancel()
    }}>
      <div className="state-viewport-controls" role="toolbar" aria-label="Navegação do espaço de estados">
        <button type="button" aria-pressed={navigation.mode === 'select'} onClick={() => navigation.setMode('select')}>Selecionar</button>
        <button type="button" aria-pressed={navigation.mode === 'box'} onClick={() => navigation.setMode('box')} title="Arraste um retângulo sobre a região desejada">Zoom por retângulo</button>
        <button type="button" aria-pressed={navigation.mode === 'pan'} onClick={() => navigation.setMode('pan')}>Mover vista</button>
        <button type="button" onClick={() => navigation.zoom(.75)} aria-label="Ampliar espaço de estados">+</button>
        <button type="button" onClick={() => navigation.zoom(1 / .75)} aria-label="Reduzir espaço de estados">−</button>
        <button type="button" disabled={!navigation.canUndo} onClick={navigation.undo}>Voltar zoom</button>
        <button type="button" onClick={navigation.reset}>Restaurar vista</button>
        <button type="button" aria-pressed={navigation.showLabels} onClick={() => navigation.setShowLabels(value => !value)}>Rótulos</button>
      </div>
      {(dragPreview || compositeLoading || rarefactionLoading || compositeError || rarefactionError || fastCompositeLoading || fastRarefactionLoading || fastCompositeError || fastRarefactionError) && (
        <div role="status" aria-live="polite" style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 5, padding: '7px 11px', borderRadius: 7, background: '#0f172a', color: '#e2e8f0', pointerEvents: 'none', fontSize: 12 }}>
          {dragPreview ? 'Solte o ponto para atualizar as curvas.'
            : compositeError || rarefactionError || fastCompositeError || fastRarefactionError ? 'Não foi possível calcular uma das curvas.'
              : `Calculando e desenhando: ${[compositeLoading && 'composta lenta', rarefactionLoading && 'rarefação lenta', fastCompositeLoading && 'composta rápida', fastRarefactionLoading && 'rarefação rápida'].filter(Boolean).join(', ')}…`}
        </div>
      )}
      <canvas
        className="stage-2d-canvas"
        ref={canvasRef}
        style={{ cursor: navigation.mode === 'box' ? 'crosshair' : navigation.mode === 'pan' ? 'grab' : cursor, pointerEvents: 'auto', touchAction: 'none', transform: navigation.transform }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => { if (!draggingBranchRef.current && !draggingProbeBranchRef.current) setHoverBranch(null) }}
      />
      {navigation.preview?.mode === 'box' && <div className="state-zoom-rectangle" style={{
        left: Math.min(navigation.preview.start.x, navigation.preview.end.x),
        top: Math.min(navigation.preview.start.y, navigation.preview.end.y),
        width: Math.abs(navigation.preview.start.x - navigation.preview.end.x),
        height: Math.abs(navigation.preview.start.y - navigation.preview.end.y),
      }} />}
      <div className="state-space-latex-overlay" aria-hidden="true" style={{ visibility: navigation.showLabels ? 'visible' : 'hidden', transform: navigation.transform }}>
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
        {renderStateLatexLabel('slow', 'U_L', slowLabelPosition)}
        {renderStateLatexLabel('fast', 'U_R', fastLabelPosition)}
        {renderProbeLabel('slow')}
        {renderProbeLabel('fast')}
        {(!selectedMap.slow || !selectedMap.fast) && (
          <div className="state-space-help-label">
            Selecione pontos no <MathLabel tex="C_s" /> e no <MathLabel tex="C_f" /> com clique na visualização 3D.
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










