import { compositeChart, compositeField, compositeSingularities } from './compositeField.js'
import { viscousJacobian } from './flow.js'
import { integrateOrbit } from '../numerics/integrateOrbit.js'
import { solveCharacteristicHugoniotIntersections } from '../surfaceImplicit/intersections.js'
import { waveSpeed, computeStateFromCharacteristicPoint } from '../surfaceImplicit/state.js'
import { buildRarefactionSegmentsData } from '../waves/rarefactionSegmentsData.js'
import { FORWARD_HUGONIOT } from '../hugoniot/directions.js'
import { physicalZToVisual } from '../../geometry/zCompactification.js'

const inside = (p, view) => p.t >= view.tMin && p.t <= view.tMax && p.Y >= view.yMin && p.Y <= view.yMax
const localCoordinates = (p, chart) => chart.startsWith('infinity')
  ? [chart === 'infinityY' ? p.Y * p.z : -p.t * p.z * p.z, 1 / p.z] : [chart === 't' ? p.t : p.Y, p.z]

function preferredChart(p, params, current) {
  const { b1: b, b2: d } = params, z = p.z
  if (Math.abs(z) > (current.startsWith('infinity') ? 2 : 5)) {
    const x = 1 / z, tc = Math.abs(2 * b * (b + 1 + 3 * x * x - d * x ** 3))
    const yc = Math.abs(-(b + 1) + d * (b + 1) * x + x * x)
    if (current === 'infinity' && yc > 0.2 * tc) return current
    if (current === 'infinityY' && tc > 0.2 * yc) return current
    return yc >= tc ? 'infinity' : 'infinityY'
  }
  const tc = Math.abs(2 * b * ((b + 1) * z ** 3 - d + 3 * z))
  const yc = Math.abs(1 + d * (b + 1) * z - (b + 1) * z * z)
  if (current === 't' && yc > 0.2 * tc) return 't'
  if (current === 'Y' && tc > 0.2 * yc) return 'Y'
  return yc >= tc ? 't' : 'Y'
}

// Continue at a chart boundary, never join disconnected sonic components.
export function traceCompositeOrbit(seed, params, view, initialChart, initialRow, direction) {
  const parts = []
  const critical = compositeSingularities(params)
  const visual = p => [p.t / Math.max(1, view.tMax - view.tMin), p.Y / Math.max(1, view.yMax - view.yMin), physicalZToVisual(p.z)]
  const distance = (a, b) => Math.hypot(...a.map((x, i) => x - b[i]))
  const roots = critical.filter(s => Number.isFinite(s.z)).map(visual)
  let travelled = 0, previous = visual(compositeChart(seed, params, initialChart).point)
  const history = [{ p: previous, length: 0 }]
  let finished = false
  let chart = initialChart, row = initialRow, origin = seed, travel = direction
  for (let transition = 0; transition < 16; transition++) {
    const rawField = p => compositeField(p, params, chart, row)
    const field = p => {
      const f = rawField(p), norm = Math.max(1, Math.hypot(...f))
      return f.map(x => x / norm)
    }
    const start = compositeChart(origin, params, chart).point
    if (!inside(start, view)) break
    const radius = Math.max(100, 2 * Math.abs(origin[0]))
    const bounds = { uMin: -radius, uMax: radius, vMin: chart.startsWith('infinity') ? -0.55 : -6, vMax: chart.startsWith('infinity') ? 0.55 : 6 }
    const needsSwitch = state => {
      const s = compositeChart(state, params, chart)
      const m = viscousJacobian(s.state, s.speed, params)
      return preferredChart(s.point, params, chart) !== chart || Math.hypot(...m[row]) < 0.2 * Math.hypot(...m[1 - row])
    }
    const orbit = integrateOrbit(field, origin, bounds, travel, { maxTime: 100, maxPoints: 2400,
      maxAttempts: 10000, tolerance: 1e-9, chordTolerance: 1e-5,
      stopWhen: state => {
        const p = compositeChart(state, params, chart).point, v = visual(p)
        travelled += distance(previous, v); previous = v
        finished = travelled > 0.02 && roots.some(root => distance(root, v) < 2e-5)
        // Separatrices can be homoclinic. Do not wind repeatedly around a
        // numerical approximation to a closed orbit after returning to it.
        if (travelled > 0.2 && history.some(old => travelled - old.length > 0.2 && distance(old.p, v) < 0.0003)) finished = true
        if (travelled - history.at(-1).length > 0.01) history.push({ p: v, length: travelled })
        return finished || !inside(p, view) || needsSwitch(state)
      },
    })
    // Z=0 is a chart seam in this rectangular display. Split, don't draw
    // a chord from z=-infinity to z=+infinity across the whole scene.
    let part = [], chartPoints = []
    const push = () => { if (part.length > 1) parts.push({ points: part, chartPoints, chart, row }); part = []; chartPoints = [] }
    for (const state of orbit) {
      const p = compositeChart(state, params, chart).point
      if (!p.coords.every(Number.isFinite) || (chart.startsWith('infinity') && chartPoints.length && state[1] * chartPoints.at(-1)[1] < 0)) push()
      if (p.coords.every(Number.isFinite)) { part.push(p); chartPoints.push(state) }
    }
    push()
    const endpoint = travel < 0 ? orbit[0] : orbit.at(-1)
    if (finished || !endpoint || !needsSwitch(endpoint)) break
    const surface = compositeChart(endpoint, params, chart), p = surface.point
    if (!inside(p, view) || !p.coords.every(Number.isFinite)) break
    const nextChart = preferredChart(p, params, chart)
    const m = viscousJacobian(surface.state, surface.speed, params)
    const nextRow = Math.hypot(...m[0]) >= Math.hypot(...m[1]) ? 0 : 1
    const nextOrigin = localCoordinates(p, nextChart)
    const f = field(endpoint), h = 1e-6
    const nearby = compositeChart(endpoint.map((v, i) => v + h * f[i]), params, chart).point
    const tangent = localCoordinates(nearby, nextChart).map((v, i) => (v - nextOrigin[i]) / h)
    const nextField = compositeField(nextOrigin, params, nextChart, nextRow)
    travel *= Math.sign(tangent[0] * nextField[0] + tangent[1] * nextField[1]) || 1
    origin = nextOrigin; chart = nextChart; row = nextRow
  }
  return parts
}

