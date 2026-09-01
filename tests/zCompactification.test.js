import test from 'node:test'
import assert from 'node:assert/strict'
import {
  VISUAL_Z_MAX,
  VISUAL_Z_MIN,
  physicalZToVisual,
  visualZToPhysical,
} from '../src/geometry/zCompactification.js'

test('compactified z axis has fixed visual bounds', () => {
  assert.equal(VISUAL_Z_MIN, -1)
  assert.equal(VISUAL_Z_MAX, 1)
})

test('z compactification follows 2 atan(z) / pi and round-trips', () => {
  for (const z of [-100, -2, 0, 3, 100]) {
    const visual = physicalZToVisual(z)
    assert.ok(visual > -1 && visual < 1)
    assert.ok(Math.abs(visualZToPhysical(visual) - z) < 1e-9)
  }
})
