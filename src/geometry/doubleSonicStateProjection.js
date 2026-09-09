import { solveDoubleSonicSegments } from '../entities/surfaceImplicit/specialSegments.js'
import { projectPointMinus, projectPointPlus } from '../entities/geometry/stateProjections.js'

// Each DS component has fixed (t,z) and arbitrary Y. Its state projection is
// affine in Y, so clip the full line exactly instead of densely sampling it.
export function buildDoubleSonicStateProjection(bounds, params, side = 'minus') {
  if (!bounds || !params || bounds.uMax <= bounds.uMin || bounds.vMax <= bounds.vMin) return []
  const lines = solveDoubleSonicSegments(params, {
    tMin: -Infinity, tMax: Infinity, zMin: -Infinity, zMax: Infinity, yMin: 0, yMax: 1,
  })
  const project = side === 'plus' ? projectPointPlus : projectPointMinus
  return lines.flatMap(([a, b]) => {
    const origin = { t: a[0], Y: a[1], z: a[2] }
    const unit = { t: b[0], Y: b[1], z: b[2] }
    const p = project(origin, params), q = project(unit, params)
    if (!p || !q) return []
    let lo = -Infinity, hi = Infinity
    for (const [axis, min, max] of [['u', bounds.uMin, bounds.uMax], ['v', bounds.vMin, bounds.vMax]]) {
      const slope = q[axis] - p[axis]
      if (Math.abs(slope) < 1e-14) { if (p[axis] < min || p[axis] > max) return []; continue }
      const first = (min - p[axis]) / slope, last = (max - p[axis]) / slope
      lo = Math.max(lo, Math.min(first, last)); hi = Math.min(hi, Math.max(first, last))
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo >= hi) return []
    return [[lo, hi].map(Y => {
      const manifold = { ...origin, Y }, state = project(manifold, params)
      return { manifold, state: { u: state.u, v: state.v } }
    })]
  })
}
