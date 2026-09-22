import test from 'node:test'
import assert from 'node:assert/strict'
import { saturatedHysteresisImplicit } from '../src/geometry/saturatedSurfaceGeometry.js'
import { generateSurfaceBuffers } from '../src/geometry/surfaceGeneration.js'
import { solveRightHysteresisPoint, computeRightStateFromWavePoint, solveBackwardHugoniotPointForFixedRightState } from '../src/entities/surfaceImplicit/index.js'
import { defaultParams, defaultView } from '../src/config/viewDefaults.js'

test('Hys plus crosses zero without a false pole or an unstable seed', () => {
  for (const params of [defaultParams, { b1: 3, b2: 0, c: 2 }, { b1: 5, b2: -.4, c: .7 }]) {
    const { b1, b2, c } = params
    const denominator = 2 + b2 * b2 * (b1 + 1)
    const expectedT = -c * b2 * (b1 + 1) / (b1 * denominator)
    const expectedY = -4 * c / denominator
    const zero = solveRightHysteresisPoint(0, params)
    assert.ok(zero)
    for (const z of [-1e-10, -Number.EPSILON, 0, Number.EPSILON, 1e-10]) {
      const point = solveRightHysteresisPoint(z, params)
      assert.ok(point)
      assert.ok(Math.abs(point.t - expectedT) < 1e-8)
      assert.ok(Math.abs(point.Y - expectedY) < 1e-8)
      // The sheet builder discards rows whose determinants change sign.
      assert.ok(point.det * zero.det > 0)
    }
  }
})

test('sat plus Hys plus preserves the right state along each leaf and contains Hys plus', () => {
  for (const params of [defaultParams, { b1: 3, b2: 0, c: 2 }, { b1: 5, b2: -.4, c: .7 }]) {
    for (const seed of [-12, -1, -.3, 0, .4, 1, 12]) {
      const h = solveRightHysteresisPoint(seed, params)
      const state = computeRightStateFromWavePoint(h.t, h.Y, seed, params)
      for (const z of [-20, -.5, seed, 0, .5, 20]) {
        const point = solveBackwardHugoniotPointForFixedRightState(z, state, params)
        const projected = computeRightStateFromWavePoint(point.t, point.Y, z, params)
        assert.ok(Math.hypot(projected.uPlus - state.uPlus, projected.vPlus - state.vPlus) < 1e-8)
        const value = saturatedHysteresisImplicit(point.Y, point.t, z, params, 'plus')
        const nearby = saturatedHysteresisImplicit(point.Y + .01, point.t + .01, z, params, 'plus')
        assert.ok(Math.abs(value) / (1 + Math.abs(nearby)) < 1e-7)
        if (z === seed) assert.ok(Math.hypot(point.t - h.t, point.Y - h.Y) < 1e-8)
      }
    }
  }
})

test('worker generates the plus saturation within the box across compactified z', () => {
  const data = generateSurfaceBuffers({ type: 'saturated', params: defaultParams, view: defaultView, resolution: 40, direction: 'plus' }).surface
  assert.ok(data.index.length > 0)
  let min = Infinity, max = -Infinity
  for (let i = 0; i < data.position.length; i += 3) {
    const t = data.position[i], Y = data.position[i + 1], zHat = data.position[i + 2]
    assert.ok([t, Y, zHat].every(Number.isFinite))
    assert.ok(t >= defaultView.tMin - 1e-6 && t <= defaultView.tMax + 1e-6)
    assert.ok(Y >= defaultView.yMin - 1e-6 && Y <= defaultView.yMax + 1e-6)
    min = Math.min(min, zHat); max = Math.max(max, zHat)
  }
  assert.ok(min < -.99 && max > .99)
})
