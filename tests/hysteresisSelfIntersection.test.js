import test from 'node:test'
import assert from 'node:assert/strict'
import { findHysteresisDoubleStates, buildHysteresisSelfIntersectionSegments } from '../src/geometry/hysteresisSelfIntersection.js'
import { defaultParams, defaultView } from '../src/config/viewDefaults.js'
import { computeLeftStateFromWavePoint, computeRightStateFromWavePoint, solveRightHysteresisPoint, solveLeftHysteresisPoint } from '../src/entities/surfaceImplicit/index.js'

test('left hysteresis saturation does not reuse the right hysteresis double leaf', () => {
  for (const params of [defaultParams, { ...defaultParams, b2: 0, c: 2 }]) {
    assert.deepEqual(findHysteresisDoubleStates(params, 'left'), [])
    assert.deepEqual(buildHysteresisSelfIntersectionSegments(params, defaultView, 'left'), [])
    assert.equal(findHysteresisDoubleStates(params, 'right').length, 1)
  }
})

test('self intersection comes from distinct hysteresis seeds with the same left state', () => {
  for (const params of [defaultParams, { ...defaultParams, b2: 0, c: 2 }]) {
    const states = findHysteresisDoubleStates(params)
    assert.equal(states.length, 1)
    const state = states[0]
    assert.ok(Math.abs(state.seeds[0] - state.seeds[1]) > .1)
    for (const seed of state.seeds) {
      const point = solveRightHysteresisPoint(seed, params)
      const projected = computeLeftStateFromWavePoint(point.t, point.Y, point.z, params)
      assert.ok(Math.hypot(projected.uMinus - state.uMinus, projected.vMinus - state.vMinus) < 1e-8)
    }
    const segments = buildHysteresisSelfIntersectionSegments(params, defaultView)
    assert.ok(segments.length > 0)
    for (const segment of segments) for (const [t, Y, z] of segment) {
      const projected = computeLeftStateFromWavePoint(t, Y, z, params)
      assert.ok(Math.hypot(projected.uMinus - state.uMinus, projected.vMinus - state.vMinus) < 1e-7)
    }
  }
})


test('sat plus Hys minus double curve preserves the right state and reflects sat minus Hys plus', () => {
  for (const params of [defaultParams, { ...defaultParams, b2: 0, c: 2 }, { b1: 5, b2: -.4, c: .7 }]) {
    const states = findHysteresisDoubleStates(params, 'left', 'plus')
    assert.equal(states.length, 1)
    const state = states[0]
    assert.ok(Math.abs(state.seeds[0] - state.seeds[1]) > .1)
    for (const seed of state.seeds) {
      const point = solveLeftHysteresisPoint(seed, params)
      const projected = computeRightStateFromWavePoint(point.t, point.Y, point.z, params)
      assert.ok(Math.hypot(projected.uPlus - state.uPlus, projected.vPlus - state.vPlus) < 1e-8)
    }
    const segments = buildHysteresisSelfIntersectionSegments(params, defaultView, 'left', 'plus')
    assert.ok(segments.length > 0)
    const oppositeState = findHysteresisDoubleStates(params)[0]
    for (const segment of segments) for (const [t, Y, z] of segment) {
      assert.ok([t, Y, z].every(Number.isFinite))
      const projected = computeRightStateFromWavePoint(t, Y, z, params)
      assert.ok(Math.hypot(projected.uPlus - state.uPlus, projected.vPlus - state.vPlus) < 1e-7)
      const reflected = computeLeftStateFromWavePoint(t, -Y, z, params)
      assert.ok(Math.hypot(reflected.uMinus - oppositeState.uMinus, reflected.vMinus - oppositeState.vMinus) < 1e-7)
    }
  }
})
