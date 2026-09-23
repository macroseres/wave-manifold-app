import test from 'node:test'
import assert from 'node:assert/strict'
import { buildHysPlusMinusProjection } from '../src/geometry/hysPlusMinusProjection.js'
import { findHysteresisDoubleStates } from '../src/geometry/hysteresisSelfIntersection.js'
import { defaultParams } from '../src/components/panels/schaefferShearerConfig.js'

test('state projection has four incident edges at the double point', () => {
  const bounds = { uMin: -2, uMax: 2, vMin: -3, vMax: 2 }
  const point = findHysteresisDoubleStates(defaultParams)[0]
  for (const resolution of [100, 420]) {
    const segments = buildHysPlusMinusProjection(bounds, defaultParams, resolution)
    const incident = segments.filter(segment => segment.some(p => Math.hypot(p.state.u - point.uMinus, p.state.v - point.vMinus) < 1e-10))
    assert.equal(incident.length, 4)
    const seeds = new Set(incident.flat().filter(p => Math.hypot(p.state.u - point.uMinus, p.state.v - point.vMinus) < 1e-10).map(p => p.manifold.z.toFixed(8)))
    assert.equal(seeds.size, 2)
  }
})
