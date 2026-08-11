function finitePoint(point) {
  return point && Number.isFinite(point.u) && Number.isFinite(point.v)
}

function distance(a, b) {
  return Math.hypot((a.u ?? 0) - (b.u ?? 0), (a.v ?? 0) - (b.v ?? 0))
}

function perpendicularDistance(point, a, b) {
  const dx = b.u - a.u
  const dy = b.v - a.v
  const den = Math.hypot(dx, dy)
  if (den <= 1e-12) return distance(point, a)
  return Math.abs(dy * point.u - dx * point.v + b.u * a.v - b.v * a.u) / den
}

function simplifyDouglasPeucker(points, tolerance) {
  if (!Array.isArray(points) || points.length <= 2 || tolerance <= 0) return points
  let maxDistance = -1
  let index = -1
  const first = points[0]
  const last = points[points.length - 1]
  for (let i = 1; i < points.length - 1; i += 1) {
    const d = perpendicularDistance(points[i], first, last)
    if (d > maxDistance) {
      maxDistance = d
      index = i
    }
  }
  if (maxDistance <= tolerance || index < 0) return [first, last]
  const left = simplifyDouglasPeucker(points.slice(0, index + 1), tolerance)
  const right = simplifyDouglasPeucker(points.slice(index), tolerance)
  return [...left.slice(0, -1), ...right]
}

function splitByJumps(points, bounds, medianFactor = 7) {
  const finite = points.filter(finitePoint)
  if (finite.length < 2) return []
  const distances = []
  for (let i = 1; i < finite.length; i += 1) distances.push(distance(finite[i], finite[i - 1]))
  const sorted = distances.filter(Number.isFinite).sort((a, b) => a - b)
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0
  const span = Math.hypot(Math.max(1e-9, bounds.uMax - bounds.uMin), Math.max(1e-9, bounds.vMax - bounds.vMin))
  const threshold = Math.max(0.04 * span, medianFactor * Math.max(median, 1e-12))
  const segments = [[finite[0]]]
  for (let i = 1; i < finite.length; i += 1) {
    if (distance(finite[i], finite[i - 1]) > threshold) segments.push([])
    segments[segments.length - 1].push(finite[i])
  }
  return segments.filter((segment) => segment.length >= 2)
}

function capSegmentPoints(segment, maxPointsPerSegment) {
  if (!maxPointsPerSegment || segment.length <= maxPointsPerSegment) return segment
  const out = []
  const last = segment.length - 1
  for (let i = 0; i < maxPointsPerSegment; i += 1) {
    out.push(segment[Math.round((i * last) / Math.max(1, maxPointsPerSegment - 1))])
  }
  return out
}

export function processProjectedCurve(points, bounds, options = {}) {
  const {
    simplifyTolerance = 0,
    maxPointsPerSegment = 260,
    medianFactor = 7,
  } = options
  return splitByJumps(points, bounds, medianFactor)
    .map((segment) => simplifyDouglasPeucker(segment, simplifyTolerance))
    .map((segment) => capSegmentPoints(segment, maxPointsPerSegment))
    .filter((segment) => segment.length >= 2)
}

export default processProjectedCurve
