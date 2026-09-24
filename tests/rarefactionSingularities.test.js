import test from 'node:test'
import assert from 'node:assert/strict'
import { rarefactionSingularities, nearRarefactionSingularity, rarefactionInfinitySingularity } from '../src/entities/phasePortrait/rarefactionSingularities.js'
import { rarefactionDerivativeDtDz } from '../src/entities/surfaceImplicit/state.js'
import { P } from '../src/entities/surfaceImplicit/algebra.js'

test('diagnostic cancellation agrees with the existing rarefaction field at regular points', () => {
  for (const b1 of [0.5, 2, 4, 8]) for (const b2 of [0.2, 1, 4]) {
    const params = { b1, b2, c: 1 }
    for (const z of [-2.1, -0.7, 0, 0.4, 3.1]) for (const t of [-0.3, 0, 0.8]) {
      const original = rarefactionDerivativeDtDz(z, t, params)
      if (!Number.isFinite(original)) continue
      const p = P(z, b1, b2)
      const reduced = ((2 - b1) * z - b2) * t - 2 * params.c * p / (b1 * (1 + z * z) ** 2)
      assert.ok(Math.abs(p * original - reduced) < 1e-8)
    }
  }
})

test('finite singularities distinguish nodes, saddles and degeneracy without marking removable A roots', () => {
  assert.deepEqual(rarefactionSingularities({ b1: 4, b2: 4 }).map(s => s.type), ['nó', 'sela'])
  assert.ok(rarefactionSingularities({ b1: 0.5, b2: 1 }).every(s => s.type === 'sela'))
  assert.equal(rarefactionSingularities({ b1: 2, b2: 2 })[0].type, 'degenerada')
  assert.deepEqual(rarefactionSingularities({ b1: 8, b2: 0.2 }), [])
  assert.deepEqual(rarefactionSingularities({ b1: 0, b2: 1 }), [])
})

test('arrows are suppressed near finite singularities and compactified ends, not regular arcs', () => {
  const points = rarefactionSingularities({ b1: 4, b2: 4 })
  const view = { tMin: -1, tMax: 1 }
  assert.ok(nearRarefactionSingularity(points[0], points, view))
  assert.ok(nearRarefactionSingularity({ t: 0.3, z: 100 }, points, view))
  assert.equal(nearRarefactionSingularity({ t: 0.5, z: 0 }, points, view), false)
})

test('infinity is one singularity represented at both chart edges with its projective classification', () => {
  for (const [b1, type] of [[4, 'sela'], [0.5, 'nó'], [1.5, 'sela'], [1, 'degenerada'], [2, 'sela']]) {
    const point = rarefactionInfinitySingularity({ b1, b2: 4 })
    assert.equal(point.id, 'rarefaction-infinity')
    assert.equal(point.type, type)
    assert.deepEqual(point.visualPositions, [[0, 0, -1], [0, 0, 1]])
    assert.deepEqual(point.eigenvalues, [b1, 1 - b1])
  }
  assert.equal(rarefactionInfinitySingularity({ b1: 0, b2: 1 }), null)
})
