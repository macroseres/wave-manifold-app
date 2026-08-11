import { COMPOSITE } from '../config/numerics'
import { smoothCurveCoords } from './curveSmoothing'

function finite(value) {
  return Number.isFinite(value)
}

export function coordsOf(point) {
  if (!point) return null
  if (Array.isArray(point)) return point
  if (Array.isArray(point.coords)) return point.coords
  if ([point.t, point.Y, point.z].every(finite)) return [point.t, point.Y, point.z]
  return null
}

function normalizeSegment(segment) {
  if (!Array.isArray(segment)) return []
  return segment
    .map(coordsOf)
    .filter((coords) => Array.isArray(coords) && coords.length >= 3 && coords.every(finite))
}

function distance3(a, b) {
  return Math.hypot(
    (a?.[0] ?? 0) - (b?.[0] ?? 0),
    (a?.[1] ?? 0) - (b?.[1] ?? 0),
    (a?.[2] ?? 0) - (b?.[2] ?? 0),
  )
}

function interpolate3(a, b, alpha) {
  return [
    a[0] + alpha * (b[0] - a[0]),
    a[1] + alpha * (b[1] - a[1]),
    a[2] + alpha * (b[2] - a[2]),
  ]
}

function median(values) {
  const clean = values.filter(finite).sort((a, b) => a - b)
  if (!clean.length) return 0
  const mid = Math.floor(clean.length / 2)
  return clean.length % 2 ? clean[mid] : 0.5 * (clean[mid - 1] + clean[mid])
}

function splitLargeJumps(segment) {
  if (!Array.isArray(segment) || segment.length < 2) return []
  const lengths = []
  for (let i = 1; i < segment.length; i += 1) lengths.push(distance3(segment[i - 1], segment[i]))
  const typical = median(lengths)
  if (!finite(typical) || typical <= 1e-12) return [segment]
  const jumpLimit = Math.max(COMPOSITE.DRAW_SPLIT_JUMP_MIN, COMPOSITE.DRAW_SPLIT_JUMP_FACTOR * typical)

  const out = []
  let current = [segment[0]]
  for (let i = 1; i < segment.length; i += 1) {
    const jump = distance3(segment[i - 1], segment[i])
    if (!finite(jump) || jump > jumpLimit) {
      if (current.length >= 2) out.push(current)
      current = [segment[i]]
    } else {
      current.push(segment[i])
    }
  }
  if (current.length >= 2) out.push(current)
  return out
}

function densifySegment(segment, maxEdgeLength = COMPOSITE.DRAW_MAX_EDGE_LENGTH) {
  if (!Array.isArray(segment) || segment.length < 2) return segment ?? []
  if (!finite(maxEdgeLength) || maxEdgeLength <= 0) return segment

  const out = [segment[0]]
  for (let i = 1; i < segment.length; i += 1) {
    const a = segment[i - 1]
    const b = segment[i]
    const length = distance3(a, b)
    if (!finite(length) || length <= 1e-12) continue
    const cuts = Math.max(1, Math.ceil(length / maxEdgeLength))
    for (let k = 1; k <= cuts; k += 1) out.push(interpolate3(a, b, k / cuts))
  }
  return out
}

function resampleSegment(segment, maxPoints = COMPOSITE.DRAW_MAX_POINTS) {
  if (!Array.isArray(segment) || segment.length <= maxPoints) return segment
  if (maxPoints < 3) return [segment[0], segment[segment.length - 1]]

  const s = [0]
  for (let i = 1; i < segment.length; i += 1) {
    s.push(s[i - 1] + distance3(segment[i], segment[i - 1]))
  }
  const total = s[s.length - 1]
  if (!finite(total) || total <= 1e-12) {
    const stride = Math.ceil(segment.length / maxPoints)
    return segment.filter((_, i) => i % stride === 0 || i === segment.length - 1)
  }

  const out = []
  let j = 0
  for (let k = 0; k < maxPoints; k += 1) {
    const target = (k / (maxPoints - 1)) * total
    while (j < s.length - 2 && s[j + 1] < target) j += 1
    const denom = Math.max(1e-12, s[j + 1] - s[j])
    const alpha = Math.max(0, Math.min(1, (target - s[j]) / denom))
    out.push(interpolate3(segment[j], segment[j + 1], alpha))
  }
  return out
}

function smoothCompositePiece(segment) {
  if (!Array.isArray(segment) || segment.length < 4) return segment
  const smoothed = smoothCurveCoords(segment, {
    minPoints: COMPOSITE.DRAW_SMOOTH_MIN_POINTS,
    samplesPerEdge: COMPOSITE.DRAW_SMOOTH_SAMPLES_PER_EDGE,
    maxPoints: COMPOSITE.DRAW_MAX_POINTS,
    curveType: 'centripetal',
    tension: COMPOSITE.DRAW_SMOOTH_TENSION,
  })
  return smoothed.length >= 2 ? smoothed : segment
}

export function buildDrawableCompositeSegments(rawSegments) {
  const output = []
  for (const raw of rawSegments ?? []) {
    const normalized = normalizeSegment(raw)
    if (normalized.length < 2) continue

    const pieces = splitLargeJumps(normalized)
    for (const piece of pieces) {
      const densified = densifySegment(piece)
      const smoothed = smoothCompositePiece(densified)
      const drawable = resampleSegment(smoothed, COMPOSITE.DRAW_MAX_POINTS)
      if (drawable.length >= 2) output.push(drawable)
    }
  }
  return output
}
