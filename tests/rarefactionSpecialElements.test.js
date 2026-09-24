import test from 'node:test'
import assert from 'node:assert/strict'
import { rarefactionRegularizedField, rarefactionInfinityField } from '../src/entities/surfaceImplicit/state.js'
import { rarefactionSingularities, rarefactionInfinitySingularity } from '../src/entities/phasePortrait/rarefactionSingularities.js'
import { buildRarefactionSpecialElements } from '../src/entities/phasePortrait/rarefactionSpecialElements.js'
import { defaultView } from '../src/components/panels/schaefferShearerConfig.js'

const params = { a: 0, b1: 4, b2: 4, c: 1 }
test('finite and infinity Jacobians and eigendirections are those of the same rarefaction foliation', () => {
  for (const p of [...rarefactionSingularities(params), rarefactionInfinitySingularity(params)]) {
    const infinity = p.chart === '(T,Z)'
    const f = x => (infinity ? rarefactionInfinityField : rarefactionRegularizedField)(x, params)
    const origin = [0, infinity ? 0 : p.z], h = 1e-6
    assert.ok(Math.hypot(...f(origin)) < 1e-12)
    for (let j = 0; j < 2; j++) {
      const a = f(origin.map((x, i) => x + (i === j ? h : 0)))
      const b = f(origin.map((x, i) => x - (i === j ? h : 0)))
      for (let i = 0; i < 2; i++) assert.ok(Math.abs((a[i] - b[i]) / (2 * h) - p.matrix[i][j]) < 1e-6)
    }
    for (const { value, vector } of p.eigenDirections) {
      assert.ok(Math.hypot(...p.matrix.map((row, i) => row.reduce((s, x, j) => s + x * vector[j], 0) - value * vector[i])) < 1e-8)
    }
  }
})

test('infinity extension uses T=-z²τ and agrees with the pushed-forward finite field', () => {
  for (const x of [-1, -0.1, 0.05, 0.8]) for (const T of [-0.7, 0, 0.3]) {
    const t = -T * x * x, z = 1 / x
    const [ft, fz] = rarefactionRegularizedField([t, z], params)
    const transformed = [-ft / x - 2 * t * fz, -(x ** 3) * fz]
    const actual = rarefactionInfinityField([T, x], params)
    assert.ok(Math.hypot(...actual.map((v, i) => v - transformed[i])) < 1e-10)
  }
})

test('separatrices follow the same field with chart-time orientation; A roots are not dynamic singularities', () => {
  const data = buildRarefactionSpecialElements([], params, defaultView)
  assert.ok(data.separatrices.some(s => s.chart === '(T,Z)'))
  assert.ok(data.separatrices.some(s => s.chart === '(τ,z)'))
  for (const curve of data.separatrices) {
    const f = p => (curve.chart === '(T,Z)' ? rarefactionInfinityField : rarefactionRegularizedField)(p, params)
    for (let i = 1; i < curve.chartPoints.length; i++) {
      const a = curve.chartPoints[i - 1], b = curve.chartPoints[i]
      const v = f(a.map((x, j) => (x + b[j]) / 2)), d = b.map((x, j) => x - a[j])
      const norm = Math.hypot(...d) * Math.hypot(...v)
      if (norm < 1e-18) continue
      assert.ok(d[0] * v[0] + d[1] * v[1] > 0)
      assert.ok(Math.abs(d[0] * v[1] - d[1] * v[0]) / norm < 0.003)
    }
  }
  for (const z of [(params.b2 + Math.sqrt(params.b2 ** 2 + 4)) / 2, (params.b2 - Math.sqrt(params.b2 ** 2 + 4)) / 2]) {
    assert.ok(Math.hypot(...rarefactionRegularizedField([0, z], params)) > 1e-5)
    assert.ok(data.singularities.every(s => Math.abs(s.z - z) > 1e-5))
  }
})
