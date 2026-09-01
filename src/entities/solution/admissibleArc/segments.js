import { FORWARD_HUGONIOT, BACKWARD_HUGONIOT } from '../../hugoniot/directions.js'
import { waveSpeed } from '../../surfaceImplicit/index.js'
import { SPEED_DECREASES, SPEED_INCREASES } from '../../waves/orientation.js'
import {
  buildHugoniotBifoliation,
  buildRarefactionBifoliation,
  selectLeafFromBifoliation,
  solveHugoniotPointForFixedState,
  solveBackwardHugoniotPointForFixedRightState,
} from '../../waves/index.js'
import { HUGONIOT } from '../../../config/numerics.js'
import { visualZToPhysical } from '../../../geometry/zCompactification.js'

export function coordsOf(point) {
  if (Array.isArray(point)) return point
  if (Array.isArray(point?.coords)) return point.coords
  if ([point?.t, point?.Y, point?.z].every(Number.isFinite)) return [point.t, point.Y, point.z]
  return null
}

function branchFromT(t, fallbackBranch = null) {
  if (t < -1e-9) return 'fast'
  if (t > 1e-9) return 'slow'
  return fallbackBranch ?? 'slow'
}

export function solutionProbePointFromLineEvent(event, fallbackBranch, attachedCurve) {
  const local = event.object.worldToLocal(event.point.clone())
  const t = local.x
  const Y = local.y
  const z = visualZToPhysical(local.z)
  return {
    t,
    Y,
    z,
    coords: [t, Y, z],
    branch: branchFromT(t, fallbackBranch),
    attachedCurve,
  }
}

function normalizeAnchorForFamily(anchor, family) {
  const coords = coordsOf(anchor)
  if (!coords) return anchor
  if (family === 'rarefaction') {
    return { ...anchor, t: coords[0], Y: 0, z: coords[2], coords: [coords[0], 0, coords[2]] }
  }
  return anchor
}

function makePointRecord(point, speedFn) {
  const coords = coordsOf(point)
  if (!coords) return null
  const speed = speedFn(coords)
  if (!Number.isFinite(speed)) return null
  return { point, coords, speed }
}

function collectAnchoredSide(records, anchorCoords, anchorSpeed, anchorIndex, step, orientation) {
  const out = [[...anchorCoords]]
  let previousSpeed = anchorSpeed
  let i = anchorIndex

  while (true) {
    const nextIndex = i + step
    if (nextIndex < 0 || nextIndex >= records.length) break
    const next = records[nextIndex]
    if (!next?.coords || !Number.isFinite(next.speed)) break
    const delta = next.speed - previousSpeed
    if (!speedAdmissible(delta, orientation)) break
    out.push([...next.coords])
    previousSpeed = next.speed
    i = nextIndex
  }

  return out.length >= 2 ? out : []
}

function anchoredAdmissibleSegmentsBySpeed(segments, anchorPoint, view, speedFn, orientation, family) {
  const anchor = normalizeAnchorForFamily(anchorPoint, family)
  const anchorCoords = coordsOf(anchor)
  if (!anchorCoords || !Array.isArray(segments) || segments.length === 0) return []

  let bestSegment = null
  let bestIndex = -1
  let bestDistance = Number.POSITIVE_INFINITY

  for (const segment of segments ?? []) {
    const records = (segment ?? [])
      .map((point) => makePointRecord(point, speedFn))
      .filter(Boolean)
    if (records.length < 2) continue

    records.forEach((record, index) => {
      const dist = distanceToAnchor(record.coords, anchor, view)
      if (dist < bestDistance) {
        bestDistance = dist
        bestSegment = records
        bestIndex = index
      }
    })
  }

  if (!bestSegment || bestIndex < 0) return []

  const anchorSpeed = speedFn(anchorCoords)
  if (!Number.isFinite(anchorSpeed)) return []

  const forward = collectAnchoredSide(bestSegment, anchorCoords, anchorSpeed, bestIndex, 1, orientation)
  const backward = collectAnchoredSide(bestSegment, anchorCoords, anchorSpeed, bestIndex, -1, orientation)

  const candidates = [forward, backward].filter((segment) => segment.length >= 2)
  if (candidates.length <= 1) return candidates

  // Em um ponto inicial da bifolheação deve aparecer o ramo que realmente sai
  // com o sinal admissível. Se por ruído numérico os dois lados passam no
  // primeiro teste, mantenha o lado com maior comprimento escalado.
  return candidates
    .sort((a, b) => scaledSegmentLength(b, view) - scaledSegmentLength(a, view))
    .slice(0, 1)
}

function distanceToAnchor(coords, anchor, view) {
  if (!coords || !anchor) return Number.POSITIVE_INFINITY
  const anchorCoords = coordsOf(anchor)
  if (!anchorCoords) return Number.POSITIVE_INFINITY
  const tScale = Math.max(1, Math.abs((view?.tMax ?? 1) - (view?.tMin ?? 0)))
  const yScale = Math.max(1, Math.abs((view?.yMax ?? 1) - (view?.yMin ?? 0)))
  const zScale = Math.max(1, Math.abs((view?.zMax ?? 1) - (view?.zMin ?? 0)))
  return Math.hypot(
    (coords[0] - anchorCoords[0]) / tScale,
    (coords[1] - anchorCoords[1]) / yScale,
    (coords[2] - anchorCoords[2]) / zScale,
  )
}

