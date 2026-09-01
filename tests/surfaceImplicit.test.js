import test from 'node:test'
import assert from 'node:assert/strict'
import { A, P, Q } from '../src/entities/surfaceImplicit/algebra.js'
import {
  computeLeftStateFromWavePoint,
  computeRightStateFromWavePoint,
  solveBackwardHugoniotPointForFixedRightState,
  solveHugoniotPointForFixedState,
} from '../src/entities/surfaceImplicit/state.js'
import { buildHugoniotCurveData } from '../src/entities/hugoniot/curveData.js'
import { physicalPointToVisual, physicalZToVisual } from '../src/geometry/zCompactification.js'
import { buildRarefactionSegmentsData } from '../src/entities/waves/rarefactionSegmentsData.js'
import { smoothCurveCoords } from '../src/geometry/curveSmoothing.js'
import { hugoniotMinusImplicit } from '../src/geometry/hugoniotStateImplicit.js'
import { coincidenceStateImplicit } from '../src/geometry/coincidenceStateImplicit.js'

const params = { a: 0, b1: 8, b2: 0.2, c: 1 }

test('surface implicit algebraic polynomials are finite on regular inputs', () => {
  const z = 0.4
  assert.equal(A(z, params.b2), 1 + params.b2 * z - z * z)
  assert.equal(P(z, params.b1, params.b2), 1 + params.b2 * z + (params.b1 - 1) * z * z)
  assert.equal(Q(z, params.b1, params.b2), 1 + params.b2 * (params.b1 + 1) * z - (params.b1 + 1) * z * z)
})

test('implicit coincidence equation contains its projected parametrization', () => {
  for (const z of [-12, -1.5, 0, 0.7, 9]) {
    const den = 1 + z * z
    const u = (params.c * z * (2 + params.b2 * z)) / (params.b1 * den)
    const v = -(params.c * z * z) / den
    assert.ok(Math.abs(coincidenceStateImplicit(u, v, params)) < 1e-10)
  }
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

test('global H_-(U_L) reaches both compactified z extremes', () => {
  const wavePoint = { t: 0.15, Y: 0.08, z: 0.35 }
  const leftState = computeLeftStateFromWavePoint(wavePoint.t, wavePoint.Y, wavePoint.z, params)
  const view = { tMin: -1, tMax: 1, yMin: -4, yMax: 4.5, zMin: -0.8, zMax: 0.8 }
  const data = buildHugoniotCurveData(leftState, params, view, 320, undefined, { compactifiedZ: true })
  const visualZ = data.segments.flat().map((point) => physicalZToVisual(point.z))
  assert.ok(Math.min(...visualZ) < -0.999)
  assert.ok(Math.max(...visualZ) > 0.999)

})

test('global R_-(U_L) reaches both compactified z extremes', () => {
  const view = { tMin: -1, tMax: 1, yMin: -4, yMax: 4.5, zMin: -0.8, zMax: 0.8 }
  const segments = buildRarefactionSegmentsData({
    fixedState: { t: 0.15, Y: 0, z: 0.35 },
    params,
    view,
    resolution: 40,
    compactifiedZ: true,
  })
  const visualZ = segments.flat().map((point) => physicalZToVisual(point.z))
  assert.ok(Math.min(...visualZ) < -0.999)
  assert.ok(Math.max(...visualZ) > 0.999)
  assert.ok(visualZ.filter((zHat) => Math.abs(zHat) < 0.08).length >= 30)
  const smoothed = smoothCurveCoords(segments[0].map(physicalPointToVisual), {
    minPoints: 720,
    samplesPerEdge: 3,
    maxPoints: 1800,
    maxRawPoints: 9000,
  })
  assert.ok(smoothed.length >= 720)
  assert.ok(Math.min(...smoothed.map((point) => point[2])) < -0.999)
  assert.ok(Math.max(...smoothed.map((point) => point[2])) > 0.999)
})

test('implicit pi-plus projection contains the parametric H_-(U_L) states', () => {
  const wavePoint = { t: 0.15, Y: 0.08, z: 0.35 }
  const leftState = computeLeftStateFromWavePoint(wavePoint.t, wavePoint.Y, wavePoint.z, params)
  for (const z of [-1.2, -0.4, 0.2, 0.9]) {
    const manifold = solveHugoniotPointForFixedState(z, leftState, params)
    const rightState = computeRightStateFromWavePoint(manifold.t, manifold.Y, manifold.z, params)
    assert.ok(Math.abs(hugoniotMinusImplicit(rightState.uPlus, rightState.vPlus, leftState, params)) < 1e-8)
  }
})
