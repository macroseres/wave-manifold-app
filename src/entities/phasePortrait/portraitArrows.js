import { physicalPointToVisual } from '../../geometry/zCompactification.js'
import { rarefactionRegularizedField } from '../surfaceImplicit/state.js'

export function orientedRarefactionFieldEdge(a, b, params) {
  const [dt, dz] = rarefactionRegularizedField([(a.t + b.t) / 2, (a.z + b.z) / 2], params)
  const dot = (b.t - a.t) * dt + (b.z - a.z) * dz
  if (!Number.isFinite(dot) || Math.abs(dot) < 1e-18) return null
  return dot > 0 ? [a, b] : [b, a]
}

// Build small chevrons in the scaled scene metric, then map back to local
// coordinates. Nonuniform τ/Y/z scales cannot stretch or rotate the heads.
export function buildPortraitArrowPositions(curves, markerScale, orient, allowed = () => true) {
  const vertices = []
  for (const [curveIndex, curve] of curves.entries()) {
    const points = curve.physical ?? curve.points
    const visual = points.map(p => physicalPointToVisual(p.coords))
    const distance = [0]
    for (let i = 1; i < visual.length; i++) {
      distance.push(distance[i - 1] + Math.hypot(...visual[i].map((x, j) => (x - visual[i - 1][j]) / markerScale[j])))
    }
    const total = distance.at(-1)
    if (total < 0.25) continue
    const count = total > 1.8 ? 2 : 1
    // Stagger neighboring leaves to avoid conspicuous rows of arrowheads.
    const stagger = ((curveIndex * 0.61803398875) % 1 - 0.5) * 0.2
    for (let k = 0; k < count; k++) {
      const target = total * ((k + 1) / (count + 1) + stagger)
      const end = distance.findIndex(d => d >= target)
      if (end < 1) continue
      const a = points[end - 1], b = points[end]
      if (!allowed(a) || !allowed(b)) continue
      const edge = orient(a, b)
      if (!edge) continue
      const [p, q] = edge.map(p => physicalPointToVisual(p.coords).map((x, j) => x / markerScale[j]))
      const tangent = q.map((x, j) => x - p[j]), norm = Math.hypot(...tangent)
      if (norm < 1e-10) continue
      const d = tangent.map(x => x / norm)
      // A symmetric head needs no transported frame and cannot acquire twist.
      const side = Math.hypot(d[0], d[2]) > 1e-8 ? [d[2], 0, -d[0]] : [1, 0, 0]
      const sideNorm = Math.hypot(...side)
      const tip = p.map((x, j) => (x + q[j]) / 2)
      for (const sign of [-1, 1]) vertices.push(...tip.map((x, j) => x * markerScale[j]),
        ...tip.map((x, j) => (x - 0.0875 * d[j] + sign * 0.0225 * side[j] / sideNorm) * markerScale[j]))
    }
  }
  return new Float32Array(vertices)
}