function speedAdmissible(delta, orientation, eps = 1e-8) {
  if (!Number.isFinite(delta)) return false
  if (orientation === SPEED_DECREASES) return delta <= eps
  if (orientation === SPEED_INCREASES) return delta >= -eps
  return true
}

function splitAdmissibleSegmentsBySpeed(segments, speedFn, orientation) {
  const out = []

  for (const segment of segments ?? []) {
    const points = (segment ?? [])
      .map((point) => ({ point, coords: coordsOf(point), speed: speedFn(point) }))
      .filter((item) => item.coords && Number.isFinite(item.speed))

    let current = []
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i]
      const b = points[i + 1]
      const delta = b.speed - a.speed

      if (speedAdmissible(delta, orientation)) {
        if (current.length === 0) current.push(a.coords)
        current.push(b.coords)
      } else {
        if (current.length >= 2) out.push(current)
        current = []
      }
    }

    if (current.length >= 2) out.push(current)
  }

  return out.filter((segment) => segment.length >= 2)
}

function orientSegmentBySpeed(segment, speedFn, orientation) {
  if (!Array.isArray(segment) || segment.length < 2) return segment ?? []
  if (orientation !== SPEED_DECREASES && orientation !== SPEED_INCREASES) return segment
  const first = speedFn(segment[0])
  const last = speedFn(segment[segment.length - 1])
  if (!Number.isFinite(first) || !Number.isFinite(last)) return segment
  const ok = orientation === SPEED_DECREASES ? last <= first : last >= first
  return ok ? segment : [...segment].reverse()
}


function scaledSegmentLength(segment, view) {
  if (!Array.isArray(segment) || segment.length < 2) return 0
  const tScale = Math.max(1e-6, Math.abs((view?.tMax ?? 1) - (view?.tMin ?? 0)))
  const yScale = Math.max(1e-6, Math.abs((view?.yMax ?? 1) - (view?.yMin ?? 0)))
  const zScale = Math.max(1e-6, Math.abs((view?.zMax ?? 1) - (view?.zMin ?? 0)))
  let total = 0
  for (let i = 1; i < segment.length; i += 1) {
    const a = segment[i - 1]
    const b = segment[i]
    total += Math.hypot(
      ((b?.[0] ?? 0) - (a?.[0] ?? 0)) / tScale,
      ((b?.[1] ?? 0) - (a?.[1] ?? 0)) / yScale,
      ((b?.[2] ?? 0) - (a?.[2] ?? 0)) / zScale,
    )
  }
  return total
}

function keepDrawableSegment(segment, view) {
  if (!Array.isArray(segment) || segment.length < 2) return false
  // Arcos locais podem ser curtos quando a âncora está perto da sônica.
  // Exigir 3 pontos/0.018 eliminava choques locais válidos em alguns cliques.
  return scaledSegmentLength(segment, view) >= 0.004
}

function pointInsideTauZView(point, view) {
  if (!view) return true
  const coords = coordsOf(point)
  if (!coords) return false
  const tMin = Number.isFinite(view.tMin) ? view.tMin : -Infinity
  const tMax = Number.isFinite(view.tMax) ? view.tMax : Infinity
  const zMin = Number.isFinite(view.zMin) ? view.zMin : -Infinity
  const zMax = Number.isFinite(view.zMax) ? view.zMax : Infinity
  return coords[0] >= tMin && coords[0] <= tMax && coords[2] >= zMin && coords[2] <= zMax
}

function clipSegmentsToTauZView(segments, view) {
  if (!view) return segments ?? []
  const clipped = []
  for (const segment of segments ?? []) {
    let current = []
    for (const point of segment ?? []) {
      if (pointInsideTauZView(point, view)) {
        current.push(point)
      } else if (current.length > 0) {
        if (current.length >= 2) clipped.push(current)
        current = []
      }
    }
    if (current.length >= 2) clipped.push(current)
  }
  return clipped
}


function withCoords(point) {
  if (!point) return null
  if (Array.isArray(point.coords)) return point
  if ([point.t, point.Y, point.z].every(Number.isFinite)) {
    return { ...point, coords: [point.t, point.Y, point.z] }
  }
  return null
}

function hugoniotPointAt(z, fixedState, params, direction) {
  return direction === BACKWARD_HUGONIOT
    ? solveBackwardHugoniotPointForFixedRightState(z, fixedState, params)
    : solveHugoniotPointForFixedState(z, fixedState, params)
}

