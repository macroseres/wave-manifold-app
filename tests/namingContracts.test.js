import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorkerTaskKey } from '../src/hooks/workerTaskKey.js'
import { normalizeWaveSegments, createWaveCurve } from '../src/entities/shared/types/mathTypes.js'
import { makeWaveCurve } from '../src/core/types/mathTypes.js'

test('worker cache separates factories with identical names and canonicalizes payload keys', () => {
  const first = function factory() {}
  const second = function factory() {}
  const payload = { params: { b: 2, a: 1 }, points: [1, 2] }
  assert.notEqual(createWorkerTaskKey(first, payload), createWorkerTaskKey(second, payload))
  assert.equal(createWorkerTaskKey(first, payload), createWorkerTaskKey(first, { points: [1, 2], params: { a: 1, b: 2 } }))
  assert.notEqual(createWorkerTaskKey(first, payload), createWorkerTaskKey(first, { ...payload, points: [2, 1] }))
})

test('wave normalization preserves metadata, rejects invalid points, and does not mutate inputs', () => {
  const point = { t: 1, Y: 2, z: 3, speed: 4 }
  const segments = [[null, point, { coords: [4, 5, 6] }, { t: NaN }], [point]]
  const normalized = normalizeWaveSegments(segments)
  assert.deepEqual(normalized, [[{ ...point, coords: [1, 2, 3] }, { t: 4, Y: 5, z: 6, coords: [4, 5, 6] }]])
  assert.equal(point.coords, undefined)
  assert.equal(segments[0].length, 4)
  assert.equal(makeWaveCurve, createWaveCurve)
})
