import test from 'node:test'
import assert from 'node:assert/strict'
import { hopfPlus, hopfMinus, hopfTracePlus, hopfTraceMinus, hopfSpectrum, HOPF_EPS } from '../src/entities/hopf/index.js'
import { buildHopfGeometry } from '../src/geometry/hopfSurfaceGeometry.js'
import { generateSurfaceBuffers } from '../src/geometry/surfaceGeneration.js'
import { visualZToPhysical } from '../src/geometry/zCompactification.js'
import { defaultParams, defaultView } from '../src/config/viewDefaults.js'

const parameterCases = [defaultParams, { a: 2, b1: 3, b2: -1, c: 0.7 }, { a: -3, b1: -2, b2: 1, c: -1 }]

test('Hopf formulas have the prescribed signs, zero matrix trace, and reflection symmetry', () => {
  for (const params of parameterCases) for (const Y of [-3, -0.4, 0, 0.8, 3]) for (const z of [-10, -1, 0, 0.2, 1, 10]) {
    const plus = hopfPlus(Y, z, params)
    const minus = hopfMinus(Y, z, params)
    assert.equal(minus, -plus)
    assert.ok(Math.abs(hopfTracePlus(plus, Y, z, params)) < 1e-11)
    assert.ok(Math.abs(hopfTraceMinus(minus, Y, z, params)) < 1e-11)
    assert.ok(Math.abs(hopfSpectrum('plus', plus, Y, z, params).trace) < 1e-10)
    assert.ok(Math.abs(hopfSpectrum('minus', minus, Y, z, params).trace) < 1e-10)
    if (params === defaultParams) {
      assert.ok(Math.abs(16 * (1 + z * z) * plus + (10 * z - 0.2) * Y) < 1e-11)
      assert.ok(Math.abs(16 * (1 + z * z) * minus - (10 * z - 0.2) * Y) < 1e-11)
    }
  }
})

test('physical Hopf meshes contain only elliptic points on the requested surface inside the view', () => {
  for (const params of parameterCases) for (const direction of ['plus', 'minus']) {
    const geometry = buildHopfGeometry(params, defaultView, 40, direction)
    try {
      const positions = geometry.getAttribute('position')
      assert.ok(positions.count > 0, `${direction}: empty mesh`)
      const trace = direction === 'plus' ? hopfTracePlus : hopfTraceMinus
      for (let i = 0; i < positions.count; i++) {
        const t = positions.getX(i), Y = positions.getY(i), z = positions.getZ(i)
        const scale = 1 + Math.abs(2 * params.b1 * (1 + z * z) * t) + Math.abs(((params.b1 + 2) * z - params.b2) * Y)
        assert.ok(Math.abs(trace(t, Y, z, params)) < 2e-6 * scale)
        assert.ok(hopfSpectrum(direction, t, Y, z, params).discriminant < -HOPF_EPS)
        assert.ok(t >= defaultView.tMin - 1e-7 && t <= defaultView.tMax + 1e-7)
        assert.ok(Y >= defaultView.yMin - 1e-7 && Y <= defaultView.yMax + 1e-7)
      }
      assert.equal(geometry.getIndex().count, positions.count)
    } finally { geometry.dispose() }
  }
})

test('rendered triangle interiors and edges remain elliptic after z compactification', () => {
  for (const params of parameterCases) for (const direction of ['plus', 'minus']) {
    const { surface } = generateSurfaceBuffers({ type: 'hopf', params, view: defaultView, resolution: 40, direction })
    assert.ok(surface.index.length > 0)
    for (let i = 0; i < surface.index.length; i += 3) {
      const points = Array.from({ length: 3 }, (_, j) => Array.from(surface.position.slice(3 * surface.index[i + j], 3 * surface.index[i + j] + 3)))
      // Barycentric lattice includes vertices, edges and interior samples.
      for (let a = 0; a <= 5; a++) for (let b = 0; b <= 5 - a; b++) {
        const weights = [a / 5, b / 5, (5 - a - b) / 5]
        const [t, Y, zHat] = [0, 1, 2].map(axis => points.reduce((sum, p, j) => sum + weights[j] * p[axis], 0))
        assert.ok(zHat > -1 && zHat < 1)
        const z = visualZToPhysical(zHat)
        assert.ok(hopfSpectrum(direction, t, Y, z, params).discriminant < -HOPF_EPS,
          `${direction}: triangle crosses the discriminant boundary`)
      }
    }
  }
})

test('Hopf updates with model parameters and excludes degenerate or non-elliptic cases', () => {
  const generate = params => generateSurfaceBuffers({ type: 'hopf', params, view: defaultView, resolution: 40, direction: 'plus' }).surface
  const original = generate(defaultParams)
  for (const change of [{ b1: 4 }, { b2: 1 }, { c: 0.5 }]) {
    const changed = generate({ ...defaultParams, ...change })
    assert.ok(changed.index.length > 0)
    assert.notDeepEqual(changed.position, original.position)
  }
  assert.deepEqual(generate({ ...defaultParams, a: 4 }).position, original.position)
  for (const direction of ['plus', 'minus']) for (const change of [{ b1: 0 }, { b1: 1e-14 }, { c: 0 }]) {
    const { surface } = generateSurfaceBuffers({ type: 'hopf', params: { ...defaultParams, ...change }, view: defaultView, resolution: 40, direction })
    assert.equal(surface.index.length, 0)
    assert.equal(surface.position.length, 0)
  }
  assert.ok(Number.isNaN(hopfPlus(1, 1, { ...defaultParams, b1: 0 })))
})

test('adaptive Hopf boundary recovers the thin strips lost by whole-cell rejection', () => {
  // At z=0, Δ = (1+b2²)Y² ± 2cY. Both nonzero boundary
  // intercepts are known exactly, independent of mesh generation.
  for (const direction of ['plus', 'minus']) {
    const geometry = buildHopfGeometry(defaultParams, defaultView, 40, direction)
    try {
      const positions = geometry.getAttribute('position')
      const boundary = (direction === 'plus' ? -1 : 1) * 2 * defaultParams.c / (1 + defaultParams.b2 ** 2)
      let boundaryGap = Infinity
      let originGap = Infinity
      for (let i = 0; i < positions.count; i++) {
        if (Math.abs(positions.getZ(i)) > 1e-8) continue
        boundaryGap = Math.min(boundaryGap, Math.abs(positions.getY(i) - boundary))
        originGap = Math.min(originGap, Math.abs(positions.getY(i)))
      }
      assert.ok(boundaryGap < 0.006, `${direction}: visible stair at outer boundary (${boundaryGap})`)
      assert.ok(originGap < 0.003, `${direction}: missing surface next to origin (${originGap})`)
    } finally { geometry.dispose() }
  }
})
