import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGlobalRarefactionPortrait, splitAtCoincidence } from '../src/entities/phasePortrait/rarefactionPortrait.js'
import { buildCompositePortrait, orientedCompositeEdge, compositeMatchesGenerator, splitCompositeByGeneratorFamily } from '../src/entities/phasePortrait/compositePortrait.js'
import { defaultParams, defaultView } from '../src/components/panels/schaefferShearerConfig.js'
import { sonicLeftImplicitF } from '../src/entities/surfaceImplicit/sonic.js'
import { projectMinus } from '../src/entities/geometry/stateProjections.js'
import { waveSpeed } from '../src/entities/surfaceImplicit/state.js'
import { rarefactionDerivativeDtDz } from '../src/entities/surfaceImplicit/state.js'
import { extractGlobalCompositeLevelSet } from '../src/entities/composite/bifoliation/marchingSquares.js'
import { makeRarefactionParam, findRarefactionSonicAnchors } from '../src/entities/composite/bifoliation/parametrization.js'
import { buildCompositeSegmentsFromRarefaction } from '../src/entities/composite/bifoliation/core.js'
import { FORWARD_HUGONIOT } from '../src/entities/hugoniot/directions.js'

test('global leaves retain their identity through coincidence; visual splitting does not mutate data', () => {
  const leaves = buildGlobalRarefactionPortrait(defaultParams, defaultView, 20)
  assert.ok(leaves.length > 10)
  const crossing = leaves.find(l => l.displayParts.some(p => p.branch === 'slow') && l.displayParts.some(p => p.branch === 'fast'))
  assert.ok(crossing)
  const before = JSON.stringify(crossing.segments)
  splitAtCoincidence(crossing.segments)
  assert.equal(JSON.stringify(crossing.segments), before)
})

test('each global rarefaction has regular edges tangent to the canonical dt/dz field', () => {
  for (const leaf of buildGlobalRarefactionPortrait(defaultParams, defaultView, 20)) {
    let checked = 0
    for (const segment of leaf.segments) for (let i = 1; i < segment.length; i++) {
      const a = segment[i - 1], b = segment[i], dz = b.z - a.z, dt = b.t - a.t
      if (Math.abs(dz) > 0.02 || Math.abs(dz) < 1e-8) continue
      const slope = rarefactionDerivativeDtDz((a.z + b.z) / 2, (a.t + b.t) / 2, defaultParams)
      if (!Number.isFinite(slope)) continue
      const angularError = Math.abs(dt - slope * dz) / (Math.hypot(dt, dz) * Math.hypot(slope, 1))
      assert.ok(angularError < 0.03, `tangency error ${angularError}`)
      checked++
    }
    assert.ok(checked > 0)
  }
})

test('global level extraction preserves disconnected components without an inflection anchor', () => {
  const level = { compactifiedZ: true, evalAt: (u, w) => {
    const f = ((u - 0.25) ** 2 + (w - 0.5) ** 2 - 0.01) * ((u - 0.75) ** 2 + (w - 0.5) ** 2 - 0.01)
    return { value: f, point: { t: u, Y: 0, z: w, coords: [u, 0, w] } }
  } }
  const components = extractGlobalCompositeLevelSet(level, defaultView, null, { globalPortrait: true, uSamples: 80, wSamples: 80 })
  assert.equal(components.length, 2)
  for (const component of components) {
    assert.ok(component.every(p => p.t < 0.5) || component.every(p => p.t > 0.5))
    for (let i = 1; i < component.length; i++) assert.ok(Math.hypot(component[i].t - component[i - 1].t, component[i].z - component[i - 1].z) < 0.04)
  }
})

test('all computed K points lie on S-minus and the forward saturation of their source leaf', () => {
  const leaves = buildGlobalRarefactionPortrait(defaultParams, defaultView, 20).slice(0, 2)
  const components = buildCompositePortrait(leaves, defaultParams, defaultView, 20)
  assert.ok(components.length > 0)
  assert.equal(new Set(components.map(c => c.componentId)).size, components.length)
  let arrows = 0
  for (const component of components) {
    assert.ok(leaves.some(l => l.id === component.sourceRarefactionId))
    for (const p of component.points) {
      assert.ok(compositeMatchesGenerator(p, defaultParams))
      const f = sonicLeftImplicitF(p.Y, p.t, p.z, defaultParams) / (1 + p.z * p.z) ** 2.5
      assert.ok(Math.abs(f) < 1e-7, `sonic residual ${f}`)
      assert.ok(p.compositeU >= 0 && p.compositeU <= 1)
      const state = projectMinus(p.t, p.Y, p.z, defaultParams)
      const generator = projectMinus(p.generatorPoint.t, 0, p.generatorPoint.z, defaultParams)
      const scale = Math.max(1, Math.abs(generator.u), Math.abs(generator.v))
      assert.ok(Math.hypot(state.u - generator.u, state.v - generator.v) / scale < 1e-8)
    }
    for (let i = 1; i < component.points.length; i++) {
      const edge = orientedCompositeEdge(component.points[i - 1], component.points[i], defaultParams)
      if (!edge) continue
      assert.ok(waveSpeed(edge[1].t, edge[1].z, defaultParams) < waveSpeed(edge[0].t, edge[0].z, defaultParams))
      assert.deepEqual(orientedCompositeEdge(component.points[i], component.points[i - 1], defaultParams), edge)
      arrows++
    }
  }
  assert.ok(arrows > 0)
})

test('the extraneous sonic eigenvalue sheet is excluded instead of appearing as a transverse foliation', () => {
  const leaves = buildGlobalRarefactionPortrait(defaultParams, defaultView, 20)
  const leaf = leaves.find(l => l.segments.every(s => !findRarefactionSonicAnchors(
    makeRarefactionParam(s, defaultView), defaultParams, 'left', l.seed, defaultView).length))
  assert.ok(leaf)
  const view = { ...defaultView, compactifiedZ: true }
  const raw = buildCompositeSegmentsFromRarefaction(leaf.segments[0], defaultParams, view, view,
    'all', FORWARD_HUGONIOT, 'left', leaf.seed, { globalPortrait: true, uSamples: 40, wSamples: 60 })
  assert.ok(raw.segments.length > 0)
  assert.ok(raw.segments.flat().some(p => !compositeMatchesGenerator(p, defaultParams)))
  assert.ok(buildCompositePortrait([leaf], defaultParams, defaultView, 20)
    .every(c => c.points.every(p => compositeMatchesGenerator(p, defaultParams))))
})

test('family filtering never bridges an excluded portion of a component', () => {
  const generatorPoint = { t: 0.2, z: 0.3 }
  const good = { ...generatorPoint, generatorPoint }
  const other = { t: 20, z: 0.3, generatorPoint }
  assert.deepEqual(splitCompositeByGeneratorFamily([good, good, other, good, good], defaultParams), [[good, good], [good, good]])
})
