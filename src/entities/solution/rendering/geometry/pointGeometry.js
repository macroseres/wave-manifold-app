import { computeLeftStateFromWavePoint, computeRightStateFromWavePoint, solveBackwardHugoniotPointForFixedRightState } from '../../../surfaceImplicit/index.js'
import { withCoords } from '../../../../geometry/pointUtils.js'
import { HUGONIOT } from '../../../../config/numerics.js'

const ARC_LABELS = {
  hLocal: 'A_{loc}(H)',
  hNonlocal: 'A_{nloc}(H)',
  hNonlocalFromKloc: 'A_{nloc}(H|K_{loc})',
  hNonlocalFromKnloc: 'A_{nloc}(H|K_{nloc})',
  rLocal: 'A_{loc}(R)',
  rNonlocal: 'A_{nloc}(R)',
  k: 'A(K)',
  kLocal: 'A_{loc}(K)',
  kNonlocal: 'A_{nloc}(K)',
}

export function coordsOf(point) {
  if (Array.isArray(point)) return point
  if (Array.isArray(point?.coords)) return point.coords
  if ([point?.t, point?.Y, point?.z].every(Number.isFinite)) return [point.t, point.Y, point.z]
  return null
}

export function uniqueAnchors(points) {
  const out = []
  for (const point of points ?? []) {
    const coords = coordsOf(point)
    if (!coords) continue
    const exists = out.some((p) => {
      const c = coordsOf(p)
      return c && Math.hypot(c[0] - coords[0], c[1] - coords[1], c[2] - coords[2]) < 1e-5
    })
    if (!exists) out.push({ ...point, t: coords[0], Y: coords[1], z: coords[2], coords })
  }
  return out
}

export function pointObjectFromCoords(coords) {
  const c = coordsOf(coords)
  return c ? { t: c[0], Y: c[1], z: c[2], coords: [c[0], c[1], c[2]] } : null
}

export function normalizedDistance3(a, b, view) {
  const ca = coordsOf(a)
  const cb = coordsOf(b)
  if (!ca || !cb) return Number.POSITIVE_INFINITY
  const tauScale = Math.max(1e-6, Math.abs((view?.tMax ?? 1) - (view?.tMin ?? 0)))
  const yScale = Math.max(1e-6, Math.abs((view?.yMax ?? 1) - (view?.yMin ?? 0)))
  const zScale = Math.max(1e-6, Math.abs((view?.zMax ?? 1) - (view?.zMin ?? 0)))
  return Math.hypot(
    (ca[0] - cb[0]) / tauScale,
    (ca[1] - cb[1]) / yScale,
    (ca[2] - cb[2]) / zScale,
  )
}

export function toPointObjectSegments(segments) {
  return (segments ?? [])
    .map((segment) => (segment ?? []).map(pointObjectFromCoords).filter(Boolean))
    .filter((segment) => segment.length >= 2)
}

export function initialAnchorsFromSegments(segments) {
  return uniqueAnchors(
    (segments ?? [])
      .map((segment) => segment?.[0])
      .map(pointObjectFromCoords)
      .filter(Boolean),
  )
}

export function hasUsableSegments(segments) {
  return (segments ?? []).some((segment) => segment?.length >= 2)
}

export function labelForArc(kind, sign) {
  const base = ARC_LABELS[kind] ?? 'A'
  return `${base}_${sign}`
}

export function expandViewZForIntersections(view, margin = HUGONIOT.Z_EXTENSION_MARGIN) {
  const zSpan = Math.max(1, view.zMax - view.zMin)
  return {
    ...view,
    zMin: view.zMin - margin * zSpan,
    zMax: view.zMax + margin * zSpan,
  }
}

