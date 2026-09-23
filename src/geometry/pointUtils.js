export function finite(value) {
  return Number.isFinite(value)
}

export function validWavePoint(point) {
  return point && [point.t, point.Y, point.z].every(finite)
}

export function withCoords(point) {
  return validWavePoint(point) ? { ...point, coords: point.coords ?? [point.t, point.Y, point.z] } : null
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
  const tauScale = Math.max(1e-6, view.tMax - view.tMin)
  const yScale = Math.max(1e-6, view.yMax - view.yMin)
  const zScale = Math.max(1e-6, view.zMax - view.zMin)
  const dt = ((a.t ?? 0) - (b.t ?? 0)) / tauScale
  const dy = ((a.Y ?? 0) - (b.Y ?? 0)) / yScale
  const dz = ((a.z ?? 0) - (b.z ?? 0)) / zScale
  return dt * dt + dy * dy + dz * dz
}

export function normalizedPointDistance(a, b, view) {
  if (!validWavePoint(a) || !validWavePoint(b)) return Number.POSITIVE_INFINITY
  return Math.sqrt(normalizedPointDistance2(a, b, view))
}


