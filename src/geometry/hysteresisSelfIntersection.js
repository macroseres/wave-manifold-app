import { solveRightHysteresisPoint, computeLeftStateFromWavePoint } from '../entities/surfaceImplicit/index.js'
import { buildHugoniotLeaf } from '../entities/waves/hugoniotLeaf.js'

function stateAt(angle, params) {
  const h = solveRightHysteresisPoint(Math.tan(angle), params)
  return h && computeLeftStateFromWavePoint(h.t, h.Y, h.z, params)
}

// Find transverse crossings of pi_-(Hys+), then refine the two distinct seeds.
// No default-parameter coordinates are baked into the construction.
export function findHysteresisDoubleStates(params) {
  const count = 800, start = -Math.PI / 2 + 1e-5, step = (Math.PI - 2e-5) / count
  const states = Array.from({ length: count + 1 }, (_, i) => stateAt(start + step * i, params))
  const result = []
  for (let i = 0; i < count; i++) for (let j = i + 4; j < count; j++) {
    const a = states[i], b = states[i + 1], c = states[j], d = states[j + 1]
    if (!a || !b || !c || !d) continue
    if (Math.max(a.u, b.u) < Math.min(c.u, d.u) || Math.max(c.u, d.u) < Math.min(a.u, b.u)
      || Math.max(a.v, b.v) < Math.min(c.v, d.v) || Math.max(c.v, d.v) < Math.min(a.v, b.v)) continue
    const dx = b.u - a.u, dy = b.v - a.v, ex = d.u - c.u, ey = d.v - c.v
    const det = dx * ey - dy * ex
    if (Math.abs(det) < 1e-16) continue
    const rx = c.u - a.u, ry = c.v - a.v
    const f = (rx * ey - ry * ex) / det, g = (rx * dy - ry * dx) / det
    if (f < 0 || f > 1 || g < 0 || g > 1) continue
    let x = start + step * (i + f), y = start + step * (j + g), valid = true
    for (let k = 0; k < 20; k++) {
      const u = stateAt(x, params), v = stateAt(y, params), h = 1e-6
      const ux = stateAt(x + h, params), vy = stateAt(y + h, params)
      if (![u, v, ux, vy].every(Boolean)) { valid = false; break }
      const A = (ux.u - u.u) / h, B = -(vy.u - v.u) / h
      const C = (ux.v - u.v) / h, D = -(vy.v - v.v) / h
      const determinant = A * D - B * C
      if (Math.abs(determinant) < 1e-10) { valid = false; break }
      const r = u.u - v.u, s = u.v - v.v
      if (Math.hypot(r, s) < 1e-11) break
      const deltaX = (D * r - B * s) / determinant, deltaY = (-C * r + A * s) / determinant
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) > .1) { valid = false; break }
      x -= deltaX; y -= deltaY
    }
    if (!valid || Math.abs(x - y) < 1e-3 || Math.abs(x) >= Math.PI / 2 || Math.abs(y) >= Math.PI / 2) continue
    const u = stateAt(x, params), v = stateAt(y, params)
    if (!u || !v || Math.hypot(u.u - v.u, u.v - v.v) > 1e-8) continue
    if (result.some(p => Math.hypot(p.uMinus - u.u, p.vMinus - u.v) < 1e-6)) continue
    result.push({ uMinus: u.u, vMinus: u.v, seeds: [Math.tan(x), Math.tan(y)] })
  }
  return result
}

export function buildHysteresisSelfIntersectionSegments(params, view) {
  return findHysteresisDoubleStates(params).flatMap(fixedState => (
    buildHugoniotLeaf({ fixedState, params, view, samples: 1400, direction: 'minus', compactifiedZ: true }).curve.segments
      .map(segment => segment.map(point => [point.t, point.Y, point.z]))
  ))
}
