import { viscousJacobian, realEigenDirections } from './flow.js'
import { solveQuadraticRealRoots, dedupeSortedNumbers } from '../numerics/index.js'

// First-order jets give D(pi_-) on S- without differencing near a chart pole.
const jet = x => Array.isArray(x) ? x : [x, 0, 0]
const add = (a, b) => jet(a).map((x, i) => x + jet(b)[i])
const neg = a => jet(a).map(x => -x)
const sub = (a, b) => add(a, neg(b))
const mul = (a, b) => {
  a = jet(a); b = jet(b)
  return [a[0] * b[0], a[1] * b[0] + a[0] * b[1], a[2] * b[0] + a[0] * b[2]]
}
const div = (a, b) => {
  a = jet(a); b = jet(b)
  return [a[0] / b[0], (a[1] * b[0] - a[0] * b[1]) / b[0] ** 2,
    (a[2] * b[0] - a[0] * b[2]) / b[0] ** 2]
}

export function compositeChart([q, coordinate], params, chart = 't') {
  const { b1: b, b2: d, c, a = 0 } = params
  const z = [coordinate, 0, 1], variable = [q, 1, 0]
  const z2 = mul(z, z), denominator = add(1, z2)
  let t, Y, u, v, speed
  if (chart.startsWith('infinity')) {
    // Z=1/z, T=-z²t, X=zY. This chart includes the identified infinite end.
    const Q = add(add(-(b + 1), mul(d * (b + 1), z)), z2)
    const D = sub(add(b + 1, mul(3, z2)), mul(d, mul(z2, z)))
    const P = add(add(b - 1, mul(d, z)), z2)
    const tc = mul(2 * b, mul(denominator, D)), yc = mul(denominator, Q), constant = mul(2 * c, mul(z, P))
    const T = chart === 'infinityY' ? div(sub(mul(yc, variable), constant), tc) : variable
    const X = chart === 'infinityY' ? variable : div(add(mul(tc, T), constant), yc)
    t = neg(mul(T, z2)); Y = mul(X, z)
    u = sub(add(div(mul(c, add(mul(2, z), d)), mul(b, denominator)), mul(sub(sub(1, mul(d, z)), z2), T)), mul(0.5, X))
    v = sub(add(div(-c, denominator), mul(b, mul(z, T))), mul(0.5, mul(X, z)))
    speed = sub(add(a, div(mul(c, add(mul(b + 2, z), d * (b + 1))), mul(b, denominator))), mul(Q, T))
  } else {
    const Q = sub(add(1, mul(d * (b + 1), z)), mul(b + 1, z2))
    const P = add(add(1, mul(d, z)), mul(b - 1, z2))
    const B = sub(add(mul(b + 1, mul(z2, z)), mul(3, z)), d)
    const tc = mul(-2 * b, mul(denominator, B)), yc = mul(denominator, Q), constant = mul(2 * c, P)
    t = chart === 't' ? variable : div(sub(mul(yc, variable), constant), tc)
    Y = chart === 'Y' ? variable : div(add(mul(tc, variable), constant), yc)
    u = sub(add(div(mul(c, mul(z, add(2, mul(d, z)))), mul(b, denominator)), mul(sub(add(1, mul(d, z)), z2), t)), mul(0.5, mul(z, Y)))
    v = sub(sub(div(mul(-c, z2), denominator), mul(b, mul(z, t))), mul(0.5, Y))
    speed = add(add(a, div(mul(c, mul(z, add(b + 2, mul(d * (b + 1), z)))), mul(b, denominator))), mul(Q, t))
  }
  const physicalZ = chart.startsWith('infinity') ? 1 / coordinate : coordinate
  return { state: [u[0], v[0]], derivative: [[u[1], u[2]], [v[1], v[2]]], speed: speed[0],
    point: { t: t[0], Y: Y[0], z: physicalZ, coords: [t[0], Y[0], physicalZ] } }
}

export function compositeField(point, params, chart = 't', row = 0) {
  const surface = compositeChart(point, params, chart)
  const m = viscousJacobian(surface.state, surface.speed, params)[row]
  const d = surface.derivative
  // ker((DF(pi_-)-sI) Dpi_-), oriented in this local regularization.
  return [-(m[0] * d[0][1] + m[1] * d[1][1]), m[0] * d[0][0] + m[1] * d[1][0]]
}

