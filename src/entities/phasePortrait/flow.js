// The quadratic flux and its exact Jacobian, shared with Hopf diagnostics.
import { waveSpeed } from '../surfaceImplicit/state.js'

export function selectedStatesPortrait(entries, params) {
  const leftEntry = entries.find(entry => entry.branch === 'slow')
  const rightEntry = entries.find(entry => entry.branch === 'fast')
  const leftState = leftEntry?.selectedState
  const rightState = rightEntry?.selectedState
  if (!leftState || !rightState) return null
  const left = [leftState.uMinus, leftState.vMinus]
  const right = [rightState.uMinus, rightState.vMinus]
  // Same canonical speed associated with the characteristic point UL, updated
  // with current parameters. Never infer a shock speed from the independent pair.
  const speed = waveSpeed(leftState.t, leftState.z, params)
  if (![...left, ...right, speed].every(Number.isFinite)) return null
  const residual = Math.hypot(...viscousField(left, speed, params)(right))
  const scale = 1 + Math.hypot(...flux(left, params)) + Math.hypot(...flux(right, params))
  return { left, right, speed, residual, rightIsEquilibrium: residual <= 1e-8 * scale, selectedStates: true }
}

export function flux([u, v], { a = 0, b1, b2, c }) {
  return [0.5 * (b1 + 1) * u * u + 0.5 * v * v + a * u,
    u * v + c * u - 0.5 * b2 * v * v + a * v]
}

export function fluxJacobian([u, v], { a = 0, b1, b2, c }) {
  return [[(b1 + 1) * u + a, v], [v + c, u - b2 * v + a]]
}

export function viscousJacobian(state, speed, params) {
  const matrix = fluxJacobian(state, params)
  matrix[0][0] -= speed
  matrix[1][1] -= speed
  return matrix
}

export function viscousField(left, speed, params) {
  const base = flux(left, params)
  return state => flux(state, params).map((value, i) => value - base[i] - speed * (state[i] - left[i]))
}

export function viscousSelection(point, params) {
  if (!point) return null
  const left = [point.uMinus, point.vMinus]
  const right = [point.uPlus, point.vPlus]
  if (![...left, ...right, point.s].every(Number.isFinite)) return null
  const residual = Math.hypot(...viscousField(left, point.s, params)(right))
  const scale = 1 + Math.hypot(...flux(left, params)) + Math.hypot(...flux(right, params))
  return residual <= 1e-8 * scale ? { left, right, speed: point.s } : null
}

export function findViscousEquilibria(left, speed, params, bounds, gridSize = 13) {
  if (!left || !bounds || ![...left, speed, bounds.uMin, bounds.uMax, bounds.vMin, bounds.vMax].every(Number.isFinite)) return []
  const field = viscousField(left, speed, params)
  const span = Math.max(bounds.uMax - bounds.uMin, bounds.vMax - bounds.vMin, 1)
  const tolerance = 1e-10 * span
  const roots = []
  const addRoot = (state) => {
    if (!state.every(Number.isFinite)) return
    const margin = 0.03 * span
    if (state[0] < bounds.uMin - margin || state[0] > bounds.uMax + margin || state[1] < bounds.vMin - margin || state[1] > bounds.vMax + margin) return
    if (Math.hypot(...field(state)) > 1e-7 * Math.max(1, span)) return
    if (roots.some(root => Math.hypot(root[0] - state[0], root[1] - state[1]) < 1e-4 * span)) return
    roots.push(state)
  }
  addRoot([...left])
  const seeds = []
  for (let i = 0; i < gridSize; i++) for (let j = 0; j < gridSize; j++) seeds.push([
    bounds.uMin + (i + 0.5) * (bounds.uMax - bounds.uMin) / gridSize,
    bounds.vMin + (j + 0.5) * (bounds.vMax - bounds.vMin) / gridSize,
  ])
  for (const seed of seeds) {
    let state = [...seed]
    for (let iteration = 0; iteration < 35; iteration++) {
      const value = field(state)
      if (Math.hypot(...value) <= tolerance) break
      const [[a, b], [c, d]] = viscousJacobian(state, speed, params)
      const det = a * d - b * c
      if (!Number.isFinite(det) || Math.abs(det) < 1e-13 * Math.max(1, Math.abs(a * d), Math.abs(b * c))) break
      const du = (d * value[0] - b * value[1]) / det
      const dv = (-c * value[0] + a * value[1]) / det
      if (![du, dv].every(Number.isFinite)) break
      const step = Math.hypot(du, dv)
      const damping = step > span ? span / step : 1
      state = [state[0] - damping * du, state[1] - damping * dv]
      if (Math.hypot(damping * du, damping * dv) <= tolerance) break
    }
    addRoot(state)
  }
  return roots.sort((a, b) => Math.hypot(a[0] - left[0], a[1] - left[1]) - Math.hypot(b[0] - left[0], b[1] - left[1]))
}

