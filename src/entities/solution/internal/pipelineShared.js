import { SPEED_DECREASES, SPEED_INCREASES } from '../../waves/orientation.js'
import { BACKWARD_HUGONIOT } from '../../hugoniot/directions.js'
import {
  computeLeftStateFromWavePoint,
  computeRightStateFromWavePoint,
  sonicImplicitF,
  sonicLeftImplicitF,
  waveSpeed,
} from '../../surfaceImplicit/index.js'

export function coordsOf(point) {
  if (Array.isArray(point)) return point
  if (Array.isArray(point?.coords)) return point.coords
  if ([point?.t, point?.Y, point?.z].every(Number.isFinite)) return [point.t, point.Y, point.z]
  return null
}

export function pointObjectFromCoords(coords) {
  const c = coordsOf(coords)
  return c ? { t: c[0], Y: c[1], z: c[2], coords: [c[0], c[1], c[2]] } : null
}

export function pointSpeed(point, params) {
  const coords = coordsOf(point)
  return coords ? waveSpeed(coords[0], coords[2], params) : Number.NaN
}

export function segmentSpeedRange(segments, params) {
  const points = (segments ?? []).flatMap((segment) => segment ?? []).map(pointObjectFromCoords).filter(Boolean)
  if (!points.length) return { initialSpeed: null, finalSpeed: null }
  const initialSpeed = pointSpeed(points[0], params)
  const finalSpeed = pointSpeed(points[points.length - 1], params)
  return {
    initialSpeed: Number.isFinite(initialSpeed) ? initialSpeed : null,
    finalSpeed: Number.isFinite(finalSpeed) ? finalSpeed : null,
  }
}

export function speedAdmissibleForOrientation(delta, orientation, eps = 1e-8) {
  if (!Number.isFinite(delta)) return false
  if (orientation === SPEED_DECREASES) return delta <= eps
  if (orientation === SPEED_INCREASES) return delta >= -eps
  return true
}

export function normalizedDistanceForPipeline(a, b, view) {
  const ca = coordsOf(a)
  const cb = coordsOf(b)
  if (!ca || !cb) return Number.POSITIVE_INFINITY
  const tScale = Math.max(1e-6, Math.abs((view?.tMax ?? 1) - (view?.tMin ?? 0)))
  const yScale = Math.max(1e-6, Math.abs((view?.yMax ?? 1) - (view?.yMin ?? 0)))
  const zScale = Math.max(1e-6, Math.abs((view?.zMax ?? 1) - (view?.zMin ?? 0)))
  return Math.hypot((ca[0] - cb[0]) / tScale, (ca[1] - cb[1]) / yScale, (ca[2] - cb[2]) / zScale)
}

export function pipelineSegmentLength(segment, view) {
  if (!Array.isArray(segment) || segment.length < 2) return 0
  let length = 0
  for (let i = 1; i < segment.length; i += 1) {
    length += normalizedDistanceForPipeline(segment[i - 1], segment[i], view)
  }
  return length
}

export function collectPipelineOrientedSide(records, anchorCoords, anchorSpeed, anchorIndex, step, orientation) {
  const out = [[...anchorCoords]]
  let previousSpeed = anchorSpeed
  for (let index = anchorIndex + step; index >= 0 && index < records.length; index += step) {
    const record = records[index]
    if (!record?.coords || !Number.isFinite(record.speed)) break
    if (!speedAdmissibleForOrientation(record.speed - previousSpeed, orientation)) break
    out.push([...record.coords])
    previousSpeed = record.speed
  }
  return out.length >= 2 ? out : []
}

export function enforcePipelineOrientationFromAnchor(segments, anchorPoint, params, view, orientation, { choose = 'longest' } = {}) {
  if (orientation !== SPEED_DECREASES && orientation !== SPEED_INCREASES) return segments ?? []
  const anchorCoords = coordsOf(anchorPoint)
  if (!anchorCoords || !hasUsableSegments(segments)) return segments ?? []
  const anchorSpeed = waveSpeed(anchorCoords[0], anchorCoords[2], params)
  if (!Number.isFinite(anchorSpeed)) return segments ?? []

  const candidates = []
  for (const segment of segments ?? []) {
    const records = (segment ?? [])
      .map((point) => {
        const coords = coordsOf(point)
        if (!coords) return null
        const speed = waveSpeed(coords[0], coords[2], params)
        return Number.isFinite(speed) ? { coords, speed } : null
      })
      .filter(Boolean)
    if (records.length < 2) continue

    let bestIndex = -1
    let bestDistance = Number.POSITIVE_INFINITY
    records.forEach((record, index) => {
      const distance = normalizedDistanceForPipeline(record.coords, anchorCoords, view)
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    })
    if (bestIndex < 0) continue

    const forward = collectPipelineOrientedSide(records, anchorCoords, anchorSpeed, bestIndex, 1, orientation)
    const backward = collectPipelineOrientedSide(records, anchorCoords, anchorSpeed, bestIndex, -1, orientation)
    for (const side of [forward, backward]) {
      if (side.length >= 2) candidates.push(side)
    }
  }

  if (!candidates.length) return []
  if (choose === 'shortest') {
    return [candidates.sort((a, b) => pipelineSegmentLength(a, view) - pipelineSegmentLength(b, view))[0]]
  }
  return [candidates.sort((a, b) => pipelineSegmentLength(b, view) - pipelineSegmentLength(a, view))[0]]
}