export function sampleSaturatedByHPlusPoints(arcSegments, params, view, resolution) {
  const zSamples = Math.max(72, Math.min(140, Math.round(resolution * 2.1)))
  const zSpan = Math.max(1, view.zMax - view.zMin)
  const zMin = view.zMin - HUGONIOT.Z_EXTENSION_MARGIN * zSpan
  const zMax = view.zMax + HUGONIOT.Z_EXTENSION_MARGIN * zSpan
  const zValues = Array.from({ length: zSamples }, (_, j) => zMin + (j * (zMax - zMin)) / Math.max(1, zSamples - 1))
  const points = []

  for (const segment of arcSegments ?? []) {
    const raw = (segment ?? []).map(pointObjectFromCoords).filter(Boolean)
    const stride = Math.max(1, Math.ceil(raw.length / 150))
    const base = raw
      .map((point, index) => ({ point, index }))
      .filter((_, index) => index % stride === 0)
    for (const { point, index } of base) {
      const rightState = computeRightStateFromWavePoint(point.t, point.Y, point.z, params)
      if (!rightState) continue
      for (const z of zValues) {
        const saturated = solveBackwardHugoniotPointForFixedRightState(z, rightState, params)
        const decorated = withCoords(saturated)
        if (decorated) {
          points.push({
            ...decorated,
            generatorPoint: point,
            generatorPrev: raw[Math.max(0, index - stride)] ?? raw[index - 1] ?? point,
            generatorNext: raw[Math.min(raw.length - 1, index + stride)] ?? raw[index + 1] ?? point,
            saturationZ: z,
          })
        }
      }
    }
  }

  return points
}

export function normalizedCoords(point, view) {
  const coords = coordsOf(point)
  if (!coords) return null
  const tauScale = Math.max(1e-6, view.tMax - view.tMin)
  const yScale = Math.max(1e-6, view.yMax - view.yMin)
  const zScale = Math.max(1e-6, view.zMax - view.zMin)
  return [coords[0] / tauScale, coords[1] / yScale, coords[2] / zScale]
}

export function vectorSub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

export function vectorCross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

export function vectorDot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function vectorLength(a) {
  return Math.hypot(a[0], a[1], a[2])
}

export function interpolateCoordsPoint(a, b, alpha) {
  const ca = coordsOf(a)
  const cb = coordsOf(b)
  if (!ca || !cb) return null
  const coords = [
    ca[0] + alpha * (cb[0] - ca[0]),
    ca[1] + alpha * (cb[1] - ca[1]),
    ca[2] + alpha * (cb[2] - ca[2]),
  ]
  return { t: coords[0], Y: coords[1], z: coords[2], coords }
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
  const rawAlpha = ((nt[0] - na[0]) * vx + (nt[1] - na[1]) * vy + (nt[2] - na[2]) * vz) / len2
  const alpha = Math.max(0, Math.min(1, rawAlpha))
  const px = na[0] + alpha * vx
  const py = na[1] + alpha * vy
  const pz = na[2] + alpha * vz
  const dx = px - nt[0]
  const dy = py - nt[1]
  const dz = pz - nt[2]
  const fastPoint = interpolateCoordsPoint(a, b, alpha)
  return fastPoint ? { fastPoint, alpha, d2: dx * dx + dy * dy + dz * dz } : null
}

export function normalizedDistance2Local(a, b, view) {
  const na = normalizedCoords(a, view)
  const nb = normalizedCoords(b, view)
  if (!na || !nb) return Number.POSITIVE_INFINITY
  const dx = na[0] - nb[0]
  const dy = na[1] - nb[1]
  const dz = na[2] - nb[2]
  return dx * dx + dy * dy + dz * dz
}

export function normalizedDistanceLocal(a, b, view) {
  return Math.sqrt(normalizedDistance2Local(a, b, view))
}

export function rightStateDistance2(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY
  const du = (a.uPlus ?? 0) - (b.uPlus ?? 0)
  const dv = (a.vPlus ?? 0) - (b.vPlus ?? 0)
  return du * du + dv * dv
}

export function rightStateAtPoint(point, params) {
  const coords = coordsOf(point)
  return coords ? computeRightStateFromWavePoint(coords[0], coords[1], coords[2], params) : null
}

export function leftStateAtPoint(point, params) {
  const coords = coordsOf(point)
  return coords ? computeLeftStateFromWavePoint(coords[0], coords[1], coords[2], params) : null
}
