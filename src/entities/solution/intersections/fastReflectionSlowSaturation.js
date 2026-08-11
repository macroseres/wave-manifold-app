import { computeRightStateFromWavePoint } from '../../surfaceImplicit/index.js'
import { reflectDaggerSegments } from '../../shared/reflection.js'
import { validWavePoint } from '../../../geometry/pointUtils.js'
import { buildSolutionPipeline } from '../pipeline.js'
import {
  pointObjectFromCoords,
  hasUsableSegments,
  labelForArc,
  expandViewZForIntersections,
  sampleSaturatedByHPlusPoints,
  rightStateAtPoint,
  leftStateAtPoint,
  closestPointOnSlowArcForHPlus,
  closestPointOnSlowArcForHMinus,
  closestPointBetweenFastSegmentsAndSurface,
  dedupeIntersectionResults,
} from '../rendering/solutionModeGeometry.js'

export function computeFastReflectionSlowSaturationIntersections({
  slowEntry,
  fastEntry,
  params,
  view,
  resolution,
  includeChosenHMinus = true,
  solutionPipeline = null,
}) {
  if (!slowEntry?.state || !slowEntry?.seed || !fastEntry?.state || !fastEntry?.seed) return []
  const intersectionView = expandViewZForIntersections(view)

  const pipeline = solutionPipeline ?? buildSolutionPipeline({
    entries: [slowEntry, fastEntry].filter(Boolean),
    params,
    view,
    resolution,
  })
  const slowBranch = pipeline.slow
  const fastBranch = pipeline.fast
  const slowActiveRarefactionSegments = [
    ...(slowBranch.localRarefactionArc?.segments ?? []),
    ...(slowBranch.nonlocalRarefactionArc?.segments ?? []),
  ]
  const slowDerivedSegmentsByKind = {
    hLocal: slowBranch.localShockArc?.segments ?? [],
    firstChainHNonlocal: (slowBranch.firstChainNonlocalShockArc ?? slowBranch.nonlocalShockFromLocalCompositeArc)?.segments ?? [],
    secondChainHNonlocal: (slowBranch.secondChainNonlocalShockArc ?? slowBranch.nonlocalShockFromNonlocalCompositeArc)?.segments ?? [],
    rLocal: slowBranch.localRarefactionArc?.segments ?? [],
    rNonlocal: slowBranch.nonlocalRarefactionArc?.segments ?? [],
    firstChainK: slowBranch.firstChain?.compositeArc?.segments ?? slowBranch.localCompositeArc?.segments ?? [],
    secondChainK: slowBranch.secondChain?.compositeArc?.segments ?? slowBranch.nonlocalCompositeArc?.segments ?? [],
  }
  const fastDerivedSegmentsByKind = {
    hLocal: fastBranch.localShockArc?.segments ?? [],
    hNonlocal: hasUsableSegments(fastBranch.nonlocalShockArc?.segments) ? fastBranch.nonlocalShockArc.segments : [],
    rLocal: fastBranch.localRarefactionArc?.segments ?? [],
    rNonlocal: fastBranch.nonlocalRarefactionArc?.segments ?? [],
    k: fastBranch.activeCompositeArc?.segments ?? [],
  }

  const results = []
  const tolerance = 0.012
  const slowSurfacePointsByKind = Object.fromEntries(
    Object.entries(slowDerivedSegmentsByKind).map(([slowKind, slowSegments]) => [
      slowKind,
      sampleSaturatedByHPlusPoints(slowSegments, params, view, resolution),
    ]),
  )

  for (const [fastKind, fastSegments] of Object.entries(fastDerivedSegmentsByKind)) {
    const fastDaggerSegments = reflectDaggerSegments(fastSegments)
      .map((segment) => (segment ?? []).map(pointObjectFromCoords).filter(validWavePoint))
      .filter((segment) => segment.length >= 2)
    if (!fastDaggerSegments.length) continue

    for (const [slowKind, slowSegments] of Object.entries(slowDerivedSegmentsByKind)) {
      const surfacePoints = slowSurfacePointsByKind[slowKind] ?? []
      if (!surfacePoints.length) continue

      const best = closestPointBetweenFastSegmentsAndSurface(fastDaggerSegments, surfacePoints, params, intersectionView)
      if (!best) continue

      const normalizedDistance = Math.sqrt(best.d2)
      if (normalizedDistance > tolerance) continue

      const fastLabel = `${labelForArc(fastKind, '+')}^{\\dagger}`
      const slowLabel = labelForArc(slowKind, '-')
      const texLabel = `${fastLabel} \\cap \\operatorname{Sat}_{H_+}(${slowLabel})`
      const saturatedRightState = rightStateAtPoint(best.surfacePoint?.generatorPoint, params)
      const fastRightState = rightStateAtPoint(best.fastPoint, params)
      const slowIntersection = closestPointOnSlowArcForHPlus(slowSegments, saturatedRightState, params)
      const markerPoint = slowIntersection?.generatorPoint ?? best.surfacePoint?.generatorPoint ?? best.fastPoint
      const rarefactionSourceSegments = includeChosenHMinus && (slowKind === 'k' || slowKind === 'kLocal' || slowKind === 'kNonlocal')
        ? slowActiveRarefactionSegments
        : []
      const chosenLeftTarget = includeChosenHMinus && (slowKind === 'k' || slowKind === 'kLocal' || slowKind === 'kNonlocal') ? leftStateAtPoint(markerPoint, params) : null
      const chosenHMinus = includeChosenHMinus
        ? closestPointOnSlowArcForHMinus(rarefactionSourceSegments, chosenLeftTarget, params)
        : null
      const point = {
        ...markerPoint,
        t: markerPoint.t,
        Y: markerPoint.Y,
        z: markerPoint.z,
        coords: markerPoint.coords ?? [markerPoint.t, markerPoint.Y, markerPoint.z],
        normalizedDistance,
        planeResidual: best.planeResidual,
        generatorStateDistance: Math.sqrt(slowIntersection?.d2 ?? Infinity),
        fastKind,
        slowKind,
        fastIntersectionPoint: best.fastPoint,
        surfacePoint: best.surfacePoint,
        chosenRightState: saturatedRightState,
        fastRightState,
        chosenLeftState: chosenHMinus?.generatorLeftState ?? null,
        chosenLeftGeneratorPoint: chosenHMinus?.generatorPoint ?? null,
        chosenLeftStateDistance: Math.sqrt(chosenHMinus?.d2 ?? Infinity),
        label: texLabel,
        endpointLabel: texLabel,
      }
      const rightState = computeRightStateFromWavePoint(point.t, point.Y, point.z, params)
      if (rightState) {
        point.uPlus = rightState.uPlus
        point.vPlus = rightState.vPlus
      }
      results.push({
        ...point,
        coords: point.coords,
        accepted: true,
      })
    }
  }

  return dedupeIntersectionResults(results, intersectionView)
}