export function realEigenDirections([[a, b], [c, d]]) {
  const discriminant = (a - d) ** 2 + 4 * b * c
  const tolerance = 1e-10 * Math.max(1, Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d))
  if (discriminant <= tolerance * tolerance) return [] // complex or repeated: no distinguished real axes
  return [-1, 1].map(sign => {
    const value = (a + d + sign * Math.sqrt(discriminant)) / 2
    const candidates = [[b, value - a], [value - d, c]]
    const vector = candidates.sort((x, y) => Math.hypot(...y) - Math.hypot(...x))[0]
    const length = Math.hypot(...vector)
    return Math.abs(value) > tolerance && length > tolerance
      ? { value, vector: vector.map(x => x / length) } : null
  }).filter(Boolean)
}

export function classifyViscousEquilibrium(state, speed, params) {
  const [[a, b], [c, d]] = viscousJacobian(state, speed, params)
  const trace = a + d
  const determinant = a * d - b * c
  const discriminant = trace * trace - 4 * determinant
  const scale = Math.max(1, Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d))
  const tolerance = 1e-9 * scale * scale
  let type = 'não hiperbólico'
  if (determinant < -tolerance) type = 'sela'
  else if (determinant > tolerance) {
    if (discriminant > tolerance) type = trace < 0 ? 'nó atrator' : trace > 0 ? 'nó repulsor' : 'não hiperbólico'
    else if (discriminant < -tolerance) type = trace < 0 ? 'foco atrator' : trace > 0 ? 'foco repulsor' : 'centro linear'
    else type = trace < 0 ? 'nó degenerado atrator' : trace > 0 ? 'nó degenerado repulsor' : 'não hiperbólico'
  }
  return { type, trace, determinant, discriminant }
}

// Marching-squares segments for G_i(u,v)=0.  They are visualization-only:
// equilibria continue to be obtained independently by Newton refinement.
export function buildViscousNullclines(left, speed, params, bounds, samples = 110) {
  const field = viscousField(left, speed, params)
  const n = Math.max(24, Math.min(180, Math.round(samples)))
  const us = Array.from({ length: n + 1 }, (_, i) => bounds.uMin + i * (bounds.uMax - bounds.uMin) / n)
  const vs = Array.from({ length: n + 1 }, (_, j) => bounds.vMin + j * (bounds.vMax - bounds.vMin) / n)
  const values = vs.map(v => us.map(u => field([u, v])))
  const components = [[], []]
  const interpolate = (p, q, fp, fq) => {
    const den = fp - fq
    const t = Math.abs(den) > 1e-15 ? Math.max(0, Math.min(1, fp / den)) : 0.5
    return [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]
  }
  for (let component = 0; component < 2; component++) {
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const corners = [[us[i], vs[j]], [us[i + 1], vs[j]], [us[i + 1], vs[j + 1]], [us[i], vs[j + 1]]]
      const f = [values[j][i][component], values[j][i + 1][component], values[j + 1][i + 1][component], values[j + 1][i][component]]
      if (!f.every(Number.isFinite)) continue
      const hits = []
      for (const [a, b] of [[0,1],[1,2],[2,3],[3,0]]) {
        if ((f[a] <= 0 && f[b] > 0) || (f[a] > 0 && f[b] <= 0)) hits.push(interpolate(corners[a], corners[b], f[a], f[b]))
      }
      if (hits.length === 2) components[component].push(hits)
      else if (hits.length === 4) {
        // Resolve the ambiguous saddle cell using the sign at the bilinear centre.
        const center = (f[0] + f[1] + f[2] + f[3]) / 4
        const sameAs0 = (center <= 0) === (f[0] <= 0)
        const pairs = sameAs0 ? [[0,1],[2,3]] : [[0,3],[1,2]]
        for (const [a,b] of pairs) components[component].push([hits[a], hits[b]])
      }
    }
  }
  return { first: components[0], second: components[1] }
}
