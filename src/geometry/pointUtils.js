export function finite(value) {
  return Number.isFinite(value)
}

export function validWavePoint(point) {
  return point && [point.t, point.Y, point.z].every(finite)
}

export function withCoords(point) {
  return validWavePoint(point) ? { ...point, coords: point.coords ?? [point.t, point.Y, point.z] } : null
}

export function cleanSegment(segment) {
  return (segment ?? []).map(withCoords).filter(Boolean)
}

export function coarsenPoints(points, maxPoints) {
  if (!Array.isArray(points) || points.length <= maxPoints) return points ?? []
  const out = []
  const last = points.length - 1
  for (let i = 0; i < maxPoints; i += 1) {
    out.push(points[Math.round((i * last) / Math.max(1, maxPoints - 1))])
  }
  return out
}

export function normalizedPointDistance2(a, b, view) {
  const tScale = Math.max(1e-6, view.tMax - view.tMin)
  const yScale = Math.max(1e-6, view.yMax - view.yMin)
  const zScale = Math.max(1e-6, view.zMax - view.zMin)
  const dt = ((a.t ?? 0) - (b.t ?? 0)) / tScale
  const dy = ((a.Y ?? 0) - (b.Y ?? 0)) / yScale
  const dz = ((a.z ?? 0) - (b.z ?? 0)) / zScale
  return dt * dt + dy * dy + dz * dz
}

export function normalizedPointDistance(a, b, view) {
  if (!validWavePoint(a) || !validWavePoint(b)) return Number.POSITIVE_INFINITY
  return Math.sqrt(normalizedPointDistance2(a, b, view))
}

export function splitContinuousWavePoints(points, view, maxJump = 0.38) {
  const segments = []
  let current = []

  for (const point of points) {
    if (!validWavePoint(point)) {
      if (current.length >= 2) segments.push(current)
      current = []
      continue
    }

    const decorated = withCoords(point)
    const previous = current[current.length - 1]
    if (previous && normalizedPointDistance(previous, decorated, view) > maxJump) {
      if (current.length >= 2) segments.push(current)
      current = []
    }
    current.push(decorated)
  }

  if (current.length >= 2) segments.push(current)
  return segments
}
