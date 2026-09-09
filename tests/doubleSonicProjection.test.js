import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDoubleSonicStateProjection } from '../src/geometry/doubleSonicStateProjection.js'
import { defaultParams as params } from '../src/config/viewDefaults.js'
import { projectPointMinus, projectPointPlus } from '../src/entities/geometry/stateProjections.js'
import { sonicImplicitF, sonicLeftImplicitF } from '../src/entities/surfaceImplicit/sonic.js'

test('both DS projections preserve the sonic equations and clip to state bounds', () => {
  const bounds = { uMin: -2, uMax: 2, vMin: -3, vMax: 3 }
  for (const side of ['minus', 'plus']) {
    const segments = buildDoubleSonicStateProjection(bounds, params, side)
    assert.equal(segments.length, 2)
    for (const segment of segments) for (const { manifold: p, state } of segment) {
      assert.ok(Math.abs(sonicImplicitF(p.Y, p.t, p.z, params)) < 1e-8)
      assert.ok(Math.abs(sonicLeftImplicitF(p.Y, p.t, p.z, params)) < 1e-8)
      const expected = (side === 'minus' ? projectPointMinus : projectPointPlus)(p, params)
      assert.equal(state.u, expected.u); assert.equal(state.v, expected.v)
      assert.ok(state.u >= bounds.uMin - 1e-9 && state.u <= bounds.uMax + 1e-9)
      assert.ok(state.v >= bounds.vMin - 1e-9 && state.v <= bounds.vMax + 1e-9)
    }
  }
  assert.deepEqual(buildDoubleSonicStateProjection(bounds, { ...params, b1: -1 }), [])
})
