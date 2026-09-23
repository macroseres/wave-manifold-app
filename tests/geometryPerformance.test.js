import test from 'node:test'
import assert from 'node:assert/strict'
import { buildImplicitSurfaceGeometry } from '../src/entities/implicitGeometry/index.js'
import { generateSurfaceBuffers, surfaceBufferSize } from '../src/geometry/surfaceGeneration.js'
import { buildSaturatedCoincidenceGeometry } from '../src/geometry/coincidenceSaturationGeometry.js'
import { compactifyZPositionArray } from '../src/geometry/zCompactification.js'
import { defaultParams as params, defaultView as view } from '../src/config/viewDefaults.js'

test('implicit extraction evaluates every lattice point once, including NaN values', () => {
  for (const invalid of [false, true]) {
    const seen = new Set()
    let calls = 0
    const geometry = buildImplicitSurfaceGeometry((Y, t, z) => {
      const key = `${Y},${t},${z}`
      assert.ok(!seen.has(key), 'shared corner evaluated more than once')
      seen.add(key); calls++
      return invalid && z < 0 ? NaN : t + Y + z
    }, params, view, 12)
    assert.equal(calls, 12 ** 3)
    if (!invalid) assert.ok(geometry.getIndex().count > 0)
    geometry.dispose()
  }
})

test('worker buffers preserve topology and compactify coordinates exactly once', () => {
  const original = buildSaturatedCoincidenceGeometry(params, view, 40)
  const data = generateSurfaceBuffers({ type: 'saturated-coincidence', params, view, resolution: 40 })
  assert.deepEqual(data.surface.position, compactifyZPositionArray(original.attributes.position.array))
  assert.deepEqual(data.surface.index, original.index.array)
  assert.ok(data.surface.normal.every(Number.isFinite))
  assert.ok(surfaceBufferSize(data) > 0)
  const cloned = structuredClone(data, { transfer: Object.values(data.surface).map(array => array.buffer) })
  assert.equal(data.surface.position.byteLength, 0)
  assert.ok(cloned.surface.position.length > 0)
  original.dispose()
})