function anchoredHugoniotSegmentsFromExactZ({ fixedState, anchorPoint, params, view, samples, direction, orientation, speedFn }) {
  const anchorCoords = coordsOf(anchorPoint)
  if (!fixedState || !anchorCoords || !Number.isFinite(anchorCoords[2])) return []

  const zMin = Number.isFinite(view?.zMin) ? view.zMin : anchorCoords[2] - 2
  const zMax = Number.isFinite(view?.zMax) ? view.zMax : anchorCoords[2] + 2
  const span = Math.max(1e-6, zMax - zMin)
  const startRaw = hugoniotPointAt(anchorCoords[2], fixedState, params, direction)
  const start = withCoords(startRaw) ?? { ...anchorPoint, coords: anchorCoords }
  const startCoords = coordsOf(start)
  const startSpeed = speedFn(startCoords)
  if (!startCoords || !Number.isFinite(startSpeed)) return []

  const maxJumpT = 0.45 * Math.max(1, Math.abs((view?.tMax ?? 1) - (view?.tMin ?? 0)))
  const maxJumpY = 0.45 * Math.max(1, Math.abs((view?.yMax ?? 1) - (view?.yMin ?? 0)))
  const halfSamples = Math.max(160, Math.floor(samples / 2))

  const buildSide = (sign) => {
    const segment = [[...startCoords]]
    let previous = start
    let previousSpeed = startSpeed

    for (let i = 1; i <= halfSamples; i += 1) {
      const z = anchorCoords[2] + sign * span * i / halfSamples
      if (z < zMin - 1e-9 || z > zMax + 1e-9) break
      const point = withCoords(hugoniotPointAt(z, fixedState, params, direction))
      const coords = coordsOf(point)
      if (!point || !coords) continue

      const jumpT = Math.abs(coords[0] - previous.coords[0])
      const jumpY = Math.abs(coords[1] - previous.coords[1])
      if (jumpT > maxJumpT || jumpY > maxJumpY) break

      const speed = speedFn(coords)
      if (!speedAdmissible(speed - previousSpeed, orientation)) break

      segment.push([...coords])
      previous = point
      previousSpeed = speed
    }

    return segment.length >= 2 ? segment : []
  }

  const candidates = [buildSide(1), buildSide(-1)].filter((segment) => segment.length >= 2)
  if (!candidates.length) return []
  return candidates
    .sort((a, b) => scaledSegmentLength(b, view) - scaledSegmentLength(a, view))
    .slice(0, 1)
}

function leafBranchFromDirection(direction) {
  return direction === BACKWARD_HUGONIOT ? 'plus' : 'minus'
}


export function buildAdmissibleArcSegmentsForSolution({
  family,
  fixedState,
  params,
  view,
  resolution = 40,
  direction = FORWARD_HUGONIOT,
  constrainZ = false,
  anchorPoint = null,
  admissibleOrientation = null,
  clipToTauZView = false,
  markerBoundaryView = null,
}) {
  if (!fixedState) return []
  const samples = family === 'hugoniot'
    ? Math.max(
      HUGONIOT.SOLUTION_MIN_SAMPLES ?? 520,
      Math.min(HUGONIOT.SOLUTION_MAX_SAMPLES ?? 1100, resolution * (HUGONIOT.SOLUTION_SAMPLES_PER_RESOLUTION ?? 13)),
    )
    : Math.max(300, Math.min(720, resolution * 9))
  const bifoliation = family === 'rarefaction'
    ? buildRarefactionBifoliation({ fixedState, params, view, samples, constrainZ })
    : buildHugoniotBifoliation({
      fixedState,
      params,
      view,
      samples,
      zExtensionMargin: HUGONIOT.Z_EXTENSION_MARGIN,
    })
  const leaf = selectLeafFromBifoliation(bifoliation, leafBranchFromDirection(direction))
  const curve = leaf?.curve
  const speedFn = (point) => {
    const coords = coordsOf(point)
    return coords ? waveSpeed(coords[0], coords[2], params) : waveSpeed(point?.t, point?.z, params)
  }
  const effectiveOrientation = admissibleOrientation ?? curve?.orientation ?? leaf?.orientation ?? 'none'
  const sourceSegments = curve?.segments ?? []
  const sampledAnchoredSegments = anchorPoint
    ? anchoredAdmissibleSegmentsBySpeed(
      sourceSegments,
      anchorPoint,
      view,
      speedFn,
      effectiveOrientation,
      family,
    )
    : []
  const admissibleSegments = anchorPoint
    ? (sampledAnchoredSegments.length > 0
      ? sampledAnchoredSegments
      : (family === 'hugoniot'
        ? anchoredHugoniotSegmentsFromExactZ({
          fixedState,
          anchorPoint,
          params,
          view,
          samples,
          direction,
          orientation: effectiveOrientation,
          speedFn,
        })
        : []))
    : splitAdmissibleSegmentsBySpeed(
      sourceSegments,
      speedFn,
      effectiveOrientation,
    ).map((segment) => orientSegmentBySpeed(segment, speedFn, effectiveOrientation))
  const clippedSegments = clipToTauZView
    ? clipSegmentsToTauZView(admissibleSegments, markerBoundaryView ?? view)
    : admissibleSegments
  return clippedSegments.filter((segment) => keepDrawableSegment(segment, view))
}
