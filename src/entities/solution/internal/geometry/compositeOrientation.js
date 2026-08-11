import { SPEED_DECREASES, SPEED_INCREASES } from '../../../waves/orientation.js'

export function compositeSpeedOrientationDiagnostics(records, orientation) {
  if (!Array.isArray(records) || records.length < 2) {
    return { speedDelta: 0, orientationMatches: false, orientationStrength: 0 }
  }
  const first = records[0]?.speed
  const last = records[records.length - 1]?.speed
  if (!Number.isFinite(first) || !Number.isFinite(last)) {
    return { speedDelta: 0, orientationMatches: false, orientationStrength: 0 }
  }
  const speedDelta = last - first
  const scale = Math.max(1, Math.abs(first), Math.abs(last))
  const tolerance = 1e-8 * scale
  const orientationMatches = orientation === SPEED_DECREASES
    ? speedDelta < -tolerance
    : orientation === SPEED_INCREASES
      ? speedDelta > tolerance
      : true
  return {
    speedDelta,
    orientationMatches,
    orientationStrength: Math.abs(speedDelta) / scale,
  }
}
