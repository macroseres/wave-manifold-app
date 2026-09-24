import test from 'node:test'
import assert from 'node:assert/strict'
import { flux, fluxJacobian, viscousField, viscousSelection, realEigenDirections, selectedStatesPortrait } from '../src/entities/phasePortrait/flow.js'
import { integrateOrbit } from '../src/entities/numerics/integrateOrbit.js'
import { computeWavePointDiagnostics } from '../src/entities/shared/diagnostics/wavePointDiagnostics.js'
import { buildRarefactionPortrait, characteristicPortraitSeeds, orientedPortraitEdge } from '../src/entities/phasePortrait/rarefactionPortrait.js'
import { FORWARD_HUGONIOT } from '../src/entities/hugoniot/directions.js'
import { buildRarefactionSegmentsData } from '../src/entities/waves/rarefactionSegmentsData.js'
import { computeStateFromCharacteristicPoint } from '../src/entities/surfaceImplicit/state.js'
import { buildViscousPortrait, portraitSegmentDistance, retargetViscousPortrait } from '../src/entities/phasePortrait/viscousPortrait.js'
import { defaultParams, defaultView, parametersDefaultForCase } from '../src/components/panels/schaefferShearerConfig.js'
import { solveQuadraticRealRoots } from '../src/entities/numerics/index.js'

test('canonical wave coordinates satisfy RH and both viscous equilibria for varying parameters, including z=0', () => {
  for (const params of [defaultParams, { a: 2, b1: 3, b2: -1, c: 0.7 }]) {
    for (const z of [-3, 0, 0.2, 2]) for (const Y of [-1, 0, 0.7]) {
      const point = computeWavePointDiagnostics({ t: 0.2, Y, z }, params)
      const selection = viscousSelection(point, params)
      assert.ok(selection)
      const field = viscousField(selection.left, selection.speed, params)
      assert.ok(Math.hypot(...field(selection.left)) < 1e-10)
      assert.ok(Math.hypot(...field(selection.right)) < 1e-10)
      assert.equal(viscousSelection({ ...point, uPlus: point.uPlus + 10 }, params), null)
    }
  }
})

test('flux Jacobian matches numerical differentiation', () => {
  const state = [0.3, -0.7], h = 1e-5
  const matrix = fluxJacobian(state, defaultParams)
  for (let col = 0; col < 2; col++) {
    const plus = state.map((x, i) => x + (i === col ? h : 0))
    const minus = state.map((x, i) => x - (i === col ? h : 0))
    for (let row = 0; row < 2; row++) assert.ok(Math.abs((flux(plus, defaultParams)[row] - flux(minus, defaultParams)[row]) / (2 * h) - matrix[row][col]) < 1e-8)
  }
})

test('integration rejects a crossing edge before appending it, in both time directions', () => {
  const bounds = { uMin: -2, uMax: 2, vMin: -2, vMax: 2 }
  for (const direction of [-1, 1]) {
    const obstacle = [[direction * 0.015, -1], [direction * 0.015, 1]]
    const points = integrateOrbit(() => [1, 0], [0, 0], bounds, direction, {
      stopSegment: (a, b) => portraitSegmentDistance(a, b, ...obstacle) < 1e-5,
    })
    assert.ok(points.every(p => direction * p[0] < 0.015))
    assert.equal(points.length, 1)
  }
  assert.equal(portraitSegmentDistance([-1, 0], [1, 0], [0, -1], [0, 1]), 0)
  assert.equal(portraitSegmentDistance([-1, 0], [1, 0], [-1, 1], [1, 1]), 1)
})

test('eigendirections handle saddle, complex, repeated and zero eigenvalues', () => {
  assert.deepEqual(realEigenDirections([[2, 0], [0, -1]]).map(d => d.value), [-1, 2])
  assert.equal(realEigenDirections([[0, -1], [1, 0]]).length, 0)
  assert.equal(realEigenDirections([[1, 0], [0, 1]]).length, 0)
  assert.equal(realEigenDirections([[0, 0], [0, 2]]).length, 1)
})

