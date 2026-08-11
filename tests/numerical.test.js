import test from 'node:test'
import assert from 'node:assert/strict'
import { brentRoot, dedupeSortedNumbers, solveQuadraticRealRoots } from '../src/entities/numerics/index.js'

test('solveQuadraticRealRoots returns the two real roots of a quadratic', () => {
  const roots = solveQuadraticRealRoots(1, -5, 6).sort((a, b) => a - b)
  assert.equal(roots.length, 2)
  assert.ok(Math.abs(roots[0] - 2) < 1e-10)
  assert.ok(Math.abs(roots[1] - 3) < 1e-10)
})

test('solveQuadraticRealRoots handles the linear degenerate case', () => {
  const roots = solveQuadraticRealRoots(0, 2, -8)
  assert.deepEqual(roots, [4])
})

test('brentRoot finds a bracketed nonlinear root', () => {
  const root = brentRoot((x) => x * x - 2, 1, 2)
  assert.ok(Math.abs(root - Math.sqrt(2)) < 1e-8)
})

test('dedupeSortedNumbers sorts finite values and removes near duplicates', () => {
  assert.deepEqual(dedupeSortedNumbers([3, Number.NaN, 1, 1 + 1e-10, 2], 1e-8), [1, 2, 3])
})
