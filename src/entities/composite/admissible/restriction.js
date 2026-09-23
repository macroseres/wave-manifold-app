import { waveSpeed } from '../../surfaceImplicit/index.js'
import { SPEED_DECREASES, SPEED_INCREASES } from '../../waves/orientation.js'
import { computeCompositeSlowInflectionPoint } from '../../../components/objects/composite/compositeInflectionUtils.js'
import { coordsOf, finite, normalizeSegment } from './primitives.js'
import { minDistanceToSegmentCollection, normalizedDistance3, scaledSegmentLength } from './distance.js'
import { isStopEvent, refineStopPointOnStep } from './stopping.js'

export function filterCompositeBranchesThroughPoint(segments, branchPoint, view, { tolerance = 0.035 } = {}) {
  const target = coordsOf(branchPoint)
  const cleanSegments = (segments ?? []).map(normalizeSegment).filter((segment) => segment.length >= 2)
  if (!target || !cleanSegments.length) return cleanSegments
  const scored = cleanSegments
    .map((segment) => ({ segment, distance: minDistanceToSegmentCollection(target, [segment], view) }))
    .filter((item) => Number.isFinite(item.distance))
    .sort((a, b) => a.distance - b.distance)
  if (!scored.length) return []
  const bestDistance = scored[0].distance
  const threshold = Math.max(tolerance, bestDistance + 1e-7)
  return scored.filter((item) => item.distance <= threshold).map((item) => item.segment)
}

function speedAdmissible(delta, orientation, eps = 5e-6) {
  if (!Number.isFinite(delta)) return false
  if (orientation === SPEED_DECREASES) return delta <= eps
  if (orientation === SPEED_INCREASES) return delta >= -eps
  return true
}

function collectCompositeSide(records, anchorCoords, anchorSpeed, anchorIndex, step, orientation, stopGeometry, view) {
  const out = [[...anchorCoords]]
  let previousSpeed = anchorSpeed
  let i = anchorIndex
  let stepsFromAnchor = 0
  let travelledFromAnchor = 0
  while (true) {
    const nextIndex = i + step
    if (nextIndex < 0 || nextIndex >= records.length) break
    const previousCoords = records[i]?.coords ?? out[out.length - 1]
    const next = records[nextIndex]
    if (!next?.coords || !Number.isFinite(next.speed)) break
    const delta = next.speed - previousSpeed
    if (!speedAdmissible(delta, orientation)) break
    stepsFromAnchor += 1
    const nextTravelled = travelledFromAnchor + normalizedDistance3(previousCoords, next.coords, view)
    const refinedStop = stepsFromAnchor >= 4
      ? refineStopPointOnStep(previousCoords, next.coords, stopGeometry, view, nextTravelled)
      : null
    out.push(refinedStop ? [...refinedStop] : [...next.coords])
    previousSpeed = next.speed
    i = nextIndex
    travelledFromAnchor = nextTravelled
    if (refinedStop || isStopEvent(next.coords, stopGeometry, view, stepsFromAnchor, travelledFromAnchor)) break
  }
  return out.length >= 2 ? out : []
}

function nearestAnchorOnComposite(segments, anchors, view, params) {
  const normalizedAnchors = (anchors ?? []).map(coordsOf).filter(Boolean)
  if (!normalizedAnchors.length) return null
  let best = null
  for (const segment of segments ?? []) {
    const clean = normalizeSegment(segment)
    if (clean.length < 2) continue
    const records = clean.map((coords) => ({ coords, speed: waveSpeed(coords[0], coords[2], params) }))
      .filter((record) => Number.isFinite(record.speed))
    for (let i = 0; i < records.length; i += 1) {
      for (const anchor of normalizedAnchors) {
        const distance = normalizedDistance3(records[i].coords, anchor, view)
        if (!best || distance < best.distance) best = { records, index: i, anchor, distance }
      }
    }
  }
  return best
}

function sideVector(point, origin, view) {
  if (!Array.isArray(point) || !Array.isArray(origin)) return null
  const tauScale = Math.max(1e-6, Math.abs((view?.tMax ?? 1) - (view?.tMin ?? 0)))
  const zScale = Math.max(1e-6, Math.abs((view?.zMax ?? 1) - (view?.zMin ?? 0)))
  return [(point[0] - origin[0]) / tauScale, (point[2] - origin[2]) / zScale]
}

function sideDot(a, b) {
  if (!a || !b) return Number.NaN
  return a[0] * b[0] + a[1] * b[1]
}

function compositeCandidateSideScore(segment, sideReference, view) {
  if (!sideReference || !Array.isArray(segment) || segment.length < 2) return 0
  const probe = segment[Math.min(segment.length - 1, Math.max(1, Math.floor(segment.length * 0.25)))]
  const candidateVector = sideVector(probe, sideReference.origin, view)
  const dot = sideDot(candidateVector, sideReference.targetVector)
  if (!Number.isFinite(dot) || Math.abs(dot) < 1e-7) return 0
  return dot < 0 ? 1 : -1
}

