import test from 'node:test'
import assert from 'node:assert/strict'
import { compositeChart, compositeField, compositeLinearization, compositeSingularities } from '../src/entities/phasePortrait/compositeField.js'
import { buildCompositeSpecialElements, compositeRefinementLeaves, compositeLocalComponents } from '../src/entities/phasePortrait/compositeSpecialElements.js'
import { buildCompositePortrait, compositeMatchesGenerator } from '../src/entities/phasePortrait/compositePortrait.js'
import { buildGlobalRarefactionPortrait } from '../src/entities/phasePortrait/rarefactionPortrait.js'
import { defaultParams, defaultView, initialSchaefferShearerCasePresets } from '../src/components/panels/schaefferShearerConfig.js'
import { sonicLeftImplicitF } from '../src/entities/surfaceImplicit/sonic.js'
import { projectMinus } from '../src/entities/geometry/stateProjections.js'
import { waveSpeed } from '../src/entities/surfaceImplicit/state.js'

const relative = (a, b) => Math.abs(a - b) / Math.max(1, Math.abs(a), Math.abs(b))
test('case IV resolves small closed components around both previously empty critical points', () => {
  const singularities = compositeSingularities(defaultParams)
  const components = compositeLocalComponents(singularities, defaultParams, defaultView)
  for (const s of singularities.filter(s => s.type === 'centro linear')) {
    const local = components.filter(c => c.singularityId === s.id)
    assert.ok(local.length >= 3)
    assert.ok(local.slice(0, 2).every(c => Math.hypot(...c.points[0].coords.map((v, i) => v - c.points.at(-1).coords[i])) < 1e-4))
    for (const c of local) for (let i = 0; i < c.points.length; i++) {
      const p = c.points[i]
      assert.ok(compositeMatchesGenerator(p, defaultParams))
      assert.ok(Math.abs(sonicLeftImplicitF(p.Y, p.t, p.z, defaultParams)) / (1 + Math.abs(p.z)) ** 5 < 1e-9)
      const projected = projectMinus(p.t, p.Y, p.z, defaultParams)
      const generator = projectMinus(p.generatorPoint.t, 0, p.generatorPoint.z, defaultParams)
      assert.ok(Math.hypot(projected.u - generator.u, projected.v - generator.v) < 1e-8)
      if (!i) continue
      const a = c.points[i - 1], delta = [p.Y - a.Y, p.z - a.z]
      const f = compositeField([(a.Y + p.Y) / 2, (a.z + p.z) / 2], defaultParams, 'Y', s.row)
      if (Math.hypot(...delta) > 1e-9) assert.ok(Math.abs(delta[0] * f[1] - delta[1] * f[0]) / Math.hypot(...delta) / Math.hypot(...f) < 0.02)
    }
  }
})
test('composite charts agree with canonical S-, projection and speed, including both infinite charts', () => {
  for (const preset of Object.values(initialSchaefferShearerCasePresets)) {
    const params = { a: 0, c: 1, ...preset.params }
    for (const chart of ['t', 'Y', 'infinity', 'infinityY']) for (const z of [-0.37, 0.21, 0.82]) {
      const s = compositeChart([0.12, z], params, chart), p = s.point
      const projected = projectMinus(p.t, p.Y, p.z, params)
      assert.ok(Math.abs(sonicLeftImplicitF(p.Y, p.t, p.z, params)) / (1 + Math.abs(p.z)) ** 5 < 1e-10)
      assert.ok(relative(projected.u, s.state[0]) < 1e-11)
      assert.ok(relative(projected.v, s.state[1]) < 1e-11)
      assert.ok(relative(waveSpeed(p.t, p.z, params), s.speed) < 1e-11)
      for (let axis = 0; axis < 2; axis++) {
        const h = 1e-6, origin = [0.12, z]
        const plus = compositeChart(origin.map((x, i) => x + (i === axis ? h : 0)), params, chart)
        const minus = compositeChart(origin.map((x, i) => x - (i === axis ? h : 0)), params, chart)
        for (let k = 0; k < 2; k++) assert.ok(relative((plus.state[k] - minus.state[k]) / (2 * h), s.derivative[k][axis]) < 1e-6)
      }
    }
  }
})

