import test from 'node:test'
import assert from 'node:assert/strict'
import { A, P, Q } from '../src/entities/surfaceImplicit/algebra.js'
import {
  computeLeftStateFromWavePoint,
  computeRightStateFromWavePoint,
  solveBackwardHugoniotPointForFixedRightState,
  solveHugoniotPointForFixedState,
} from '../src/entities/surfaceImplicit/state.js'

const params = { a: 0, b1: 8, b2: 0.2, c: 1 }

test('surface implicit algebraic polynomials are finite on regular inputs', () => {
  const z = 0.4
  assert.equal(A(z, params.b2), 1 + params.b2 * z - z * z)
  assert.equal(P(z, params.b1, params.b2), 1 + params.b2 * z + (params.b1 - 1) * z * z)
  assert.equal(Q(z, params.b1, params.b2), 1 + params.b2 * (params.b1 + 1) * z - (params.b1 + 1) * z * z)
})

test('forward and backward fixed-state solvers recover the same wave point away from singularities', () => {
  const wavePoint = { t: 0.15, Y: 0.08, z: 0.35 }
  const leftState = computeLeftStateFromWavePoint(wavePoint.t, wavePoint.Y, wavePoint.z, params)
  const rightState = computeRightStateFromWavePoint(wavePoint.t, wavePoint.Y, wavePoint.z, params)

  const recoveredFromLeft = solveHugoniotPointForFixedState(wavePoint.z, leftState, params)
  const recoveredFromRight = solveBackwardHugoniotPointForFixedRightState(wavePoint.z, rightState, params)

  assert.ok(Math.abs(recoveredFromLeft.t - wavePoint.t) < 1e-10)
  assert.ok(Math.abs(recoveredFromLeft.Y - wavePoint.Y) < 1e-10)
  assert.ok(Math.abs(recoveredFromRight.t - wavePoint.t) < 1e-10)
  assert.ok(Math.abs(recoveredFromRight.Y - wavePoint.Y) < 1e-10)
})