test('adaptive orbits preserve a rotation invariant and terminate safely for explosive and nonfinite fields', () => {
  const bounds = { uMin: -2, uMax: 2, vMin: -2, vMax: 2 }
  const points = integrateOrbit(([u, v]) => [-v, u], [1, 0], bounds)
  assert.ok(points.length > 100)
  assert.ok(points.every(p => Math.abs(Math.hypot(...p) - 1) < 1e-5))
  for (const field of [([u, v]) => [u * u + 1, v * v + 1], () => [NaN, Infinity]]) {
    const orbit = integrateOrbit(field, [1, 1], bounds)
    assert.ok(orbit.length <= 1200)
    assert.ok(orbit.flat().every(Number.isFinite))
  }
  const backward = integrateOrbit(() => [1, 0], [0, 0], bounds, -1)
  assert.ok(backward[0][0] < backward.at(-1)[0])
  const stopped = integrateOrbit(() => [1, 0], [0, 0], bounds, 1, { stopWhen: ([u]) => u >= 0.5 })
  assert.ok(stopped.at(-1)[0] >= 0.5 && stopped.at(-1)[0] < 0.61)
  assert.ok(stopped.length < backward.length)
})

test('surface portrait needs no selected point and reuses oriented leaves on both characteristic halves', () => {
  const seeds = characteristicPortraitSeeds(defaultView, defaultParams)
  const point = seeds[0]
  const curves = buildRarefactionPortrait(defaultParams, defaultView)
  assert.ok(curves.length >= 24)
  const expected = buildRarefactionSegmentsData({ fixedState: computeStateFromCharacteristicPoint(point.t, point.z, defaultParams), params: defaultParams, view: defaultView, constrainZ: true, compactifiedZ: true, direction: FORWARD_HUGONIOT })
  const originalPoints = new Set(expected.flat())
  const originalCoords = new Set([...originalPoints].map(p => `${p.t},${p.z}`))
  assert.ok(curves[0].segments.flat().filter(p => originalCoords.has(`${p.t},${p.z}`)).length > 10)
  assert.ok(curves.every(c => c.segments.length && c.segments.flat().every(p => p.Y === 0)))
  assert.equal(new Set(seeds.map(p => `${p.t},${p.z}`)).size, seeds.length)
  assert.equal(seeds.filter(p => p.branch === 'slow').length, seeds.filter(p => p.branch === 'fast').length)
  assert.ok(curves.every(c => c.segments.flat().every(p => p.t >= defaultView.tMin - 1e-10 && p.t <= defaultView.tMax + 1e-10
    && (c.branch === 'slow' ? p.t >= -1e-10 : p.t <= 1e-10))))
  assert.ok(characteristicPortraitSeeds({ ...defaultView, tMin: 1, tMax: 2 }).every(p => p.t > 1 && p.t < 2 && p.branch === 'slow'))
  assert.deepEqual(buildRarefactionPortrait(defaultParams, { ...defaultView, tMin: 2, tMax: 1 }), [])
})

test('case III portraits seed and draw both families beyond every singular chart boundary', () => {
  for (const key of ['iiia', 'iiib', 'iiic']) {
    const params = parametersDefaultForCase(key)
    const seeds = characteristicPortraitSeeds(defaultView, params)
    const curves = buildRarefactionPortrait(params, defaultView)
    const roots = [...solveQuadraticRealRoots(-1, params.b2, 1),
      ...solveQuadraticRealRoots(params.b1 - 1, params.b2, 1)].sort((a, b) => a - b)
    const boundaries = [-Infinity, ...roots, Infinity]
    for (let i = 0; i < boundaries.length - 1; i++) {
      for (const branch of ['slow', 'fast']) {
        const index = seeds.findIndex(p => p.branch === branch && p.z > boundaries[i] && p.z < boundaries[i + 1])
        assert.ok(index >= 0, `${key}: missing ${branch} region ${i}`)
        assert.ok(curves.some(curve => curve.branch === branch && curve.segments.some(segment => segment.length > 1 && segment.some(p =>
          p.z > boundaries[i] && p.z < boundaries[i + 1] && p.Y === 0))))
      }
    }
  }
})

test('portrait arrows obey local canonical speed direction regardless of polyline order', () => {
  for (const key of ['iv', 'iiia', 'iiib', 'iiic']) {
    const params = parametersDefaultForCase(key)
    const curves = buildRarefactionPortrait(params, defaultView)
    let checked = 0
    for (const curve of curves) for (const segment of curve.segments) {
      for (let i = 1; i < segment.length; i += 15) {
        const edge = orientedPortraitEdge(segment[i - 1], segment[i], curve.branch, params)
        if (!edge) continue
        const speeds = edge.map(p => computeWavePointDiagnostics(p, params).s)
        assert.ok(curve.branch === 'slow' ? speeds[1] > speeds[0] : speeds[1] < speeds[0])
        assert.deepEqual(orientedPortraitEdge(segment[i], segment[i - 1], curve.branch, params), edge)
        checked++
      }
    }
    assert.ok(checked > 20)
  }
})

