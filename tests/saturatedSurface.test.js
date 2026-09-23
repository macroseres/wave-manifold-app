import test from 'node:test'
import assert from 'node:assert/strict'
import { saturatedHysteresisImplicit, buildHysteresisSaturationGeometry } from '../src/geometry/hysteresisSaturationGeometry.js'
import { solveRightHysteresisPoint, computeLeftStateFromWavePoint } from '../src/entities/surfaceImplicit/index.js'
import { solveHugoniotPointForFixedState } from '../src/entities/waves/index.js'
import { defaultParams, defaultView } from '../src/components/panels/schaefferShearerConfig.js'
import { physicalZToVisual } from '../src/geometry/zCompactification.js'

test('implicit saturation contains the original hysteresis leaves', () => {
  for (const params of [defaultParams, { b1: 3, b2: 0, c: 2 }, { b1: 5, b2: -.4, c: .7 }]) {
    for (const seed of [-12, -1, -.6684716081060178, 0, .6399001795345892, 1, 12]) {
      const h = solveRightHysteresisPoint(seed, params)
      const state = computeLeftStateFromWavePoint(h.t, h.Y, seed, params)
      for (const z of [-20, -.5, 0, .5, 20]) {
        const point = solveHugoniotPointForFixedState(z, state, params)
        const value = saturatedHysteresisImplicit(point.Y, point.t, z, params)
        const nearby = saturatedHysteresisImplicit(point.Y + .01, point.t + .01, z, params)
        assert.ok(Math.abs(value) / (1 + Math.abs(nearby)) < 1e-7)
      }
    }
  }
})

test('the transverse double point retains alternating signs around its crossing', () => {
  const t = .10138846442132919, Y = 1.654800923534716
  assert.ok(Math.abs(saturatedHysteresisImplicit(Y, t, 0, defaultParams)) < 1e-7)
  const signs = Array.from({ length: 128 }, (_, i) => {
    const angle = 2 * Math.PI * i / 128
    return Math.sign(saturatedHysteresisImplicit(Y + .002 * Math.sin(angle), t + .002 * Math.cos(angle), 0, defaultParams))
  })
  assert.equal(signs.filter((sign, i) => sign !== signs[(i + 1) % signs.length]).length, 4)
})

test('sheet mesh clips to the display box without capping compactified z', () => {
  const geometry = buildHysteresisSaturationGeometry(defaultParams, defaultView, 40)
  const position = geometry.getAttribute('position')
  assert.ok(geometry.getIndex().count > 0)
  let min = Infinity, max = -Infinity
  for (let i = 0; i < position.count; i++) {
    const t = position.getX(i), Y = position.getY(i), z = position.getZ(i)
    assert.ok([t, Y, z].every(Number.isFinite))
    assert.ok(t >= defaultView.tMin - 1e-6 && t <= defaultView.tMax + 1e-6)
    assert.ok(Y >= defaultView.yMin - 1e-6 && Y <= defaultView.yMax + 1e-6)
    min = Math.min(min, physicalZToVisual(z)); max = Math.max(max, physicalZToVisual(z))
  }
  assert.ok(min < -.99 && max > .99)
  const indices = geometry.getIndex()
  for (let i = 0; i < indices.count; i += 3) {
    const zs = [0, 1, 2].map(k => physicalZToVisual(position.getZ(indices.getX(i + k))))
    // Every face belongs to a narrow leaf strip; no face spans the compactified
    // tail or forms a planar cap on either endpoint.
    assert.ok(Math.max(...zs) - Math.min(...zs) <= 2 / 360 + 1e-6)
    assert.ok(!zs.every(z => Math.abs(z - max) < 1e-8))
    assert.ok(!zs.every(z => Math.abs(z - min) < 1e-8))
  }
  geometry.dispose()
})
