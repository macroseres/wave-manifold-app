import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCompositeSegments } from '../src/entities/composite/bifoliation/core.js'
import { buildDrawableCompositeSegments } from '../src/geometry/compositeCurveGeometry.js'

test('fast composite extension preserves the sonic anchor and drawable components', () => {
  const params = { b1: 8, b2: 0.2, c: 1 }
  const view = { tMin: -1, tMax: 1, yMin: -4, yMax: 4.5, zMin: -1.12, zMax: 1.12 }
  const seed = { t: -0.48, Y: 0, z: 0.15665 }
  const base = buildCompositeSegments(seed, params, view, 900, 40, 'fast', 'backward', 'right')
  const extended = buildCompositeSegments(seed, params, view, 900, 40, 'fast', 'backward', 'right', { ...view, compactifiedZ: true })
  assert.ok(extended.segments.length > 0)
  extended.sonicAnchorPoint.coords.forEach((v, i) => assert.ok(Math.abs(v - base.sonicAnchorPoint.coords[i]) < 1e-8))
  for (const segment of extended.segments) {
    assert.equal(buildDrawableCompositeSegments([segment]).length, 1)
    assert.ok(segment.every(p => p.coords.every(Number.isFinite)))
  }
})

test('extending the composite display preserves its source rarefaction and produces finite branches', () => {
  const params = { b1: 8, b2: 0.2, c: 1, a: 0 }
  const view = { tMin: -2, tMax: 2, yMin: -2, yMax: 2, zMin: -2.8, zMax: 2.8 }
  const seed = { t: 0.2, Y: 0, z: 0.3 }
  const base = buildCompositeSegments(seed, params, view, 900, 40, 'slow')
  const extended = buildCompositeSegments(seed, params, view, 900, 40, 'slow', undefined, 'left', { ...view, zMin: -32, zMax: 32 })
  assert.ok(base.segments.length > 0)
  assert.ok(extended.segments.length > 0)
  assert.equal(extended.sonicAnchorPoints.length, base.sonicAnchorPoints.length)
  extended.sonicAnchorPoints.forEach((point, i) => {
    point.coords.forEach((value, j) => assert.ok(Math.abs(value - base.sonicAnchorPoints[i].coords[j]) < 1e-8))
  })
  for (const point of extended.segments.flat()) assert.ok(point.coords.every(Number.isFinite))
})

test('compactified composite passes beyond the old z clipping planes and preserves anchors', () => {
  const params = { b1: 8, b2: 0.2, c: 1 }
  const view = { tMin: -1, tMax: 1, yMin: -4, yMax: 4.5, zMin: -1.12, zMax: 1.12 }
  const seed = { t: 0.48049314412436606, Y: 0, z: 0.15665202619353147 }
  const base = buildCompositeSegments(seed, params, view, 900, 40, 'slow')
  const extended = buildCompositeSegments(seed, params, view, 900, 40, 'slow', undefined, 'left', { ...view, compactifiedZ: true })
  const points = extended.segments.flat()
  assert.ok(points.some(point => point.z < -10))
  assert.ok(points.some(point => point.z > 10))
  assert.equal(extended.sonicAnchorPoints.length, base.sonicAnchorPoints.length)
  extended.sonicAnchorPoints.forEach((point, i) => {
    point.coords.forEach((value, j) => assert.ok(Math.abs(value - base.sonicAnchorPoints[i].coords[j]) < 1e-8))
  })
  assert.ok(points.every(point => point.coords.every(Number.isFinite)))
})