test('critical points satisfy both pullback rows and have convergent linearizations in every case', () => {
  for (const preset of Object.values(initialSchaefferShearerCasePresets)) {
    const params = { a: 0, c: 1, ...preset.params }
    const points = compositeSingularities(params)
    assert.ok(points.length >= 4)
    assert.equal(points.filter(s => s.chart === 'infinity').length, 1)
    for (const s of points) {
      for (const row of [0, 1]) assert.ok(Math.hypot(...compositeField(s.origin, params, s.chart, row)) < 1e-7)
      const refined = compositeLinearization(s.origin, params, s.chart, s.row, 1e-5)
      s.matrix.flat().forEach((x, i) => assert.ok(relative(x, refined.flat()[i]) < 3e-5))
      for (const eigen of s.eigenDirections) {
        const residual = s.matrix.map((row, i) => row[0] * eigen.vector[0] + row[1] * eigen.vector[1] - eigen.value * eigen.vector[i])
        assert.ok(Math.hypot(...residual) < 1e-7)
      }
      if (s.type === 'centro linear' || s.type === 'foco') assert.equal(s.eigenDirections.length, 0)
    }
  }
  assert.deepEqual(compositeSingularities({ ...defaultParams, b1: -1 }), [])
})

test('the diagnostic field is tangent to the existing saturation/intersection composite, not a second foliation', () => {
  const leaves = buildGlobalRarefactionPortrait(defaultParams, defaultView, 20).slice(0, 2)
  const components = buildCompositePortrait(leaves, defaultParams, defaultView, 20)
  let checked = 0
  for (const c of components) for (let i = 1; i < c.points.length; i++) {
    const a = c.points[i - 1], b = c.points[i], dt = b.t - a.t, dz = b.z - a.z
    if (Math.abs(dz) > 0.02 || Math.hypot(dt, dz) < 1e-9) continue
    const f = compositeField([(a.t + b.t) / 2, (a.z + b.z) / 2], defaultParams)
    const error = Math.abs(dt * f[1] - dz * f[0]) / Math.hypot(dt, dz) / Math.hypot(...f)
    assert.ok(error < 0.01, `${error}`); checked++
  }
  assert.ok(checked > 30)
})

test('saddle branches lie on S-, follow the field and continue through coordinate changes', () => {
  const special = buildCompositeSpecialElements(defaultParams, defaultView)
  assert.ok(special.separatrices.length > 4)
  assert.ok(new Set(special.separatrices.map(c => c.chart)).size > 1)
  let checked = 0
  for (const curve of special.separatrices) {
    assert.equal(special.singularities.find(s => s.id === curve.singularityId).type, 'sela')
    for (const p of curve.points) assert.ok(Math.abs(sonicLeftImplicitF(p.Y, p.t, p.z, defaultParams)) / (1 + Math.abs(p.z)) ** 5 < 1e-8)
    for (let i = 1; i < curve.chartPoints.length; i++) {
      const a = curve.chartPoints[i - 1], b = curve.chartPoints[i]
      const delta = b.map((v, k) => v - a[k])
      const f = compositeField(a.map((v, k) => (v + b[k]) / 2), defaultParams, curve.chart, curve.row)
      if (Math.hypot(...f) < 1e-5 || Math.hypot(...delta) < 1e-9) continue
      assert.ok(Math.abs(delta[0] * f[1] - delta[1] * f[0]) / Math.hypot(...delta) / Math.hypot(...f) < 0.02)
      checked++
    }
  }
  assert.ok(checked > 100)
})

test('refinement adds source leaves and preserves canonical composite generator matching', () => {
  const leaves = buildGlobalRarefactionPortrait(defaultParams, defaultView, 20)
  const extra = compositeRefinementLeaves(compositeSingularities(defaultParams), leaves, defaultParams, defaultView, 20)
  assert.ok(extra.length > 0)
  assert.ok(extra.length <= 8)
  const components = buildCompositePortrait(extra, defaultParams, defaultView, 20)
  assert.ok(components.length > 0)
  for (const curve of components) {
    assert.ok(extra.some(l => l.id === curve.sourceRarefactionId))
    assert.ok(curve.points.every(p => compositeMatchesGenerator(p, defaultParams)))
  }
})
