import test from 'node:test'
import assert from 'node:assert/strict'
import { clipTriangleToBox } from '../src/geometry/clipTriangleToBox.js'

const min = [0, 0, 0]
const max = [1, 1, 1]
test('crossing triangle retains its visible part and exact boundary', () => {
  const polygon = clipTriangleToBox([[0.5, 0, 0.5], [1.5, 0, 0.5], [0.5, 1, 0.5]], min, max)
  assert.equal(polygon.length, 4)
  assert.equal(polygon.filter(p => p[0] === 1).length, 2)
  const area = polygon.reduce((sum, p, i) => {
    const q = polygon[(i + 1) % polygon.length]
    return sum + p[0] * q[1] - p[1] * q[0]
  }, 0) / 2
  assert.equal(area, 0.375)
})

test('triangle crossing the window survives even with all vertices outside', () => {
  const polygon = clipTriangleToBox([[-2, -2, 0.5], [4, -2, 0.5], [0.5, 4, 0.5]], min, max)
  assert.ok(polygon.length >= 3)
  assert.ok(polygon.every(p => p.every((v, k) => v >= min[k] && v <= max[k])))
})

test('inside triangles are preserved and outside triangles disappear', () => {
  const triangle = [[0, 0, 0.5], [1, 0, 0.5], [0, 1, 0.5]]
  assert.deepEqual(clipTriangleToBox(triangle, min, max), triangle)
  assert.deepEqual(clipTriangleToBox(triangle.map(p => [p[0], p[1], 2]), min, max), [])
})