test('state portrait requires both selected states and uses UL speed even when UR is not equilibrium', () => {
  const left = computeStateFromCharacteristicPoint(0.2, 0.3, defaultParams)
  const right = computeStateFromCharacteristicPoint(-0.15, -0.4, defaultParams)
  const entries = [{ branch: 'slow', selectedState: left }, { branch: 'fast', selectedState: right }]
  assert.equal(selectedStatesPortrait([], defaultParams), null)
  assert.equal(selectedStatesPortrait(entries.slice(0, 1), defaultParams), null)
  const selected = selectedStatesPortrait(entries, defaultParams)
  assert.deepEqual(selected.left, [left.uMinus, left.vMinus])
  assert.deepEqual(selected.right, [right.uMinus, right.vMinus])
  assert.equal(selected.speed, computeWavePointDiagnostics(left, defaultParams).s)
  assert.equal(selected.rightIsEquilibrium, false)
  const portrait = buildViscousPortrait(selected, defaultParams, { uMin: -4, uMax: 4, vMin: -4, vMax: 4 })
  assert.ok(portrait.curves.length > 0)
  assert.ok(portrait.curves.every(c => c.kind !== 'connection'))
  assert.equal(selectedStatesPortrait([entries[0], { branch: 'fast', selectedState: left }], defaultParams).rightIsEquilibrium, true)
})

test('viscous portrait does not join arbitrary RH equilibria or degenerate states artificially', () => {
  const selection = viscousSelection(computeWavePointDiagnostics({ t: 0.1, Y: 0, z: 0.3 }, defaultParams), defaultParams)
  const portrait = buildViscousPortrait(selection, defaultParams, { uMin: -2, uMax: 2, vMin: -2, vMax: 2 })
  assert.ok(portrait.curves.length > 0)
  assert.ok(portrait.curves.every(c => c.kind !== 'connection'))
  assert.equal(buildViscousPortrait(null, defaultParams, {}), null)
})

test('a known heteroclinic orbit is detected only in the forward direction', () => {
  // On v=0 this is u′=u²−1, with the exact connection u=−tanh(ξ).
  const params = { a: 0, b1: 1, b2: 0, c: 0 }
  const bounds = { uMin: -2, uMax: 2, vMin: -2, vMax: 2 }
  const forward = buildViscousPortrait({ left: [1, 0], right: [-1, 0], speed: 0 }, params, bounds)
  const connections = forward.curves.filter(c => c.kind === 'connection')
  assert.equal(connections.length, 1)
  assert.ok(connections[0].points.every(p => Math.abs(p[1]) < 1e-12))
  // No streamline may end in empty space just because another is nearby.
  // In this example trajectories end at an equilibrium or the view boundary.
  for (const curve of forward.curves) for (const p of [curve.points[0], curve.points.at(-1)]) {
    const nearEquilibrium = forward.equilibriumPoints.some(eq => Math.hypot(p[0] - eq[0], p[1] - eq[1]) < 0.002)
    const nearBoundary = Math.min(p[0] - bounds.uMin, bounds.uMax - p[0], p[1] - bounds.vMin, bounds.vMax - p[1]) < 0.101
    assert.ok(nearEquilibrium || nearBoundary, `premature endpoint: ${p}`)
  }
  const reverse = buildViscousPortrait({ left: [-1, 0], right: [1, 0], speed: 0 }, params, bounds)
  assert.ok(reverse.curves.every(c => c.kind !== 'connection'))
  const base = buildViscousPortrait({ left: [1, 0], right: [1, 0], speed: 0, rightIsEquilibrium: false }, params, bounds)
  const retargeted = retargetViscousPortrait(base, { left: [1, 0], right: [-1, 0], speed: 0, rightIsEquilibrium: true }, { connectionOnly: true }, bounds)
  assert.equal(retargeted.curves.filter(c => c.kind === 'connection').length, 1)
  assert.ok(retargeted.curves.every((c, i) => c.points === base.curves[i].points))
  const moved = retargetViscousPortrait(base, { left: [1, 0], right: [0, 1], speed: 0, rightIsEquilibrium: false }, {}, bounds)
  assert.ok(moved.curves.every(c => c.kind !== 'connection'))
  assert.ok(base.curves.every(c => c.kind !== 'connection'))
})
