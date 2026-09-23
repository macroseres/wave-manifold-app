import { BACKWARD_HUGONIOT } from '../../../hugoniot/directions.js'
import { solveBackwardHugoniotPointForFixedRightState, solveHugoniotPointForFixedState } from '../../../surfaceImplicit/index.js'
import { HUGONIOT } from '../../../../config/numerics.js'
import { coordsOf, pointObjectFromCoords, interpolatePoint, uniqueAnchors } from '../pipelineShared.js'

export function normalizedDistance3(a, b, view) {
  const ca = coordsOf(a)
  const cb = coordsOf(b)
  if (!ca || !cb) return Number.POSITIVE_INFINITY
  const tauScale = Math.max(1e-6, Math.abs((view?.tMax ?? 1) - (view?.tMin ?? 0)))
  const yScale = Math.max(1e-6, Math.abs((view?.yMax ?? 1) - (view?.yMin ?? 0)))
  const zScale = Math.max(1e-6, Math.abs((view?.zMax ?? 1) - (view?.zMin ?? 0)))
  return Math.hypot((ca[0] - cb[0]) / tauScale, (ca[1] - cb[1]) / yScale, (ca[2] - cb[2]) / zScale)
}

export function normalizedCoords(point, view) {
  const coords = coordsOf(point)
  if (!coords) return null
  return [
    coords[0] / Math.max(1e-6, view.tMax - view.tMin),
    coords[1] / Math.max(1e-6, view.yMax - view.yMin),
    coords[2] / Math.max(1e-6, view.zMax - view.zMin),
  ]
}

export function closestPointOnSegmentToPoint(a, b, target, view) {
  const na = normalizedCoords(a, view)
  const nb = normalizedCoords(b, view)
  const nt = normalizedCoords(target, view)
  if (!na || !nb || !nt) return null
  const vx = nb[0] - na[0]
  const vy = nb[1] - na[1]
  const vz = nb[2] - na[2]
  const len2 = vx * vx + vy * vy + vz * vz
  if (len2 <= 1e-18) return null
  const alpha = Math.max(0, Math.min(1, ((nt[0] - na[0]) * vx + (nt[1] - na[1]) * vy + (nt[2] - na[2]) * vz) / len2))
  const fastPoint = interpolatePoint(a, b, alpha)
  if (!fastPoint) return null
  const p = normalizedCoords(fastPoint, view)
  return { fastPoint, alpha, d2: (p[0] - nt[0]) ** 2 + (p[1] - nt[1]) ** 2 + (p[2] - nt[2]) ** 2 }
}

export function hugoniotPointAt(z, fixedState, params, direction) {
  return direction === BACKWARD_HUGONIOT
    ? solveBackwardHugoniotPointForFixedRightState(z, fixedState, params)
    : solveHugoniotPointForFixedState(z, fixedState, params)
}

export function initialAnchorsFromSegments(segments) {
  return uniqueAnchors((segments ?? []).map((segment) => segment?.[0]).map(pointObjectFromCoords).filter(Boolean))
}

export function scaledSegmentLength(segment, view) {
  if (!Array.isArray(segment) || segment.length < 2) return 0
  let total = 0
  for (let i = 1; i < segment.length; i += 1) total += normalizedDistance3(segment[i - 1], segment[i], view)
  return total
}

export function minDistanceToSegmentCollection(point, segments, view) {
  const target = coordsOf(point)
  if (!target) return Number.POSITIVE_INFINITY
  let best = Number.POSITIVE_INFINITY
  for (const segment of segments ?? []) {
    const points = (segment ?? []).map(pointObjectFromCoords).filter(Boolean)
    if (points.length < 2) continue
    for (let i = 0; i < points.length - 1; i += 1) {
      const hit = closestPointOnSegmentToPoint(points[i], points[i + 1], target, view)
      if (!hit) continue
      const d = Math.sqrt(hit.d2)
      if (d < best) best = d
    }
  }
  return best
}

export function filterCompositeBranchesThroughPoint(segments, branchPoint, view, { tolerance = 0.035 } = {}) {
  const target = coordsOf(branchPoint)
  const cleanSegments = (segments ?? [])
    .map((segment) => (segment ?? []).map(coordsOf).filter(Boolean))
    .filter((segment) => segment.length >= 2)
  if (!target || !cleanSegments.length) return cleanSegments

  const scored = cleanSegments
    .map((segment) => ({ segment, distance: minDistanceToSegmentCollection(target, [segment], view) }))
    .filter((item) => Number.isFinite(item.distance))
    .sort((a, b) => a.distance - b.distance)
  if (!scored.length) return []

  const bestDistance = scored[0].distance
  const threshold = Math.max(tolerance, bestDistance + 1e-7)
  return scored
    .filter((item) => item.distance <= threshold)
    .map((item) => item.segment)
}


export function expandViewZForIntersections(view, margin = HUGONIOT.Z_EXTENSION_MARGIN) {
  if (!view) return view
  const zSpan = Math.max(1, (view.zMax ?? 1) - (view.zMin ?? -1))
  return {
    ...view,
    zMin: (view.zMin ?? -1) - margin * zSpan,
    zMax: (view.zMax ?? 1) + margin * zSpan,
  }
}

export function terminalAnchorFromFirstSegment(segments) {
  const first = (segments ?? []).find((segment) => segment?.length >= 2)
  return first ? pointObjectFromCoords(first[first.length - 1]) : null
}

export function trimSegmentsToPoint(segments, targetPoint, view, options = {}) {
  const target = pointObjectFromCoords(targetPoint)
  if (!target) return segments ?? []
  const out = []
  for (const segment of segments ?? []) {
    const points = (segment ?? []).map(pointObjectFromCoords).filter(Boolean)
    if (points.length < 2) continue

    let best = null
    for (let i = 0; i < points.length - 1; i += 1) {
      const projection = closestPointOnSegmentToPoint(points[i], points[i + 1], target, view)
      if (!projection?.fastPoint) continue
      if (!best || projection.d2 < best.d2) best = { ...projection, index: i }
    }
    if (!best) continue

    const trimmed = [
      ...points.slice(0, best.index + 1).map((point) => point.coords),
      options.preserveTarget ? target.coords : best.fastPoint.coords,
    ].filter((point, index, array) => index === 0 || normalizedDistance3(point, array[index - 1], view) > 1e-12)

    if (trimmed.length >= 2) out.push(trimmed)
  }
  return out.length ? out : (segments ?? [])
}
