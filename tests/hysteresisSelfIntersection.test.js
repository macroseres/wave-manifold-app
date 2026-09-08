import test from 'node:test'
import assert from 'node:assert/strict'
import { findHysteresisDoubleStates, buildHysteresisSelfIntersectionSegments } from '../src/geometry/hysteresisSelfIntersection.js'
import { defaultParams, defaultView } from '../src/config/viewDefaults.js'
import { computeLeftStateFromWavePoint, solveRightHysteresisPoint } from '../src/entities/surfaceImplicit/index.js'

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
