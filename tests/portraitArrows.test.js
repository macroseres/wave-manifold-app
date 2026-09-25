import test from 'node:test'
import assert from 'node:assert/strict'
import { orientedRarefactionFieldEdge, buildPortraitArrowPositions } from '../src/entities/phasePortrait/portraitArrows.js'
import { rarefactionRegularizedField } from '../src/entities/surfaceImplicit/state.js'

test('rarefaction arrows follow the regularized field on either side of P=0 regardless of array order', () => {
  const params = { b1: 4, b2: 4, c: 1 }
  for (const z of [-2, -0.6, 0.2]) for (const t of [-0.3, 0.3]) {
    const field = rarefactionRegularizedField([t, z], params)
    const a = { t, z }, b = { t: t + field[0] * 1e-5, z: z + field[1] * 1e-5 }
    assert.deepEqual(orientedRarefactionFieldEdge(a, b, params), [a, b])
    assert.deepEqual(orientedRarefactionFieldEdge(b, a, params), [a, b])
  }
})

test('arrowheads retain their size and tangent after unequal scene scales', () => {
  const points = Array.from({ length: 101 }, (_, i) => ({ t: i / 50, Y: 0, z: 0, coords: [i / 50, 0, 0] }))
  for (const scale of [[1, 1, 1], [1 / 3, 1 / 0.6, 1 / 3], [0.1, 2, 4]]) {
    const vertices = buildPortraitArrowPositions([{ points }], scale, (a, b) => [a, b])
    assert.ok(vertices.length > 0)
    for (let i = 0; i < vertices.length; i += 12) {
      const tip = Array.from(vertices.slice(i, i + 3), (x, j) => x / scale[j])
      const left = Array.from(vertices.slice(i + 3, i + 6), (x, j) => x / scale[j])
      const right = Array.from(vertices.slice(i + 9, i + 12), (x, j) => x / scale[j])
      assert.ok(Math.abs(tip[0] - (left[0] + right[0]) / 2 - 0.0875) < 1e-5)
      assert.ok(Math.abs(Math.hypot(...left.map((x, j) => x - right[j])) - 0.045) < 1e-5)
    }
  }
  assert.equal(buildPortraitArrowPositions([{ points }], [1, 1, 1], (a, b) => [a, b], () => false).length, 0)
})
