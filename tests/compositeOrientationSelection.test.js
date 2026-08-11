import test from 'node:test'
import assert from 'node:assert/strict'

import {
  compositeSpeedOrientationDiagnostics,
} from '../src/entities/solution/internal/geometry/compositeOrientation.js'
import {
  SPEED_DECREASES,
  SPEED_INCREASES,
} from '../src/entities/waves/orientation.js'

test('slow composite side is accepted only when endpoint speed decreases from J', () => {
  const decreasing = compositeSpeedOrientationDiagnostics(
    [{ speed: 3 }, { speed: 2.6 }, { speed: 2.1 }],
    SPEED_DECREASES,
  )
  const increasing = compositeSpeedOrientationDiagnostics(
    [{ speed: 3 }, { speed: 3.2 }, { speed: 3.8 }],
    SPEED_DECREASES,
  )
  assert.equal(decreasing.orientationMatches, true)
  assert.equal(increasing.orientationMatches, false)
  assert.ok(decreasing.speedDelta < 0)
})

test('fast composite side is accepted only when endpoint speed increases from J', () => {
  const increasing = compositeSpeedOrientationDiagnostics(
    [{ speed: -1 }, { speed: -0.6 }, { speed: 0.2 }],
    SPEED_INCREASES,
  )
  const decreasing = compositeSpeedOrientationDiagnostics(
    [{ speed: -1 }, { speed: -1.2 }, { speed: -1.8 }],
    SPEED_INCREASES,
  )
  assert.equal(increasing.orientationMatches, true)
  assert.equal(decreasing.orientationMatches, false)
  assert.ok(increasing.speedDelta > 0)
})
