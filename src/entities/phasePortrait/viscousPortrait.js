import { integrateOrbit } from '../numerics/integrateOrbit.js'
import { buildViscousNullclines, classifyViscousEquilibrium, findViscousEquilibria, realEigenDirections, viscousField, viscousJacobian } from './flow.js'

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])

function distanceToSegment(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const f = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)))
  return Math.hypot(p[0] - a[0] - f * dx, p[1] - a[1] - f * dy)
}

export function portraitSegmentDistance(a, b, c, d) {
  const cross = (x, y) => x[0] * y[1] - x[1] * y[0]
  const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]]
  const offset = [c[0] - a[0], c[1] - a[1]]
  const denominator = cross(r, s)
  if (Math.abs(denominator) > 1e-16) {
    const t = cross(offset, s) / denominator, u = cross(offset, r) / denominator
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return 0
  }
  return Math.min(distanceToSegment(a, c, d), distanceToSegment(b, c, d),
    distanceToSegment(c, a, b), distanceToSegment(d, a, b))
}

export function buildViscousPortrait(selection, params, bounds, options = {}) {
  if (!selection) return null
  const { left, right, speed } = selection
  const field = viscousField(left, speed, params)
  const uSpan = bounds.uMax - bounds.uMin
  const vSpan = bounds.vMax - bounds.vMin
  const span = Math.min(uSpan, vSpan)
  if (!(span > 0)) return null

  // First find ALL equilibria of the current viscous field.  The portrait is
  // organised by the dynamics, not by the originally selected pair only.
  const equilibriumPoints = findViscousEquilibria(left, speed, params, bounds)
  const separation = distance(left, right)
  const epsilon = Math.max(1e-9, span * 1e-5)
  const stopRadius = Math.max(span * 2e-4, 5e-8)
  const integrationOptions = { maxPoints: 6000, maxAttempts: 30000, maxTime: 2000,
    maxStep: 1, tolerance: 1e-9, chordTolerance: 2e-6,
    stopPoints: equilibriumPoints, stopRadius }
  const curves = []
  const equilibriumData = equilibriumPoints.map((state, index) => ({
    state, index, classification: classifyViscousEquilibrium(state, speed, params),
    directions: realEigenDirections(viscousJacobian(state, speed, params)),
  }))
  const occupied = []
  const candidates = []
  const normalize = p => [(p[0] - bounds.uMin) / uSpan, (p[1] - bounds.vMin) / vSpan]
  const clearance = point => {
    const p = normalize(point)
    let best = Infinity
    for (const [a, b] of occupied) best = Math.min(best, distanceToSegment(p, a, b))
    return best
  }

  const addCurve = (points, kind = 'orbit', metadata = {}) => {
    if (!points || points.length < 3) return
    curves.push({ points, kind, ...metadata })
    const added = []
    for (let i = 1; i < points.length; i++) added.push([normalize(points[i - 1]), normalize(points[i])])
    occupied.push(...added)
    // Incremental nearest-curve distances: previous curves were already tested.
    for (const candidate of candidates) {
      const p = normalize(candidate.seed)
      for (const [a, b] of added) candidate.clearance = Math.min(candidate.clearance, distanceToSegment(p, a, b))
    }
  }

  // Draw the invariant directions of every visible hyperbolic equilibrium.
  // This makes saddles/separatrices the skeleton of the phase portrait.
  equilibriumPoints.forEach((state) => {
    const directions = realEigenDirections(viscousJacobian(state, speed, params))
    const saddle = directions.length === 2 && directions[0].value * directions[1].value < 0
    for (const { value, vector } of directions) {
      if (!Number.isFinite(value) || Math.abs(value) < 1e-12) continue
      for (const sign of [-1, 1]) {
        const seed = state.map((x, i) => x + sign * epsilon * vector[i])
        const points = integrateOrbit(field, seed, bounds, Math.sign(value), {
          ...integrationOptions,
          ignoreStopPoint: state,
        })
        const tail = points.slice(-10)
        const distances = tail.map(p => distance(p, right))
        const connection = selection.rightIsEquilibrium !== false
          && distance(state, left) < 10 * stopRadius && value > 0 && separation > 100 * epsilon
          && tail.length === 10 && distances.at(-1) < Math.max(stopRadius * 3, epsilon * 0.15)
          && distances.every((d, i) => !i || d <= distances[i - 1] * 1.02)
        // Stable manifolds are integrated backwards to reveal their geometry.
        // Reverse their samples so arrows still indicate the physical forward-time flow.
        const stability = value < 0 ? 'stable' : 'unstable'
        const orientedPoints = stability === 'stable' ? [...points].reverse() : points
        addCurve(orientedPoints, connection ? 'connection' : saddle ? 'separatrix' : 'orbit', {
          equilibrium: state, eigenvalue: value, stability, branchSign: sign,
        })
      }
    }
  })

  // Fill the largest uncovered regions first, in normalized view coordinates.
  // Spacing controls seed selection only, never truncates an integral curve.
  const cols = 13
  const rows = 11
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const fu = (i + 0.5 + (j % 2) * 0.23) / cols
      const fv = (j + 0.5) / rows
      const seed = [
        bounds.uMin + Math.min(0.96, fu) * uSpan,
        bounds.vMin + fv * vSpan,
      ]
      if (equilibriumPoints.some(eq => distance(seed, eq) < 0.045 * span)) continue
      candidates.push({ seed, clearance: clearance(seed) })
    }
  }
  for (let count = 0; count < 36 && candidates.length; count++) {
    let bestIndex = 0, bestDistance = -1
    for (let i = 0; i < candidates.length; i++) {
      const d = candidates[i].clearance
      if (d > bestDistance) { bestDistance = d; bestIndex = i }
    }
    if (bestDistance < 0.045) break
    const [{ seed }] = candidates.splice(bestIndex, 1)
    const backward = integrateOrbit(field, seed, bounds, -1, integrationOptions)
    const forward = integrateOrbit(field, seed, bounds, 1, integrationOptions)
    addCurve([...backward.slice(0, -1), ...forward], 'orbit')
  }

  const nullclines = options.nullclines ? buildViscousNullclines(left, speed, params, bounds) : null
  return { ...selection, equilibriumPoints, equilibriumData, nullclines, curves, options }
}

// Changing the target or layer visibility does not require reintegrating G.
export function retargetViscousPortrait(data, selection, options, bounds) {
  const span = Math.min(bounds.uMax - bounds.uMin, bounds.vMax - bounds.vMin)
  const stopRadius = Math.max(span * 2e-4, 5e-8)
  const epsilon = Math.max(1e-9, span * 1e-5)
  const separation = distance(selection.left, selection.right)
  const curves = data.curves.map(curve => {
    if (!(curve.eigenvalue > 0) || !curve.equilibrium || distance(curve.equilibrium, selection.left) >= 10 * stopRadius) return curve
    const distances = curve.points.slice(-10).map(p => distance(p, selection.right))
    const connection = selection.rightIsEquilibrium !== false && separation > 100 * epsilon
      && distances.length === 10 && distances.at(-1) < Math.max(stopRadius * 3, epsilon * 0.15)
      && distances.every((d, i) => !i || d <= distances[i - 1] * 1.02)
    return connection ? { ...curve, kind: 'connection' } : curve
  })
  return { ...data, ...selection, options, curves }
}
