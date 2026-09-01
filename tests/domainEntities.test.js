import test from 'node:test'
import assert from 'node:assert/strict'
import { makeCharacteristicPlaneGeometry, characteristicMarkerColor } from '../src/entities/characteristic/planeGeometry.js'
import { buildRarefactionArcSegments } from '../src/entities/rarefaction/arcSegments.js'
import { buildLeftHysteresisCurve, buildRightHysteresisCurve } from '../src/entities/hysteresis/curveSegments.js'
import { buildCoincidenceCurveSegments } from '../src/entities/coincidence/curveSegments.js'
import { buildSecondaryRightBifurcationSegments } from '../src/entities/bifurcation/segments.js'
import { solveInflectionSegments } from '../src/entities/surfaceImplicit/specialSegments.js'
import { physicalZToVisual } from '../src/geometry/zCompactification.js'

const params = { a: 0, b1: 8, b2: 0.2, c: 1 }
const view = { tMin: -2, tMax: 2, yMin: -2, yMax: 2, zMin: -2, zMax: 2 }

test('characteristic entity builds finite plane geometry and branch colors', () => {
  const geometry = makeCharacteristicPlaneGeometry(-2, -0.1, -1, 1)
  assert.ok(geometry)
  const position = geometry.getAttribute('position')
  assert.equal(position.count, 4)
  assert.equal(typeof characteristicMarkerColor({ t: -0.3, branch: 'fast' }), 'string')
  geometry.dispose()
})

test('compactified inflection drawing reaches both visual z boundaries', () => {
  const slow = solveInflectionSegments(params, view, 580, 'slow', { compactifiedZ: true }).flat()
  const fast = solveInflectionSegments(params, view, 580, 'fast', { compactifiedZ: true }).flat()
  assert.ok(Math.max(...slow.map((point) => physicalZToVisual(point[2]))) > 0.999)
  assert.ok(Math.min(...fast.map((point) => physicalZToVisual(point[2]))) < -0.999)
})

test('rarefaction entity returns oriented arc segments with decorated points', () => {
  const segments = buildRarefactionArcSegments({ t: 0.4, z: 0.2 }, params, view, 180, 'increasing', { enforceMonotonicity: false })
  assert.ok(segments.length > 0)
  assert.ok(segments.every((segment) => segment.length >= 2))
  const point = segments[0][0]
  assert.ok(Number.isFinite(point.speed))
  assert.deepEqual(point.coords, [point.t, 0, point.z])
})

test('hysteresis entity creates left and right curve segment arrays', () => {
  const left = buildLeftHysteresisCurve(params, view, 40)
  const right = buildRightHysteresisCurve(params, view, 40)
  assert.ok(Array.isArray(left))
  assert.ok(Array.isArray(right))
  assert.ok(left.concat(right).every((segment) => Array.isArray(segment)))
})

test('coincidence and bifurcation entities expose segment builders', () => {
  const coincidence = buildCoincidenceCurveSegments(view)
  const secondary = buildSecondaryRightBifurcationSegments(params, view, 80)
  assert.ok(Array.isArray(coincidence))
  assert.ok(Array.isArray(secondary))
})