export function orientSegmentsByEndpointSpeed(segments, params, orientation) {
  if (orientation !== SPEED_DECREASES && orientation !== SPEED_INCREASES) return segments ?? []
  return (segments ?? []).map((segment) => {
    if (!Array.isArray(segment) || segment.length < 2) return segment ?? []
    const first = pointSpeed(segment[0], params)
    const last = pointSpeed(segment[segment.length - 1], params)
    if (!Number.isFinite(first) || !Number.isFinite(last)) return segment
    const alreadyOriented = orientation === SPEED_DECREASES ? last <= first : last >= first
    return alreadyOriented ? segment : [...segment].reverse()
  }).filter((segment) => segment.length >= 2)
}

export function relevantStateForPoint(point, params, direction) {
  const coords = coordsOf(point)
  if (!coords) return null
  return direction === BACKWARD_HUGONIOT
    ? computeRightStateFromWavePoint(coords[0], coords[1], coords[2], params)
    : computeLeftStateFromWavePoint(coords[0], coords[1], coords[2], params)
}

export function makeArc({ branch, family, locality, segments, orientation, sonicTarget, direction, stateRole, state, anchor, metadata = {}, params }) {
  const { initialSpeed, finalSpeed } = segmentSpeedRange(segments, params)
  return {
    branch,
    family,
    locality,
    segments: segments ?? [],
    orientation,
    sonicTarget,
    direction,
    stateRole,
    state,
    anchor,
    metadata,
    diagnostics: {
      branch,
      family,
      locality,
      initialSpeed,
      finalSpeed,
      sonicTarget,
      stateRole,
      state,
      orientation,
    },
  }
}

export function hasUsableSegments(segments) {
  return (segments ?? []).some((segment) => segment?.length >= 2)
}

export function interpolatePoint(a, b, alpha) {
  const ca = coordsOf(a)
  const cb = coordsOf(b)
  if (!ca || !cb) return null
  const coords = [
    ca[0] + alpha * (cb[0] - ca[0]),
    ca[1] + alpha * (cb[1] - ca[1]),
    ca[2] + alpha * (cb[2] - ca[2]),
  ]
  return { t: coords[0], Y: coords[1], z: coords[2], coords }
}

export function sonicValue(point, params, target) {
  const coords = coordsOf(point)
  if (!coords) return Number.NaN
  return target === 'right'
    ? sonicImplicitF(coords[1], coords[0], coords[2], params)
    : sonicLeftImplicitF(coords[1], coords[0], coords[2], params)
}

export function sonicRightBranchIndicatorValue(point, params) {
  const coords = coordsOf(point)
  if (!coords || !params) return Number.NaN
  const [t, Y, z] = coords
  return -Y * (params.b1 * z - params.b2 + 2 * z) - 2 * params.b1 * t * (1 + z * z)
}

export function sonicBranchMatches(point, params, sonicTarget, branch) {
  if (!branch || branch === 'any') return true
  if (sonicTarget !== 'right') return true
  const indicator = sonicRightBranchIndicatorValue(point, params)
  if (!Number.isFinite(indicator)) return false
  if (Math.abs(indicator) <= 1e-7) return true
  return branch === 'fast' ? indicator > 0 : indicator < 0
}

export function sonicRightBranch(point, params) {
  const indicator = sonicRightBranchIndicatorValue(point, params)
  if (!Number.isFinite(indicator)) return 'unknown'
  if (indicator > 1e-7) return 'fast'
  if (indicator < -1e-7) return 'slow'
  return 'neutral'
}

export function refineSonicCrossing(a, b, params, target) {
  let left = a
  let right = b
  let fLeft = sonicValue(left, params, target)
  let fRight = sonicValue(right, params, target)
  if (!Number.isFinite(fLeft) || !Number.isFinite(fRight)) return null
  for (let i = 0; i < 34; i += 1) {
    const mid = interpolatePoint(left, right, 0.5)
    const fMid = sonicValue(mid, params, target)
    if (!mid || !Number.isFinite(fMid)) break
    if (Math.abs(fMid) < 1e-9) return mid
    if (fLeft * fMid <= 0) {
      right = mid
      fRight = fMid
    } else {
      left = mid
      fLeft = fMid
    }
  }
  return interpolatePoint(left, right, 0.5)
}

export function uniqueAnchors(points) {
  const out = []
  for (const point of points ?? []) {
    const coords = coordsOf(point)
    if (!coords) continue
    const exists = out.some((p) => {
      const c = coordsOf(p)
      return c && Math.hypot(c[0] - coords[0], c[1] - coords[1], c[2] - coords[2]) < 1e-5
    })
    if (!exists) out.push({ ...point, t: coords[0], Y: coords[1], z: coords[2], coords })
  }
  return out
}

export function pointInsideSolutionTauZView(point, view) {
  const coords = coordsOf(point)
  if (!coords || !view) return false
  const tPad = 1e-7 * Math.max(1, Math.abs((view.tMax ?? 1) - (view.tMin ?? 0)))
  const zPad = 1e-7 * Math.max(1, Math.abs((view.zMax ?? 1) - (view.zMin ?? 0)))
  return coords[0] >= (view.tMin ?? -Infinity) - tPad
    && coords[0] <= (view.tMax ?? Infinity) + tPad
    && coords[2] >= (view.zMin ?? -Infinity) - zPad
    && coords[2] <= (view.zMax ?? Infinity) + zPad
}
