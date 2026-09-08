import test from 'node:test'
import assert from 'node:assert/strict'
import { buildLeftHysteresisCurve, buildRightHysteresisCurve } from '../src/entities/hysteresis/curveSegments.js'
import { solveLeftHysteresisPoint, solveRightHysteresisPoint } from '../src/entities/surfaceImplicit/index.js'
import { physicalZToVisual } from '../src/geometry/zCompactification.js'
import { defaultParams as params, defaultView as view } from '../src/config/viewDefaults.js'

test('both hysteresis curves reach compactified tails and keep exact solver points', () => {
  for (const [build, solve] of [[buildLeftHysteresisCurve, solveLeftHysteresisPoint], [buildRightHysteresisCurve, solveRightHysteresisPoint]]) {
    const segments = build(params, view)
    const points = segments.flat()
    assert.ok(physicalZToVisual(points[0][2]) < -.999)
    assert.ok(physicalZToVisual(points.at(-1)[2]) > .999)
    for (const segment of segments) {
      let previous = null
      for (const [t, Y, z] of segment) {
        const point = solve(z, params)
        assert.equal(t, point.t)
        assert.equal(Y, point.Y)
        if (previous) {
          assert.ok(point.det * previous.det > 0)
          assert.ok(physicalZToVisual(z) - physicalZToVisual(previous.z) < .003)
        }
        previous = point
      }
    }
  }
})
