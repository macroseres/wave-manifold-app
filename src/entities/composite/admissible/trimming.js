import { coordsOf, normalizeSegment } from './primitives.js'
import { closestPointOnSegment } from './distance.js'

export function trimSegmentCollectionToPoint(segments, stopPoint, view, options = {}) {
  const target = coordsOf(stopPoint)
  if (!target) return segments ?? []
  let best = null
  for (let segmentIndex = 0; segmentIndex < (segments ?? []).length; segmentIndex += 1) {
    const segment = normalizeSegment(segments[segmentIndex])
    for (let pointIndex = 0; pointIndex < segment.length - 1; pointIndex += 1) {
      const hit = closestPointOnSegment(segment[pointIndex], segment[pointIndex + 1], target, view)
      if (!hit) continue
      if (!best || hit.distance < best.distance) best = { ...hit, segment, segmentIndex, pointIndex }
    }
  }
  if (!best) return segments ?? []
  const trimmed = best.segment.slice(0, best.pointIndex + 1)
  trimmed.push(options.preserveTarget ? target : best.point)
  return trimmed.length >= 2 ? [trimmed] : []
}
