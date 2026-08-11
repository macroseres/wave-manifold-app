function coordsOf(point) {
  if (Array.isArray(point)) return point
  if (Array.isArray(point?.coords)) return point.coords
  if ([point?.t, point?.Y, point?.z].every(Number.isFinite)) return [point.t, point.Y, point.z]
  return null
}

function normalizedDistance3(a, b, view) {
  const ca = coordsOf(a)
  const cb = coordsOf(b)
  if (!ca || !cb) return Number.POSITIVE_INFINITY
  const tScale = Math.max(1e-6, Math.abs((view?.tMax ?? 1) - (view?.tMin ?? 0)))
  const yScale = Math.max(1e-6, Math.abs((view?.yMax ?? 1) - (view?.yMin ?? 0)))
  const zScale = Math.max(1e-6, Math.abs((view?.zMax ?? 1) - (view?.zMin ?? 0)))
  return Math.hypot((ca[0] - cb[0]) / tScale, (ca[1] - cb[1]) / yScale, (ca[2] - cb[2]) / zScale)
}

function closestPointOnSegmentToPoint(a, b, target, view) {
  const ca = coordsOf(a)
  const cb = coordsOf(b)
  const ct = coordsOf(target)
  if (!ca || !cb || !ct) return null
  const scales = [
    Math.max(1e-6, Math.abs((view?.tMax ?? 1) - (view?.tMin ?? 0))),
    Math.max(1e-6, Math.abs((view?.yMax ?? 1) - (view?.yMin ?? 0))),
    Math.max(1e-6, Math.abs((view?.zMax ?? 1) - (view?.zMin ?? 0))),
  ]
  const d = ca.map((value, index) => (cb[index] - value) / scales[index])
  const r = ca.map((value, index) => (ct[index] - value) / scales[index])
  const denominator = d.reduce((sum, value) => sum + value * value, 0)
  const alpha = denominator > 0
    ? Math.max(0, Math.min(1, d.reduce((sum, value, index) => sum + value * r[index], 0) / denominator))
    : 0
  const projected = ca.map((value, index) => value + alpha * (cb[index] - value))
  const distance = normalizedDistance3(projected, ct, view)
  return { fastPoint: { coords: projected }, alpha, d2: distance * distance }
}

export function closestProjectionOnPolyline(segment, targetPoint, view) {
  const target = coordsOf(targetPoint)
  if (!target || !Array.isArray(segment) || segment.length < 2) return null
  const points = segment.map(coordsOf).filter(Boolean)
  if (points.length < 2) return null
  let best = null
  for (let i = 0; i < points.length - 1; i += 1) {
    const projection = closestPointOnSegmentToPoint(points[i], points[i + 1], target, view)
    if (!projection?.fastPoint) continue
    if (!best || projection.d2 < best.d2) best = { ...projection, index: i, position: i + projection.alpha }
  }
  return best
}

export function extractCompositeSubarcBetweenPoints(segments, startPoint, stopPoint, view, { preserveStopTarget = true } = {}) {
  const startTarget = coordsOf(startPoint)
  const stopTarget = coordsOf(stopPoint)
  if (!startTarget || !stopTarget) return []
  let best = null
  for (const rawSegment of segments ?? []) {
    const segment = (rawSegment ?? []).map(coordsOf).filter(Boolean)
    if (segment.length < 2) continue
    const start = closestProjectionOnPolyline(segment, startTarget, view)
    const stop = closestProjectionOnPolyline(segment, stopTarget, view)
    if (!start?.fastPoint || !stop?.fastPoint) continue
    const score = start.d2 + stop.d2
    if (!best || score < best.score) best = { segment, start, stop, score }
  }
  if (!best) return []

  const { segment, start, stop } = best
  const subarc = stop.position >= start.position
    ? [start.fastPoint.coords, ...segment.slice(start.index + 1, stop.index + 1), preserveStopTarget ? stopTarget : stop.fastPoint.coords]
    : [start.fastPoint.coords, ...segment.slice(stop.index + 1, start.index + 1).reverse(), preserveStopTarget ? stopTarget : stop.fastPoint.coords]

  const clean = subarc.filter((point, index, array) => index === 0 || normalizedDistance3(point, array[index - 1], view) > 1e-12)
  return clean.length >= 2 ? [clean] : []
}
