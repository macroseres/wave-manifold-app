import { processProjectedCurve } from '../entities/curveProcessing/index.js'

export function finite(x) {
  return Number.isFinite(x)
}

export function boundsFromPoints(points) {
  const finitePoints = (points || []).filter((p) => finite(p.u) && finite(p.v))
  if (!finitePoints.length) return null

  return {
    uMin: Math.min(...finitePoints.map((p) => p.u)),
    uMax: Math.max(...finitePoints.map((p) => p.u)),
    vMin: Math.min(...finitePoints.map((p) => p.v)),
    vMax: Math.max(...finitePoints.map((p) => p.v)),
  }
}

export function padBounds(bounds, padFactor = 0.08, minPad = 1) {
  if (!bounds) return null
  const { uMin, uMax, vMin, vMax } = bounds
  if (![uMin, uMax, vMin, vMax].every(finite) || uMax <= uMin || vMax <= vMin) return null

  const uPad = padFactor * Math.max(1e-6, uMax - uMin, minPad)
  const vPad = padFactor * Math.max(1e-6, vMax - vMin, minPad)
  return {
    uMin: uMin - uPad,
    uMax: uMax + uPad,
    vMin: vMin - vPad,
    vMax: vMax + vPad,
  }
}

export function mergeBounds(...items) {
  const valid = items.filter(Boolean)
  if (!valid.length) return null
  return {
    uMin: Math.min(...valid.map((b) => b.uMin)),
    uMax: Math.max(...valid.map((b) => b.uMax)),
    vMin: Math.min(...valid.map((b) => b.vMin)),
    vMax: Math.max(...valid.map((b) => b.vMax)),
  }
}

export function polylinePoints(points, scale) {
  return points.map((p) => `${scale.x(p.u)},${scale.y(p.v)}`).join(' ')
}

export function marker({ u, v }, scale) {
  return { cx: scale.x(u), cy: scale.y(v) }
}


export function curveSegments(points, bounds, projectionDetail) {
  const span = Math.hypot(
    Math.max(1e-9, bounds.uMax - bounds.uMin),
    Math.max(1e-9, bounds.vMax - bounds.vMin),
  )
  const tolerance = Math.max(0, projectionDetail) * span
  return processProjectedCurve(points, bounds, {
    simplifyTolerance: tolerance,
    maxPointsPerSegment: 260,
    medianFactor: 7,
  })
}
