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
      const coordinates = ({ u, v }) => ({ u, v })
      assert.deepEqual(coordinates(projectPointMinus(left, params)), coordinates(projectPointPlus(right, params)))
      assert.deepEqual(coordinates(projectPointPlus(left, params)), coordinates(projectPointMinus(right, params)))
    }
  }
})
