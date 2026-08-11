import { interpolate3, normalizeSegment } from './primitives.js'

function scaleFor(view, axis) {
  const min = view?.[`${axis}Min`] ?? 0
  const max = view?.[`${axis}Max`] ?? 1
  return Math.max(1e-6, Math.abs(max - min))
}

export function normalizedDistance3(a, b, view) {
  if (!Array.isArray(a) || !Array.isArray(b)) return Number.POSITIVE_INFINITY
  const tScale = scaleFor(view, 't')
  const yScale = scaleFor(view, 'y')
  const zScale = scaleFor(view, 'z')
  return Math.hypot(
    ((a[0] ?? 0) - (b[0] ?? 0)) / tScale,
    ((a[1] ?? 0) - (b[1] ?? 0)) / yScale,
    ((a[2] ?? 0) - (b[2] ?? 0)) / zScale,
  )
}

export function closestPointOnSegment(a, b, target, view) {
  if (!Array.isArray(a) || !Array.isArray(b) || !Array.isArray(target)) return null
  const tScale = scaleFor(view, 't')
  const yScale = scaleFor(view, 'y')
  const zScale = scaleFor(view, 'z')
  const na = [a[0] / tScale, a[1] / yScale, a[2] / zScale]
  const nb = [b[0] / tScale, b[1] / yScale, b[2] / zScale]
  const nt = [target[0] / tScale, target[1] / yScale, target[2] / zScale]
  const vx = nb[0] - na[0]
  const vy = nb[1] - na[1]
  const vz = nb[2] - na[2]
  const len2 = vx * vx + vy * vy + vz * vz
  if (len2 <= 1e-18) return null
  const rawAlpha = ((nt[0] - na[0]) * vx + (nt[1] - na[1]) * vy + (nt[2] - na[2]) * vz) / len2
  const alpha = Math.max(0, Math.min(1, rawAlpha))
  const point = interpolate3(a, b, alpha)
  return { point, alpha, distance: normalizedDistance3(point, target, view) }
}

export function normalizedDistanceToTzLine(point, linePoint, view) {
  if (!Array.isArray(point) || !Array.isArray(linePoint)) return Number.POSITIVE_INFINITY
  const tScale = scaleFor(view, 't')
  const zScale = scaleFor(view, 'z')
  return Math.hypot(
    ((point[0] ?? 0) - (linePoint[0] ?? 0)) / tScale,
    ((point[2] ?? 0) - (linePoint[2] ?? 0)) / zScale,
  )
}

export function minDistanceToPointCloud(point, cloud, view) {
  let best = Number.POSITIVE_INFINITY
  for (const q of cloud ?? []) {
    const d = normalizedDistance3(point, q, view)
    if (d < best) best = d
  }
  return best
}

export function minDistanceToSegmentCollection(point, segments, view) {
  if (!Array.isArray(point)) return Number.POSITIVE_INFINITY
  let best = Number.POSITIVE_INFINITY
  for (const segment of segments ?? []) {
    const clean = normalizeSegment(segment)
    if (clean.length < 2) continue
    for (let i = 0; i < clean.length - 1; i += 1) {
      const hit = closestPointOnSegment(clean[i], clean[i + 1], point, view)
      if (hit?.distance < best) best = hit.distance
    }
  }
  return best
}

export function scaledSegmentLength(segment, view) {
  if (!Array.isArray(segment) || segment.length < 2) return 0
  const tScale = scaleFor(view, 't')
  const yScale = scaleFor(view, 'y')
  const zScale = scaleFor(view, 'z')
  let total = 0
  for (let i = 1; i < segment.length; i += 1) {
    const a = segment[i - 1]
    const b = segment[i]
    total += Math.hypot(
      ((b?.[0] ?? 0) - (a?.[0] ?? 0)) / tScale,
      ((b?.[1] ?? 0) - (a?.[1] ?? 0)) / yScale,
      ((b?.[2] ?? 0) - (a?.[2] ?? 0)) / zScale,
    )
  }
  return total
}
