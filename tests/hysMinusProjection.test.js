import test from 'node:test'
import assert from 'node:assert/strict'
import { solveLeftHysteresisPoint, solveRightHysteresisPoint } from '../src/entities/surfaceImplicit/sonic.js'
import { projectPointMinus, projectPointPlus } from '../src/entities/geometry/stateProjections.js'

test('Hys-minus projections equal opposite Hys-plus projections across the extended domain', () => {
  for (const b2 of [-0.4, 0, 0.2]) {
    const params = { b1: 8, b2, c: 1 }
    for (const z of [-1000, -4, -0.7, 0, 0.6, 3, 1000]) {
      const left = solveLeftHysteresisPoint(z, params)
      const right = solveRightHysteresisPoint(z, params)
      assert.ok(left && right)
      const assertSameState = (actual, expected) => {
        const scale = Math.max(1, Math.abs(expected.u), Math.abs(expected.v))
        assert.ok(Math.hypot(actual.u - expected.u, actual.v - expected.v) < 1e-10 * scale)
      }
      assertSameState(projectPointMinus(left, params), projectPointPlus(right, params))
      assertSameState(projectPointPlus(left, params), projectPointMinus(right, params))
    }
  }
})
