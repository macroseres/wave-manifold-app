import test from 'node:test'
import assert from 'node:assert/strict'
import { solveSecondaryLeftBifurcationSegments } from '../src/entities/bifurcation/segments.js'
import { P, A } from '../src/entities/surfaceImplicit/algebra.js'
import { solveLeftHysteresisPoint, computeLeftStateFromWavePoint, computeRightStateFromWavePoint, solveHugoniotPointForFixedState, solveBackwardHugoniotPointForFixedRightState } from '../src/entities/surfaceImplicit/index.js'
import { generateSurfaceBuffers } from '../src/geometry/surfaceGeneration.js'
import { defaultParams } from '../src/components/panels/schaefferShearerConfig.js'

test('B- satisfies its equations and clips to an asymmetric Y window', () => {
  const view = { tMin: -.8, tMax: 1.3, yMin: .2, yMax: 3, zMin: -1, zMax: 1 }
  for (const params of [{ b1: .99, b2: 0 }, { b1: 1, b2: 2 }, { b1: 2, b2: 2 }]) {
    const segments = solveSecondaryLeftBifurcationSegments(params, view, 260, { compactifiedZ: true })
    assert.ok(segments.length)
    for (const [t, Y, z] of segments.flat()) {
      assert.ok(t >= view.tMin - 1e-10 && t <= view.tMax + 1e-10)
      assert.ok(Y >= view.yMin - 1e-10 && Y <= view.yMax + 1e-10)
      assert.ok(Math.abs(P(z, params.b1, params.b2)) < 1e-9)
      assert.ok(Math.abs(2 * params.b1 * z * (1 + z * z) * t + A(z, params.b2) * Y) < 1e-8)
    }
  }
  assert.deepEqual(solveSecondaryLeftBifurcationSegments({ b1: 8, b2: .2 }, view), [])
  assert.deepEqual(solveSecondaryLeftBifurcationSegments({ b1: .99, b2: 0 }, view), [])
})

test('both saturations of Hys- contain their seed and preserve the appropriate state', () => {
  for (const params of [defaultParams, { b1: 3, b2: 0, c: 2 }, { b1: 5, b2: -.4, c: .7 }]) {
    for (const seedZ of [-12, -1, -.3, 0, .4, 1, 12]) {
      const seed = solveLeftHysteresisPoint(seedZ, params)
      assert.ok(seed)
      for (const [project, solve] of [[computeLeftStateFromWavePoint, solveHugoniotPointForFixedState], [computeRightStateFromWavePoint, solveBackwardHugoniotPointForFixedRightState]]) {
        const state = project(seed.t, seed.Y, seedZ, params)
        for (const z of [-20, -.5, seedZ, 0, .5, 20]) {
          const point = solve(z, state, params)
          assert.ok(point)
          const actual = project(point.t, point.Y, z, params)
          assert.ok(Math.hypot(actual.u - state.u, actual.v - state.v) < 1e-8)
          if (z === seedZ) assert.ok(Math.hypot(point.t - seed.t, point.Y - seed.Y) < 1e-8)
        }
      }
    }
  }
})

test('workers generate both Hys- saturations with finite clipped compactified coordinates', () => {
  const view = { tMin: -.8, tMax: 1.3, yMin: -.4, yMax: 3, zMin: -1, zMax: 1 }
  for (const direction of ['minus', 'plus']) {
    const data = generateSurfaceBuffers({ type: 'saturated-left', params: defaultParams, view, resolution: 40, direction }).surface
    assert.ok(data.index.length > 0)
    let lo = Infinity, hi = -Infinity
    for (let i = 0; i < data.position.length; i += 3) {
      const [t, Y, z] = data.position.subarray(i, i + 3)
      assert.ok([t, Y, z].every(Number.isFinite))
      assert.ok(t >= view.tMin - 1e-6 && t <= view.tMax + 1e-6)
      assert.ok(Y >= view.yMin - 1e-6 && Y <= view.yMax + 1e-6)
      lo = Math.min(lo, z); hi = Math.max(hi, z)
    }
    assert.ok(lo < -.99 && hi > .99)
  }
})