export function compositeLinearization(origin, params, chart, row, step = 2e-5) {
  const columns = origin.map((x, axis) => {
    const h = step * Math.max(1, Math.abs(x))
    const plus = origin.map((v, i) => v + (i === axis ? h : 0))
    const minus = origin.map((v, i) => v - (i === axis ? h : 0))
    const f = compositeField(plus, params, chart, row), g = compositeField(minus, params, chart, row)
    return f.map((v, i) => (v - g[i]) / (2 * h))
  })
  return [[columns[0][0], columns[1][0]], [columns[0][1], columns[1][1]]]
}

function diagnose(origin, params, chart, id) {
  const surface = compositeChart(origin, params, chart)
  const m = viscousJacobian(surface.state, surface.speed, params)
  const row = Math.hypot(...m[0]) >= Math.hypot(...m[1]) ? 0 : 1
  if (!surface.state.every(Number.isFinite) || Math.hypot(...m[row]) < 1e-9) return null
  const scale = Math.max(1, Math.hypot(...m[row]) * Math.hypot(...surface.derivative.flat()))
  if ([0, 1].some(r => Math.hypot(...compositeField(origin, params, chart, r)) > 1e-8 * scale)) return null
  const matrix = compositeLinearization(origin, params, chart, row)
  if (!matrix.flat().every(Number.isFinite)) return null
  const [[a, b], [c, d]] = matrix, determinant = a * d - b * c, trace = a + d
  const discriminant = trace * trace - 4 * determinant
  const tolerance = 1e-7 * Math.max(1, ...matrix.flat().map(Math.abs)) ** 2
  const type = determinant < -tolerance ? 'sela' : Math.abs(determinant) <= tolerance ? 'degenerada'
    : discriminant < -tolerance ? Math.abs(trace) < 1e-7 ? 'centro linear' : 'foco' : 'nó'
  const eigenvalues = discriminant >= 0 ? [(trace - Math.sqrt(discriminant)) / 2, (trace + Math.sqrt(discriminant)) / 2] : [trace / 2]
  return { ...surface.point, id, origin, chart, row, matrix, type, eigenvalues,
    imaginaryPart: discriminant < 0 ? Math.sqrt(-discriminant) / 2 : 0,
    eigenDirections: realEigenDirections(matrix) }
}

export function compositeSingularities(params) {
  const { b1: b, b2: d, c } = params
  if (Math.abs(b) < 1e-8 || Math.abs(c) < 1e-8 || Math.abs(b + 1) < 1e-8) return []
  // Resultant of the two pullback coefficients: (2z-d) P Q R, after
  // discarding non-real factors and chart denominators. Every candidate is
  // verified in BOTH matrix rows, in a regular surface chart.
  const candidates = dedupeSortedNumbers([d / 2,
    ...solveQuadraticRealRoots(b - 1, d, 1),
    ...solveQuadraticRealRoots(-(b + 1), d * (b + 1), 1),
    ...solveQuadraticRealRoots((b + 1) ** 2, -(b + 1) * d, b - 1)])
  const points = []
  for (const z of candidates) {
    const Q = 1 + d * (b + 1) * z - (b + 1) * z * z
    const B = (b + 1) * z ** 3 - d + 3 * z
    const chart = Math.abs(Q) >= Math.abs(2 * b * B) ? 't' : 'Y'
    if (Math.max(Math.abs(Q), Math.abs(2 * b * B)) < 1e-8) continue
    for (const row of [0, 1]) {
      const f0 = compositeField([0, z], params, chart, row)
      const f1 = compositeField([1, z], params, chart, row)
      const fm = compositeField([-1, z], params, chart, row)
      const slope = (f1[1] - fm[1]) / 2
      const values = Math.abs(slope) > 1e-10 ? [-f0[1] / slope]
        : solveQuadraticRealRoots((f1[0] + fm[0]) / 2 - f0[0], (f1[0] - fm[0]) / 2, f0[0])
      for (const q of values) {
        const point = diagnose([q, z], params, chart, `K-critical-${points.length}`)
        if (point && !points.some(p => Math.hypot(p.t - point.t, p.Y - point.Y, p.z - z) < 1e-6)) points.push(point)
      }
    }
  }
  const infinity = diagnose([0, 0], params, 'infinity', 'K-critical-infinity')
  if (infinity) points.push({ ...infinity, visualPositions: [[0, 0, -1], [0, 0, 1]] })
  return points
}
