import test from 'node:test'
import assert from 'node:assert/strict'
import { buildParametricHugoniot } from '../src/geometry/hugoniotStateParametric.js'
import { hugoniotMinusImplicit } from '../src/geometry/hugoniotStateImplicit.js'

test('both branches pass through the exact node and satisfy the cubic', () => {
  const bounds = { uMin: -3, uMax: 3, vMin: -3, vMax: 3 }
  const fixed = { u: 0.52, v: -0.626 }, params = { b1: 8, b2: 0.2, c: 1 }
  const segments = buildParametricHugoniot(bounds, fixed, params)
  const points = segments.flat().map(p => p.state)
  assert.ok(points.filter(p => Math.hypot(p.u - fixed.u, p.v - fixed.v) < 1e-12).length >= 2)
  for (const p of points) {
    // Clipped endpoints interpolate the drawing; interior samples are exact.
    if (Math.min(p.u - bounds.uMin, bounds.uMax - p.u, p.v - bounds.vMin, bounds.vMax - p.v) < 1e-9) continue
    assert.ok(Math.abs(hugoniotMinusImplicit(p.u, p.v, fixed, params)) < 1e-9)
  }
})

test('reducible case requests the implicit fallback', () => {
  assert.equal(buildParametricHugoniot({ uMin: -3, uMax: 3, vMin: -3, vMax: 3 },
    { u: 0, v: -1 }, { b1: 8, b2: 0.2, c: 1 }), null)
})
