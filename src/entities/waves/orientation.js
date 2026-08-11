import { flattenSegments } from '../shared/types/mathTypes.js'

const SPEED_EPS = 1e-9

export const SPEED_DECREASES = 'decrease'
export const SPEED_INCREASES = 'increase'


// Canonical admissible speed orientations used by the solution pipeline.
// Keep this table as the single source of truth for drawing/local and non-local arcs:
//   slow:  H_- decreases, R_- increases, K_- decreases
//   fast:  H_+ increases, R_+ decreases, K_+ increases
export const SOLUTION_ARC_ORIENTATIONS = Object.freeze({
  slow: Object.freeze({
    hugoniot: SPEED_DECREASES,
    rarefaction: SPEED_INCREASES,
    composite: SPEED_DECREASES,
  }),
  fast: Object.freeze({
    hugoniot: SPEED_INCREASES,
    rarefaction: SPEED_DECREASES,
    composite: SPEED_INCREASES,
  }),
  reflected: Object.freeze({
    hugoniot: SPEED_INCREASES,
    rarefaction: SPEED_DECREASES,
    composite: SPEED_INCREASES,
  }),
})

export function solutionArcOrientation(branch, family) {
  return SOLUTION_ARC_ORIENTATIONS?.[branch]?.[family]
    ?? SOLUTION_ARC_ORIENTATIONS.fast[family]
    ?? 'none'
}


export function speedModeFromOrientation(orientation) {
  return orientation === SPEED_DECREASES ? 'decreasing' : 'increasing'
}

export function solutionSpeedMode(branch, family) {
  return speedModeFromOrientation(solutionArcOrientation(branch, family))
}

export function orientationFromDirection({ family, direction }) {
  if (family === 'hugoniot') {
    return direction === 'plus' ? SPEED_INCREASES : SPEED_DECREASES
  }
  if (family === 'rarefaction') {
    return direction === 'plus' || direction === 'backward'
      ? SPEED_DECREASES
      : SPEED_INCREASES
  }
  return 'none'
}

export function annotateSpeedsAndAdmissibility(segments, speedFn, orientation) {
  const flat = flattenSegments(segments)
  const speeds = flat.map((point) => speedFn(point)).map((s) => (Number.isFinite(s) ? s : Number.NaN))
  const admissible = []

  for (let i = 0; i < flat.length; i += 1) {
    const prev = speeds[Math.max(0, i - 1)]
    const next = speeds[Math.min(speeds.length - 1, i + 1)]
    const delta = next - prev
    if (!Number.isFinite(delta)) {
      admissible.push(false)
    } else if (orientation === SPEED_DECREASES) {
      admissible.push(delta < SPEED_EPS)
    } else if (orientation === SPEED_INCREASES) {
      admissible.push(delta > -SPEED_EPS)
    } else {
      admissible.push(true)
    }
  }

  return { speeds, admissible }
}

export function splitSegmentsAtLargeJumps(points, { maxJumpT, maxJumpY, maxJumpZ }) {
  const segments = []
  let current = []

  for (const point of points ?? []) {
    if (!point?.coords) {
      if (current.length >= 2) segments.push(current)
      current = []
      continue
    }

    if (current.length > 0) {
      const prev = current[current.length - 1]
      const jumpT = Math.abs(point.coords[0] - prev.coords[0])
      const jumpY = Math.abs(point.coords[1] - prev.coords[1])
      const jumpZ = Math.abs(point.coords[2] - prev.coords[2])
      if (jumpT > maxJumpT || jumpY > maxJumpY || jumpZ > maxJumpZ) {
        if (current.length >= 2) segments.push(current)
        current = []
      }
    }

    current.push(point)
  }

  if (current.length >= 2) segments.push(current)
  return segments
}


export function orientSegmentBySpeed(segment, speedFn, orientation) {
  if (!Array.isArray(segment) || segment.length < 2) return segment ?? []
  if (orientation !== SPEED_DECREASES && orientation !== SPEED_INCREASES) return segment

  const first = speedFn(segment[0])
  const last = speedFn(segment[segment.length - 1])
  if (!Number.isFinite(first) || !Number.isFinite(last)) return segment

  const alreadyOriented = orientation === SPEED_DECREASES ? last <= first : last >= first
  return alreadyOriented ? segment : [...segment].reverse()
}

export function orientSegmentsBySpeed(segments, speedFn, orientation) {
  return (segments ?? [])
    .map((segment) => orientSegmentBySpeed(segment, speedFn, orientation))
    .filter((segment) => segment.length >= 2)
}
