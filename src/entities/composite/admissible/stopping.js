import { FORWARD_HUGONIOT, BACKWARD_HUGONIOT, normalizeHugoniotDirection } from '../../hugoniot/directions.js'
import {
  solveBackwardHugoniotPointForFixedRightState,
  solveDoubleSonicSegments,
  solveHugoniotPointForFixedState,
} from '../../surfaceImplicit/index.js'
import { HUGONIOT, clampResolutionSamples } from '../../../config/numerics.js'
import { buildHugoniotBifoliation, selectLeafFromBifoliation } from '../../waves/index.js'
import { coordsOf, flattenNormalizedSegments, interpolate3 } from './primitives.js'
import { minDistanceToPointCloud, normalizedDistance3, normalizedDistanceToTzLine } from './distance.js'

function hugoniotPointAt(z, fixedState, params, direction) {
  const point = normalizeHugoniotDirection(direction) === BACKWARD_HUGONIOT
    ? solveBackwardHugoniotPointForFixedRightState(z, fixedState, params)
    : solveHugoniotPointForFixedState(z, fixedState, params)
  return coordsOf(point)
}

export function buildStopGeometry({ fixedState, stopFixedState = null, params, view, resolution, direction }) {
  const samples = clampResolutionSamples(
    resolution * HUGONIOT.SAMPLES_PER_RESOLUTION,
    HUGONIOT.MIN_SAMPLES,
    HUGONIOT.MAX_SAMPLES,
  )
  const stopState = stopFixedState ?? fixedState
  const H = buildHugoniotBifoliation({ fixedState: stopState, params, view, samples })
  const branch = normalizeHugoniotDirection(direction) === BACKWARD_HUGONIOT ? 'plus' : 'minus'
  const hugoniotLeaf = selectLeafFromBifoliation(H, branch)
  const hugoniotPoints = flattenNormalizedSegments(hugoniotLeaf?.curve?.segments ?? [])
  const doubleSonicLines = solveDoubleSonicSegments(params, view).map((segment) => segment?.[0]).filter(Boolean)
  const minHugoniotArcLength = stopFixedState ? 0.035 : 0
  return { fixedState: stopState, params, direction, hugoniotPoints, doubleSonicLines, minHugoniotArcLength }
}

function minDistanceToHugoniot(point, stopGeometry, view) {
  const hugoniotPoint = Number.isFinite(point?.[2])
    ? hugoniotPointAt(point[2], stopGeometry?.fixedState, stopGeometry?.params, stopGeometry?.direction)
    : null
  if (hugoniotPoint) return normalizedDistance3(point, hugoniotPoint, view)
  return minDistanceToPointCloud(point, stopGeometry?.hugoniotPoints, view)
}

function minDistanceToDoubleSonic(point, lines, view) {
  let best = Number.POSITIVE_INFINITY
  for (const q of lines ?? []) {
    const d = normalizedDistanceToTzLine(point, q, view)
    if (d < best) best = d
  }
  return best
}

function stopDistances(point, stopGeometry, view) {
  return {
    hugoniot: minDistanceToHugoniot(point, stopGeometry, view),
    doubleSonic: minDistanceToDoubleSonic(point, stopGeometry?.doubleSonicLines, view),
  }
}

function stopKindAt(point, stopGeometry, view, travelledFromAnchor = 0) {
  const hugoniotTol = 0.004
  const doubleSonicTol = 0.010
  const distances = stopDistances(point, stopGeometry, view)
  const candidates = []
  const allowHugoniotStop = travelledFromAnchor >= (stopGeometry?.minHugoniotArcLength ?? 0)
  if (allowHugoniotStop && distances.hugoniot <= hugoniotTol) candidates.push({ kind: 'hugoniot', distance: distances.hugoniot })
  if (distances.doubleSonic <= doubleSonicTol) candidates.push({ kind: 'doubleSonic', distance: distances.doubleSonic })
  return candidates.sort((a, b) => a.distance - b.distance)[0]?.kind ?? null
}

function pointAlongSegment(a, b, alpha) {
  return interpolate3(a, b, Math.max(0, Math.min(1, alpha)))
}

export function refineStopPointOnStep(previousPoint, nextPoint, stopGeometry, view, travelledFromAnchor = 0) {
  const kind = stopKindAt(nextPoint, stopGeometry, view, travelledFromAnchor)
  if (!kind) return null
  const distanceFor = (alpha) => {
    const point = pointAlongSegment(previousPoint, nextPoint, alpha)
    return kind === 'hugoniot'
      ? minDistanceToHugoniot(point, stopGeometry, view)
      : minDistanceToDoubleSonic(point, stopGeometry?.doubleSonicLines, view)
  }
  let left = 0
  let right = 1
  for (let iter = 0; iter < 32; iter += 1) {
    const m1 = left + (right - left) / 3
    const m2 = right - (right - left) / 3
    if (distanceFor(m1) < distanceFor(m2)) right = m2
    else left = m1
  }
  return pointAlongSegment(previousPoint, nextPoint, (left + right) / 2)
}

export function isStopEvent(point, stopGeometry, view, minIndexFromAnchor = 0, travelledFromAnchor = 0) {
  return Array.isArray(point) && minIndexFromAnchor >= 4 && Boolean(stopKindAt(point, stopGeometry, view, travelledFromAnchor))
}

export { FORWARD_HUGONIOT, BACKWARD_HUGONIOT }
