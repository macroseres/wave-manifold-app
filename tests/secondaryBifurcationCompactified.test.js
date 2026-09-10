import test from 'node:test'
import assert from 'node:assert/strict'
import { solveSecondaryRightBifurcationSegments } from '../src/entities/surfaceImplicit/specialSegments.js'
import { P, A } from '../src/entities/surfaceImplicit/algebra.js'

test('compactified B+ includes fixed-z branches beyond the old window', () => {
  const params = { b1: 0.99, b2: 0 }
  const view = { tMin: -1, tMax: 1, yMin: -4, yMax: 4, zMin: -1.12, zMax: 1.12 }
  assert.equal(solveSecondaryRightBifurcationSegments(params, view).length, 0)
  const segments = solveSecondaryRightBifurcationSegments(params, view, 260, { compactifiedZ: true })
  assert.equal(segments.length, 2)
  for (const segment of segments) {
    assert.equal(segment.length, 2)
    assert.ok(Math.abs(segment[0][2]) > 9)
    assert.ok(Math.abs(segment[0][1] - segment[1][1]) > 7.999)
    for (const [t, Y, z] of segment) {
      assert.ok(Math.abs(P(z, params.b1, params.b2)) < 1e-10)
      assert.ok(Math.abs(2 * params.b1 * z * (1 + z * z) * t - A(z, params.b2) * Y) < 1e-9)
    }
  }
})

test('B+ is absent when P has no real roots', () => {
  assert.deepEqual(solveSecondaryRightBifurcationSegments({ b1: 8, b2: 0.2 },
    { tMin: -1, tMax: 1, yMin: -4, yMax: 4, zMin: -1, zMax: 1 }, 260,
    { compactifiedZ: true }), [])
})