export function buildCompositeSpecialElements(params, view) {
  const singularities = compositeSingularities(params), separatrices = [], eigenDirections = []
  for (const s of singularities) {
    for (const [index, eigen] of s.eigenDirections.entries()) {
      if (s.chart === 'infinity' && Math.abs(eigen.vector[1]) < 1e-10) continue
      const offset = amount => s.origin.map((x, i) => x + amount * eigen.vector[i])
      for (const sign of [-1, 1]) {
        const points = [0.002, 0.04].map(r => compositeChart(offset(sign * r), params, s.chart).point)
          .filter(p => p.coords.every(Number.isFinite) && inside(p, view))
        if (points.length > 1) eigenDirections.push({ singularityId: s.id, points })
        if (s.type !== 'sela') continue
        const parts = traceCompositeOrbit(offset(sign * 1e-5), params, view, s.chart, s.row, Math.sign(eigen.value))
        separatrices.push(...parts.map((part, i) => ({ ...part, id: `${s.id}-${index}-${sign}-${i}`,
          singularityId: s.id, stability: eigen.value < 0 ? 'stable' : 'unstable' })))
      }
    }
  }
  return { singularities, separatrices, eigenDirections,
    unsupported: Math.abs(params.b1) < 1e-8 || Math.abs(params.b1 + 1) < 1e-8 || Math.abs(params.c) < 1e-8 }
}

