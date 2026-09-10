import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDrawableCompositeSegments } from '../src/geometry/compositeCurveGeometry.js'
import { buildCompositeSegments } from '../src/entities/composite/bifoliation/core.js'

test('actual slow composite contour retains continuity across sparse grid cells', () => {
  const view = { tMin: -1, tMax: 1, yMin: -4, yMax: 4.5, zMin: -1.12, zMax: 1.12 }
  const data = buildCompositeSegments(
    { t: 0.480493144, Y: 0, z: 0.156652026 },
    { b1: 8, b2: 0.2, c: 1 }, view, 900, 40, 'slow', undefined, 'left',
    { ...view, compactifiedZ: true },
  )
  assert.ok(data.segments.length > 0)
  for (const raw of data.segments) {
    const drawn = buildDrawableCompositeSegments([raw])
    assert.equal(drawn.length, 1, 'connected contour must not acquire drawing gaps')
  }
})

test('an isolated large jump still separates disconnected pieces', () => {
  const points = Array.from({ length: 60 }, (_, i) => [i * 0.001, i < 30 ? 0 : 10, 0])
  assert.equal(buildDrawableCompositeSegments([points]).length, 2)
})

test('continuous compactified tail is not split by growing physical z steps', () => {
  const points = Array.from({ length: 201 }, (_, i) => {
    const zHat = 0.9998 * i / 200
    return [0.2, 0.3, Math.tan(Math.PI * zHat / 2)]
  })
  const segments = buildDrawableCompositeSegments([points])
  assert.equal(segments.length, 1)
  assert.ok(segments[0].every(point => point.every(Number.isFinite)))
  assert.ok(segments[0].at(-1)[2] > 1000)
})

test('smoothing a long composite preserves its final endpoint', () => {
  const points = Array.from({ length: 2401 }, (_, i) => [i / 1200, Math.sin(i / 1200), 0.5])
  const segments = buildDrawableCompositeSegments([points])
  assert.equal(segments.length, 1)
  const end = segments[0].at(-1)
  points.at(-1).forEach((value, i) => assert.ok(Math.abs(end[i] - value) < 1e-8))
})
