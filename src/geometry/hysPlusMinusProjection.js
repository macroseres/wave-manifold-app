import { solveRightHysteresisPoint, computeLeftStateFromWavePoint } from '../entities/surfaceImplicit/index.js'
import { findHysteresisDoubleStates } from './hysteresisSelfIntersection.js'

// Trace the normalization of the nodal cubic rather than pairing cell edges:
// both branches must actually pass through the same double point.
export function buildHysPlusMinusProjection(bounds, params, resolution = 420) {
  if (!bounds || !params) return []
  const uSpan = bounds.uMax - bounds.uMin, vSpan = bounds.vMax - bounds.vMin
  if (!(uSpan > 0 && vSpan > 0)) return []
  const count = Math.max(800, resolution * 3), margin = 1e-6
  const angles = Array.from({ length: count + 1 }, (_, i) => -Math.PI / 2 + margin + (Math.PI - 2 * margin) * i / count)
  const doublePoints = new Map()
  for (const point of findHysteresisDoubleStates(params)) for (const seed of point.seeds) {
    const angle = Math.atan(seed)
    angles.push(angle)
    doublePoints.set(angle, { u: point.uMinus, v: point.vMinus })
  }
  angles.sort((a, b) => a - b)
  const evaluate = angle => {
    const h = solveRightHysteresisPoint(Math.tan(angle), params)
    if (!h) return null
    const p = computeLeftStateFromWavePoint(h.t, h.Y, h.z, params)
    return p && { state: doublePoints.get(angle) ?? { u: p.uMinus, v: p.vMinus }, manifold: h }
  }
  const segments = []
  const trace = (a, b, pa, pb, depth) => {
    const mid = (a + b) / 2, pm = evaluate(mid)
    if (!pa || !pb || !pm) return
    const pole = pa.manifold.det * pm.manifold.det <= 0 || pm.manifold.det * pb.manifold.det <= 0
    const error = Math.hypot((pm.state.u - (pa.state.u + pb.state.u) / 2) / uSpan, (pm.state.v - (pa.state.v + pb.state.v) / 2) / vSpan)
    const jump = Math.hypot((pa.state.u - pb.state.u) / uSpan, (pa.state.v - pb.state.v) / vSpan)
    if (pole || error > .00015 || jump > .025) {
      if (depth < 10) { trace(a, mid, pa, pm, depth + 1); trace(mid, b, pm, pb, depth + 1) }
      return
    }
    if (Math.max(pa.state.u, pb.state.u) < bounds.uMin || Math.min(pa.state.u, pb.state.u) > bounds.uMax
      || Math.max(pa.state.v, pb.state.v) < bounds.vMin || Math.min(pa.state.v, pb.state.v) > bounds.vMax) return
    segments.push([pa, pb])
  }
  let previous = evaluate(angles[0])
  for (let i = 1; i < angles.length; i++) {
    const current = evaluate(angles[i])
    trace(angles[i - 1], angles[i], previous, current, 0)
    previous = current
  }
  return segments
}