export function restrictCompositeFromRarefactionAnchor(segments, anchors, params, view, orientation, stopGeometry, sideReference = null) {
  if (orientation !== SPEED_DECREASES && orientation !== SPEED_INCREASES) return null
  const match = nearestAnchorOnComposite(segments, anchors, view, params)
  if (!match) return null
  const anchorSpeed = waveSpeed(match.anchor[0], match.anchor[2], params)
  if (!Number.isFinite(anchorSpeed)) return null
  const forward = collectCompositeSide(match.records, match.anchor, anchorSpeed, match.index, 1, orientation, stopGeometry, view)
  const backward = collectCompositeSide(match.records, match.anchor, anchorSpeed, match.index, -1, orientation, stopGeometry, view)
  const candidates = [forward, backward].filter((segment) => segment.length >= 2)
  if (!candidates.length) return null
  return candidates
    .sort((a, b) => {
      const aSide = compositeCandidateSideScore(a, sideReference, view)
      const bSide = compositeCandidateSideScore(b, sideReference, view)
      if (aSide !== bSide) return bSide - aSide
      const aStops = isStopEvent(a[a.length - 1], stopGeometry, view, a.length - 1) ? 1 : 0
      const bStops = isStopEvent(b[b.length - 1], stopGeometry, view, b.length - 1) ? 1 : 0
      if (aStops !== bStops) return bStops - aStops
      return scaledSegmentLength(b, view) - scaledSegmentLength(a, view)
    })
    .slice(0, 1)
}


export function filterCompositeBranchesSharingRarefactionAnchors(
  segments,
  branchPoint,
  rarefactionAnchors,
  view,
  { branchTolerance = 0.035, anchorTolerance = 0.045, fallbackToBranchPoint = false } = {},
) {
  const branchSegments = filterCompositeBranchesThroughPoint(
    segments,
    branchPoint,
    view,
    { tolerance: branchTolerance },
  )
  const anchors = (rarefactionAnchors ?? []).map(coordsOf).filter(Boolean)
  if (!anchors.length || !branchSegments.length) return branchSegments

  const scored = branchSegments
    .map((segment) => {
      let bestAnchorDistance = Number.POSITIVE_INFINITY
      for (const anchor of anchors) {
        const distance = minDistanceToSegmentCollection(anchor, [segment], view)
        if (Number.isFinite(distance) && distance < bestAnchorDistance) bestAnchorDistance = distance
      }
      return { segment, distance: bestAnchorDistance }
    })
    .filter((item) => Number.isFinite(item.distance))
    .sort((a, b) => a.distance - b.distance)

  if (!scored.length) return fallbackToBranchPoint ? branchSegments : []

  // The composite arc must belong to the same connected component of
  // Sat_H(R) cap S that contains BOTH the rarefaction/sonic anchor and the
  // inflection/intersection point.  Do not select a different component merely
  // because it passes close to J.
  const bestDistance = scored[0].distance
  const threshold = Math.max(anchorTolerance, bestDistance + 1e-7)
  const selected = scored
    .filter((item) => item.distance <= threshold)
    .map((item) => item.segment)

  return selected.length ? selected : (fallbackToBranchPoint ? branchSegments : [])
}

export function slowCompositeSideReference({ fixedState, params, view, resolution, inflectionBranch, admissibleOrientation }) {
  if (inflectionBranch !== 'slow' || admissibleOrientation !== SPEED_DECREASES) return null
  const inflection = computeCompositeSlowInflectionPoint(fixedState, params, view, resolution)
  const origin = coordsOf(inflection)
  const target = coordsOf(fixedState)
  const targetVector = sideVector(target, origin, view)
  if (!origin || !targetVector || Math.hypot(targetVector[0], targetVector[1]) < 1e-7) return null
  return { origin, targetVector }
}

export function splitSegmentBySpeed(segment, params, orientation) {
  if (orientation !== SPEED_DECREASES && orientation !== SPEED_INCREASES) return [segment]
  const points = segment
    .map((coords) => ({ coords, speed: waveSpeed(coords[0], coords[2], params) }))
    .filter((item) => Array.isArray(item.coords) && item.coords.every(finite) && Number.isFinite(item.speed))
  const out = []
  let current = []
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]
    const b = points[i + 1]
    if (speedAdmissible(b.speed - a.speed, orientation)) {
      if (current.length === 0) current.push(a.coords)
      current.push(b.coords)
    } else {
      if (current.length >= 2) out.push(current)
      current = []
    }
  }
  if (current.length >= 2) out.push(current)
  return out
}

export function orientSegmentBySpeed(segment, params, orientation) {
  if (!Array.isArray(segment) || segment.length < 2) return segment ?? []
  if (orientation !== SPEED_DECREASES && orientation !== SPEED_INCREASES) return segment
  const first = waveSpeed(segment[0][0], segment[0][2], params)
  const last = waveSpeed(segment[segment.length - 1][0], segment[segment.length - 1][2], params)
  if (!Number.isFinite(first) || !Number.isFinite(last)) return segment
  const alreadyOriented = orientation === SPEED_DECREASES ? last <= first : last >= first
  return alreadyOriented ? segment : [...segment].reverse()
}

export function keepDrawableSegment(segment, view) {
  if (!Array.isArray(segment) || segment.length < 2) return false
  return scaledSegmentLength(segment, view) >= 0.004
}
