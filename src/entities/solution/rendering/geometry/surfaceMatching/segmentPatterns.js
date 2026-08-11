import { coarsenPoints } from '../../../../../geometry/pointUtils.js'
import {
  closestPointOnSegmentToPoint,
  interpolateCoordsPoint,
  normalizedDistance3,
  normalizedDistanceLocal,
  pointObjectFromCoords,
} from '../pointGeometry.js'
import { refineFastSegmentHPlusClosestPoint, surfaceCrossingQuality } from './fastSurfaceRefinement.js'

export function coarsenSegments(segments, maxPoints) {
  const cleanSegments = (segments ?? [])
    .map((segment) => (segment ?? []).map(pointObjectFromCoords).filter(Boolean))
    .filter((segment) => segment.length >= 2)
  const total = cleanSegments.reduce((sum, segment) => sum + segment.length, 0)
  if (total <= maxPoints) return cleanSegments
  const stride = Math.max(1, Math.ceil(total / maxPoints))
  return cleanSegments
    .map((segment) => {
      const out = segment.filter((_, index) => index % stride === 0)
      const last = segment[segment.length - 1]
      if (out[out.length - 1] !== last) out.push(last)
      return out
    })
    .filter((segment) => segment.length >= 2)
}

export function closestPointBetweenFastSegmentsAndSurface(fastSegments, surfacePoints, params, view) {
  const sampledSurface = coarsenPoints(surfacePoints, 1200)
  const sampledFastSegments = coarsenSegments(fastSegments, 420)
  let best = null

  for (const fastSegment of sampledFastSegments) {
    for (let i = 0; i < fastSegment.length - 1; i += 1) {
      const a = fastSegment[i]
      const b = fastSegment[i + 1]
      for (const surfacePoint of sampledSurface) {
        const projected = closestPointOnSegmentToPoint(a, b, surfacePoint, view)
        if (!projected) continue
        const candidate = {
          ...projected,
          surfacePoint,
          segmentStart: a,
          segmentEnd: b,
        }
        if (!best || candidate.d2 < best.d2) best = candidate
      }
    }
  }

  const refined = refineFastSegmentHPlusClosestPoint(best, params, view)
  const quality = surfaceCrossingQuality(refined, params, view)
  return quality.crosses ? { ...refined, ...quality } : null
}

export function dedupeIntersectionResults(points, view) {
  const minSeparation = 0.03
  const sorted = [...(points ?? [])].sort((a, b) => {
    const distanceOrder = (a.normalizedDistance ?? Infinity) - (b.normalizedDistance ?? Infinity)
    if (Math.abs(distanceOrder) > 1e-8) return distanceOrder
    return (a.planeResidual ?? Infinity) - (b.planeResidual ?? Infinity)
  })
  const kept = []

  for (const point of sorted) {
    const duplicateIndex = kept.findIndex((candidate) => {
      const sameFastArc = candidate.fastKind === point.fastKind
      const sameSlowArc = candidate.slowKind === point.slowKind
      const sameVisibleIntersection = normalizedDistanceLocal(candidate.fastIntersectionPoint, point.fastIntersectionPoint, view) <= minSeparation
      const sameSlowMarker = normalizedDistanceLocal(candidate, point, view) <= minSeparation
      return sameVisibleIntersection || ((sameFastArc || sameSlowArc) && sameSlowMarker)
    })

    if (duplicateIndex < 0) {
      kept.push(point)
      continue
    }

    const pointScore = (point.normalizedDistance ?? Infinity) + 0.35 * (point.planeResidual ?? Infinity)
    const keptScore = (kept[duplicateIndex].normalizedDistance ?? Infinity) + 0.35 * (kept[duplicateIndex].planeResidual ?? Infinity)
    if (pointScore < keptScore) {
      kept[duplicateIndex] = point
    }
  }

  return kept.sort((a, b) => {
    if (a.fastKind !== b.fastKind) return a.fastKind.localeCompare(b.fastKind)
    return a.slowKind.localeCompare(b.slowKind)
  })
}

export function splitSegmentByPattern(segment, view, pattern) {
  if (!Array.isArray(segment) || segment.length < 2) return []
  const pieces = []
  let patternIndex = 0
  let remainingPattern = pattern[0]?.length ?? 0
  let drawing = pattern[0]?.draw ?? true
  let currentPiece = []

  const pushPoint = (point) => {
    if (!drawing) return
    if (currentPiece.length === 0) currentPiece.push(point)
    else currentPiece.push(point)
  }

  const finishDrawPiece = () => {
    if (currentPiece.length >= 2) pieces.push(currentPiece)
    currentPiece = []
  }

  for (let pointIndex = 0; pointIndex < segment.length - 1; pointIndex += 1) {
    const start = segment[pointIndex]
    const end = segment[pointIndex + 1]
    let consumed = 0
    const segmentLength = normalizedDistance3(start, end, view)
    if (segmentLength <= 1e-10) continue

    if (drawing && currentPiece.length === 0) currentPiece.push(start)

    while (consumed < segmentLength - 1e-10) {
      const step = Math.min(remainingPattern, segmentLength - consumed)
      const alpha = (consumed + step) / segmentLength
      const point = interpolateCoordsPoint(start, end, alpha)
      if (point) pushPoint(point.coords)
      consumed += step
      remainingPattern -= step

      if (remainingPattern <= 1e-10) {
        if (drawing) finishDrawPiece()
        patternIndex = (patternIndex + 1) % pattern.length
        remainingPattern = pattern[patternIndex].length
        drawing = pattern[patternIndex].draw
        if (drawing && point) currentPiece = [point.coords]
      }
    }
  }

  if (drawing) finishDrawPiece()
  return pieces
}

export function dashDotDotSegments(segments, view) {
  const pattern = [
    { draw: true, length: 0.055 },
    { draw: false, length: 0.022 },
    { draw: true, length: 0.006 },
    { draw: false, length: 0.018 },
    { draw: true, length: 0.006 },
    { draw: false, length: 0.03 },
  ]
  return (segments ?? []).flatMap((segment) => splitSegmentByPattern(segment, view, pattern))
}
