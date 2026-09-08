import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildSonicSeparatorSegments,
  classifySonicPoint,
  sonicLeftBranchIndicator,
  sonicRightBranchIndicator,
  sonicSurfaceResolution,
} from '../src/entities/sonic/surfaceModel.js'
import { SONIC_SURFACE } from '../src/config/numerics.js'
import { sonicImplicitF, solveSonicBranchSeparatorPoint } from '../src/entities/surfaceImplicit/sonic.js'
import { projectPointMinus, projectPointPlus } from '../src/entities/geometry/stateProjections.js'

const params = { a: 0, b1: 8, b2: 0.2, c: 1 }
const view = { tMin: -2, tMax: 2, yMin: -2, yMax: 2, zMin: -2, zMax: 2 }

test('sonic branch indicators classify opposite signs for mirrored left/right points', () => {
  const left = sonicLeftBranchIndicator(0.4, 0.1, 0.3, params)
  const right = sonicRightBranchIndicator(-0.4, 0.1, 0.3, params)
  assert.ok(Number.isFinite(left))
  assert.ok(Number.isFinite(right))
  assert.equal(Math.sign(left), Math.sign(right))
})

test('right sonic separator solves S-plus and D-plus simultaneously', () => {
  for (const z of [-3, -0.7, 0, 0.4, 2]) {
    const point = solveSonicBranchSeparatorPoint('right', z, params)
    assert.ok(point)
    const scale = 1 + Math.abs(point.t) + Math.abs(point.Y) + Math.abs(z) ** 6
    assert.ok(Math.abs(sonicImplicitF(point.Y, point.t, z, params)) / scale < 1e-9)
    assert.ok(Math.abs(sonicRightBranchIndicator(point.Y, point.t, z, params)) / scale < 1e-9)
  }
})

test('pi-plus of D-minus matches pi-minus of D-plus', () => {
  for (const z of [-3, -0.7, 0, 0.4, 2]) {
    const leftSeparator = solveSonicBranchSeparatorPoint('left', z, params)
    const rightSeparator = solveSonicBranchSeparatorPoint('right', z, params)
    const plusState = projectPointPlus(leftSeparator, params)
    const minusState = projectPointMinus(rightSeparator, params)
    assert.ok(Math.abs(plusState.u - minusState.u) < 1e-12)
    assert.ok(Math.abs(plusState.v - minusState.v) < 1e-12)
  }
})

test('classifySonicPoint returns stable TeX labels and finite indicators', () => {
  const leftInfo = classifySonicPoint('left', { t: 0.1, Y: 0.4, z: 0.3 }, params)
  const rightInfo = classifySonicPoint('right', { t: 0.1, Y: -0.4, z: 0.3 }, params)
  assert.match(leftInfo.tex, /\\mathcal\{S\}\^-/)
  assert.match(rightInfo.tex, /\\mathcal\{S\}\^\+/)
  assert.ok(Number.isFinite(leftInfo.indicator))
  assert.ok(Number.isFinite(rightInfo.indicator))
})

test('sonic separator sampling keeps points inside the requested view', () => {
  const segments = buildSonicSeparatorSegments('left', params, view)
  assert.ok(segments.length > 0)
  for (const segment of segments) {
    assert.ok(segment.length >= 2)
    for (const [t, Y, z] of segment) {
      assert.ok(t >= view.tMin && t <= view.tMax)
      assert.ok(Y >= view.yMin && Y <= view.yMax)
      assert.ok(z >= view.zMin && z <= view.zMax)
    }
  }
})

test('sonicSurfaceResolution respects configured resolution bounds', () => {
  assert.equal(sonicSurfaceResolution(1), SONIC_SURFACE.MIN_RESOLUTION)
  assert.equal(sonicSurfaceResolution(1000), SONIC_SURFACE.MAX_RESOLUTION)
})