// Add SOURCE leaves, then use the existing forward saturation/intersection.
// No translated curves or independently defined composite family is introduced.
export function compositeRefinementLeaves(singularities, existingLeaves, params, view, resolution) {
  const leaves = []
  const span = Math.max(1e-6, view.tMax - view.tMin)
  const visual = p => [p.t / span, physicalZToVisual(p.z)]
  const occupied = existingLeaves.flatMap(l => l.segments.flatMap(seg => seg.filter((_, i) => i % 4 === 0).map(visual)))
  for (const s of singularities) {
    let accepted = 0
    for (const angle of [0.4, 2, 3.5, 5.1]) {
      if (accepted >= 2) break
      const seed = [s.origin[0] + 0.025 * Math.cos(angle), s.origin[1] + 0.035 * Math.sin(angle)]
      const surface = compositeChart(seed, params, s.chart)
      if (!inside(surface.point, view)) continue
      const source = solveCharacteristicHugoniotIntersections({ uMinus: surface.state[0], vMinus: surface.state[1] }, params)
        .find(p => Math.abs(waveSpeed(p.t, p.z, params) - surface.speed) < 1e-7 * Math.max(1, Math.abs(surface.speed)))
      if (!source) continue
      const v = visual(source)
      if (occupied.some(p => Math.hypot(p[0] - v[0], p[1] - v[1]) < 0.007)) continue
      const segments = buildRarefactionSegmentsData({ fixedState: computeStateFromCharacteristicPoint(source.t, source.z, params),
        params, view, resolution, constrainZ: true, compactifiedZ: true, direction: FORWARD_HUGONIOT })
      if (!segments.length) continue
      leaves.push({ id: `R-K-refine-${leaves.length}`, seed: source, segments, singularityId: s.id })
      occupied.push(...segments.flatMap(seg => seg.filter((_, i) => i % 4 === 0).map(visual)))
      accepted++
    }
  }
  return leaves
}

// The global saturation mesh can miss small components around elliptic
// linearizations. Continue its tangent kernel locally, then certify every
// sample with the canonical characteristic lift and matching sonic speed.
export function compositeLocalComponents(singularities, params, view) {
  const components = []
  for (const s of singularities.filter(s => s.type === 'centro linear' || s.type === 'foco')) {
    if (!inside(s, view)) continue
    const span = s.chart === 'Y' ? view.yMax - view.yMin : view.tMax - view.tMin
    for (const [index, fraction] of [0.025, 0.05, 0.085, 0.125].entries()) {
      const radius = fraction * span
      const seed = [s.origin[0] + radius, s.origin[1]]
      const field = p => {
        const f = compositeField(p, params, s.chart, s.row)
        return f.map(v => v / Math.max(1, Math.hypot(...f)))
      }
      let previous = seed, angle = 0
      const limit = Math.max(2, 5 * radius)
      const orbit = integrateOrbit(field, seed, { uMin: s.origin[0] - limit, uMax: s.origin[0] + limit,
        vMin: s.origin[1] - 1, vMax: s.origin[1] + 1 }, 1, {
        maxTime: 500, maxPoints: 4000, maxAttempts: 20000, tolerance: 1e-10, chordTolerance: 2e-6,
        stopWhen: p => {
          const a = previous.map((x, k) => x - s.origin[k]), b = p.map((x, k) => x - s.origin[k])
          angle += Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1])
          previous = p
          return Math.abs(angle) >= 2 * Math.PI || !inside(compositeChart(p, params, s.chart).point, view)
        },
      })
      // First-return section, not an assumed nonlinear centre: only close
      // when the numerical return actually agrees with the initial point.
      if (Math.abs(angle) >= 2 * Math.PI && orbit.length > 2) {
        const a = orbit.at(-2), b = orbit.at(-1)
        const fraction = (seed[1] - a[1]) / (b[1] - a[1])
        const q = a[0] + fraction * (b[0] - a[0])
        if (fraction >= 0 && fraction <= 1) orbit[orbit.length - 1] = [q, seed[1]]
        if (Math.abs(q - seed[0]) < 2e-5 * Math.max(1, radius)) orbit[orbit.length - 1] = seed
      }
      let points = [], part = 0
      const push = () => {
        if (points.length > 2) components.push({ componentId: `${s.id}-local-${index}-${part++}`,
          singularityId: s.id, points, orientation: 'decrease', localContinuation: true })
        points = []
      }
      for (const coordinates of orbit) {
        const surface = compositeChart(coordinates, params, s.chart)
        const generatorPoint = solveCharacteristicHugoniotIntersections({ uMinus: surface.state[0], vMinus: surface.state[1] }, params)
          .find(p => Math.abs(waveSpeed(p.t, p.z, params) - surface.speed) < 1e-7 * Math.max(1, Math.abs(surface.speed)))
        if (!generatorPoint || !surface.point.coords.every(Number.isFinite) || !inside(surface.point, view)) { push(); continue }
        points.push({ ...surface.point, generatorPoint })
      }
      push()
    }
  }
  return components
}
