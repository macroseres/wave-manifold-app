export function finite(value) {
  return Number.isFinite(value)
}

export function coordsOf(point) {
  if (!point) return null
  if (Array.isArray(point)) return point
  if (Array.isArray(point.coords)) return point.coords
  if ([point.t, point.Y, point.z].every(finite)) return [point.t, point.Y, point.z]
  return null
}

export function branchFromT(t, fallbackBranch = null) {
  if (t < -1e-9) return 'fast'
  if (t > 1e-9) return 'slow'
  return fallbackBranch ?? 'slow'
}

export function solutionProbePointFromLineEvent(event, fallbackBranch, attachedCurve) {
  const local = event.object.worldToLocal(event.point.clone())
  const t = local.x
  const Y = local.y
  const z = local.z
  return { t, Y, z, coords: [t, Y, z], branch: branchFromT(t, fallbackBranch), attachedCurve }
}

export function normalizeSegment(segment) {
  if (!Array.isArray(segment)) return []
  return segment
    .map(coordsOf)
    .filter((coords) => Array.isArray(coords) && coords.length >= 3 && coords.every(finite))
}

export function interpolate3(a, b, alpha) {
  return [
    a[0] + alpha * (b[0] - a[0]),
    a[1] + alpha * (b[1] - a[1]),
    a[2] + alpha * (b[2] - a[2]),
  ]
}

export function flattenNormalizedSegments(segments) {
  return (segments ?? []).flatMap((segment) => normalizeSegment(segment))
}
