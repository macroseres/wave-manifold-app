import { buildAdmissibleArcSegmentsForSolution } from '../../admissibleArc/segments.js'
import { buildHugoniotBifoliation, selectLeafFromBifoliation } from '../../../waves/index.js'
import { FORWARD_HUGONIOT, BACKWARD_HUGONIOT } from '../../../hugoniot/directions.js'
import { computeLeftStateFromWavePoint, computeRightStateFromWavePoint } from '../../../surfaceImplicit/index.js'
import { HUGONIOT } from '../../../../config/numerics.js'
import {
  coordsOf,
  pointObjectFromCoords,
  interpolatePoint,
  hasUsableSegments,
  sonicValue,
  refineSonicCrossing,
  uniqueAnchors,
  pointInsideSolutionTauZView,
} from '../pipelineShared.js'
import {
  normalizedDistance3,
  expandViewZForIntersections,
  hugoniotPointAt,
} from './commonGeometry.js'

export function findHugoniotSonicAnchors({ entry, params, view, resolution, direction, sonicTarget }) {
  if (!entry?.state || !params || !view) return []
  const samples = Math.max(320, Math.min(760, resolution * 10))
  const bifoliation = buildHugoniotBifoliation({ fixedState: entry.state, params, view, samples })
  const leaf = selectLeafFromBifoliation(bifoliation, direction === BACKWARD_HUGONIOT ? 'plus' : 'minus')
  const anchors = []
  for (const segment of leaf?.curve?.segments ?? []) {
    const points = segment ?? []
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i]
      const b = points[i + 1]
      const fa = sonicValue(a, params, sonicTarget)
      const fb = sonicValue(b, params, sonicTarget)
      if (!Number.isFinite(fa) || !Number.isFinite(fb)) continue
      if (Math.abs(fa) < 1e-7) anchors.push(a)
      if (fa * fb < 0 || Math.abs(fb) < 1e-7) {
        anchors.push(refineSonicCrossing(a, b, params, sonicTarget) ?? b)
      }
    }
  }
  return uniqueAnchors(anchors)
    .filter((anchor) => pointInsideSolutionTauZView(anchor, view))
    .slice(0, 6)
}

export function buildChosenHPlusLeafSegments(rightState, params, view, resolution) {
  if (!rightState || !params || !view) return []
  const samples = Math.max(260, Math.min(760, resolution * 8))
  const bifoliation = buildHugoniotBifoliation({
    fixedState: rightState,
    params,
    view,
    samples,
    zExtensionMargin: HUGONIOT.Z_EXTENSION_MARGIN,
  })
  const leaf = selectLeafFromBifoliation(bifoliation, 'plus')
  return (leaf?.curve?.segments ?? [])
    .map((segment) => (segment ?? []).map(coordsOf).filter(Boolean))
    .filter((segment) => segment.length >= 2)
}


export function buildChosenHMinusLeafSegments(leftState, params, view, resolution) {
  if (!leftState || !params || !view) return []
  const samples = Math.max(260, Math.min(760, resolution * 8))
  const bifoliation = buildHugoniotBifoliation({
    fixedState: leftState,
    params,
    view,
    samples,
    zExtensionMargin: HUGONIOT.Z_EXTENSION_MARGIN,
  })
  const leaf = selectLeafFromBifoliation(bifoliation, 'minus')
  return (leaf?.curve?.segments ?? [])
    .map((segment) => (segment ?? []).map(coordsOf).filter(Boolean))
    .filter((segment) => segment.length >= 2)
}

export function buildHugoniotSegmentsFromFixedLeafStart({ fixedState, startPoint, params, view, resolution, direction, orientation }) {
  if (!fixedState || !startPoint || !params || !view) return []
  const raw = buildAdmissibleArcSegmentsForSolution({
    family: 'hugoniot',
    fixedState,
    params,
    view,
    resolution,
    direction,
    admissibleOrientation: orientation,
    anchorPoint: startPoint,
  })
  return raw
}

export function firstHugoniotIntersectionOnComposite({
  compositeSegments,
  fixedState,
  params,
  view,
  direction,
  minArcLengthFromStart = 0.006,
  tolerance = 0.004,
}) {
  if (!fixedState || !params || !view || !hasUsableSegments(compositeSegments)) return null

  // The local composite arc must stop at the actual first intersection with
  // the selected Hugoniot leaf H_- / H_+, not merely when the two curves are
  // visually close.  The old 0.022 threshold accepted near misses and could
  // truncate K_loc before/after the true crossing.  Use the same scale as the
  // composite stopping geometry and refine each step by minimizing the distance
  // between the composite point and the Hugoniot point with the same z.
  const distanceToLeaf = (point) => {
    const p = pointObjectFromCoords(point)
    if (!p) return null
    const leafPoint = hugoniotPointAt(p.z, fixedState, params, direction)
    const decoratedLeafPoint = pointObjectFromCoords(leafPoint)
    if (!decoratedLeafPoint) return null
    const distance = normalizedDistance3(p, decoratedLeafPoint, view)
    return Number.isFinite(distance) ? { point: p, leafPoint: decoratedLeafPoint, distance } : null
  }

  const closestPointOnStepToLeaf = (a, b) => {
    let left = 0
    let right = 1
    for (let iter = 0; iter < 28; iter += 1) {
      const m1 = left + (right - left) / 3
      const m2 = right - (right - left) / 3
      const p1 = interpolatePoint(a, b, m1)
      const p2 = interpolatePoint(a, b, m2)
      const d1 = distanceToLeaf(p1)?.distance ?? Number.POSITIVE_INFINITY
      const d2 = distanceToLeaf(p2)?.distance ?? Number.POSITIVE_INFINITY
      if (d1 < d2) right = m2
      else left = m1
    }
    const alpha = (left + right) / 2
    const point = interpolatePoint(a, b, alpha)
    const hit = distanceToLeaf(point)
    return hit ? { ...hit, alpha } : null
  }

  for (const segment of compositeSegments ?? []) {
    const points = (segment ?? []).map(pointObjectFromCoords).filter(Boolean)
    if (points.length < 2) continue
    let travelled = 0

    for (let i = 1; i < points.length; i += 1) {
      const previous = points[i - 1]
      const next = points[i]
      const stepLength = normalizedDistance3(previous, next, view)
      const nextTravelled = travelled + stepLength
      travelled = nextTravelled
      if (nextTravelled < minArcLengthFromStart) continue

      const closest = closestPointOnStepToLeaf(previous, next)
      if (closest && closest.distance <= tolerance) {
        return {
          point: closest.point,
          leafPoint: closest.leafPoint,
          distance: closest.distance,
          arcLength: Math.max(minArcLengthFromStart, nextTravelled - stepLength + closest.alpha * stepLength),
        }
      }

      const nextHit = distanceToLeaf(next)
      if (nextHit && nextHit.distance <= tolerance) {
        return { ...nextHit, arcLength: nextTravelled }
      }
    }
  }

  return null
}



export function characteristicBranch(point) {
  const coords = coordsOf(point)
  if (!coords || !Number.isFinite(coords[0])) return 'unknown'
  if (coords[0] > 1e-9) return 'slow'
  if (coords[0] < -1e-9) return 'fast'
  return 'neutral'
}

export function buildHPlusSegmentFromSonicToCs(sonicPoint, params, view, resolution) {
  const start = pointObjectFromCoords(sonicPoint)
  if (!start || !params || !view) return []
  const fixedRightState = computeRightStateFromWavePoint(start.t, start.Y, start.z, params)
  if (!fixedRightState) return []

  const minDistanceFromStart = 0.006
  const yTolerance = 2e-6

  const closestProjectionOnStep = (a, b) => {
    const ca = coordsOf(a)
    const cb = coordsOf(b)
    const cs = coordsOf(start)
    if (!ca || !cb || !cs) return null
    const scales = [
      Math.max(1e-9, Math.abs((view.tMax ?? 1) - (view.tMin ?? 0))),
      Math.max(1e-9, Math.abs((view.yMax ?? 1) - (view.yMin ?? 0))),
      Math.max(1e-9, Math.abs((view.zMax ?? 1) - (view.zMin ?? 0))),
    ]
    const v = cb.map((value, i) => (value - ca[i]) / scales[i])
    const w = cs.map((value, i) => (value - ca[i]) / scales[i])
    const vv = v.reduce((sum, value) => sum + value * value, 0)
    const alpha = vv > 1e-16
      ? Math.max(0, Math.min(1, v.reduce((sum, value, i) => sum + value * w[i], 0) / vv))
      : 0
    const point = interpolatePoint(a, b, alpha)
    return point ? { point, alpha, distance: normalizedDistance3(point, start, view) } : null
  }

  const refineYMinimum = (a, b) => {
    let left = 0
    let right = 1
    for (let iter = 0; iter < 34; iter += 1) {
      const m1 = left + (right - left) / 3
      const m2 = right - (right - left) / 3
      const p1 = interpolatePoint(a, b, m1)
      const p2 = interpolatePoint(a, b, m2)
      const y1 = Math.abs(p1?.Y ?? Number.POSITIVE_INFINITY)
      const y2 = Math.abs(p2?.Y ?? Number.POSITIVE_INFINITY)
      if (y1 <= y2) right = m2
      else left = m1
    }
    const alpha = (left + right) / 2
    const point = interpolatePoint(a, b, alpha)
    return point ? { point, alpha } : null
  }

  const crossingOnEdge = (a, b, travelled, edgeLength) => {
    const pa = pointObjectFromCoords(a)
    const pb = pointObjectFromCoords(b)
    if (!pa || !pb || !Number.isFinite(pa.Y) || !Number.isFinite(pb.Y)) return null

    let crossing = null
    let alpha = null
    if (Math.abs(pa.Y) <= yTolerance) {
      crossing = pa
      alpha = 0
    } else if (Math.abs(pb.Y) <= yTolerance) {
      crossing = pb
      alpha = 1
    } else if (pa.Y * pb.Y < 0) {
      const denom = pa.Y - pb.Y
      alpha = Math.abs(denom) > 1e-14 ? pa.Y / denom : 0.5
      crossing = interpolatePoint(pa, pb, Math.max(0, Math.min(1, alpha)))
    } else {
      // Also detect tangential contact with C_s; a sign change is not required.
      const minimum = refineYMinimum(pa, pb)
      if (minimum && Math.abs(minimum.point.Y) <= yTolerance) {
        crossing = minimum.point
        alpha = minimum.alpha
      }
    }

    if (!crossing || characteristicBranch(crossing) !== 'slow') return null
    const crossingArcLength = travelled + Math.max(0, Math.min(1, alpha ?? 0)) * edgeLength
    if (crossingArcLength < minDistanceFromStart) return null
    return { crossing, crossingArcLength }
  }

  const candidates = []
  // Increase the continuation domain progressively.  The existence of H_+ cap
  // C_s must not depend on the current visible window.
  for (const factor of [0.45, 0.85, 1.35]) {
    const calcView = expandViewZForIntersections(view, factor)
    const leafSegments = buildChosenHPlusLeafSegments(
      fixedRightState,
      params,
      calcView,
      Math.max(resolution, 100),
    )

    for (const segment of leafSegments ?? []) {
      const points = (segment ?? []).map(pointObjectFromCoords).filter(Boolean)
      if (points.length < 2) continue

      let bestProjection = null
      for (let i = 0; i < points.length - 1; i += 1) {
        const projection = closestProjectionOnStep(points[i], points[i + 1])
        if (!projection) continue
        if (!bestProjection || projection.distance < bestProjection.distance) {
          bestProjection = { ...projection, edgeIndex: i }
        }
      }
      if (!bestProjection) continue

      const buildToward = (step) => {
        const out = [start.coords]
        let travelled = 0
        let current = start
        let index = step > 0 ? bestProjection.edgeIndex + 1 : bestProjection.edgeIndex

        while (index >= 0 && index < points.length) {
          const next = points[index]
          const edgeLength = normalizedDistance3(current, next, view)
          const hit = crossingOnEdge(current, next, travelled, edgeLength)
          if (hit) {
            if (normalizedDistance3(hit.crossing, start, view) > 1e-9) out.push(hit.crossing.coords)
            return out.length >= 2
              ? { segment: out, length: hit.crossingArcLength, projectionDistance: bestProjection.distance }
              : null
          }
          if (normalizedDistance3(next, start, view) > 1e-9) out.push(next.coords)
          travelled += edgeLength
          current = next
          index += step
        }
        return null
      }

      for (const step of [1, -1]) {
        const candidate = buildToward(step)
        if (candidate) candidates.push(candidate)
      }
    }

    if (candidates.length) break
  }

  return candidates
    .sort((a, b) => (a.length - b.length) || (a.projectionDistance - b.projectionDistance))
    .slice(0, 1)
    .map((item) => item.segment)
}

/**
 * Follow the H_+ leaf through `startPoint` until its first intersection with
 * the fixed slow Hugoniot leaf H_-(U_L).  This is the auxiliary dashed bridge
 * used after the second-chain nonlocal composite arc.  The returned
 * `intersectionPoint` lies on H_+, while `hMinusLeafPoint` is the refined
 * corresponding point on H_-(U_L) and is the authoritative start of the
 * subsequent nonlocal shock.
 */
export function buildHPlusSegmentToFixedHMinusIntersection({
  startPoint,
  fixedLeftState,
  params,
  view,
  resolution,
  tolerance = 0.004,
  minArcLengthFromStart = 0.006,
}) {
  const start = pointObjectFromCoords(startPoint)
  if (!start || !fixedLeftState || !params || !view) {
    return { segments: [], intersectionPoint: null, hMinusLeafPoint: null, fixedRightState: null }
  }

  const fixedRightState = computeRightStateFromWavePoint(start.t, start.Y, start.z, params)
  if (!fixedRightState) {
    return { segments: [], intersectionPoint: null, hMinusLeafPoint: null, fixedRightState: null }
  }

  const calcView = expandViewZForIntersections(view, 0.35)
  const leafSegments = buildChosenHPlusLeafSegments(
    fixedRightState,
    params,
    calcView,
    Math.max(resolution, 90),
  )

  const distanceToFixedHMinus = (point) => {
    const p = pointObjectFromCoords(point)
    if (!p) return null
    const leaf = pointObjectFromCoords(hugoniotPointAt(
      p.z,
      fixedLeftState,
      params,
      FORWARD_HUGONIOT,
    ))
    if (!leaf) return null
    const distance = normalizedDistance3(p, leaf, calcView)
    return Number.isFinite(distance) ? { point: p, leafPoint: leaf, distance } : null
  }

  const closestOnStep = (a, b) => {
    let left = 0
    let right = 1
    for (let iter = 0; iter < 32; iter += 1) {
      const m1 = left + (right - left) / 3
      const m2 = right - (right - left) / 3
      const p1 = interpolatePoint(a, b, m1)
      const p2 = interpolatePoint(a, b, m2)
      const d1 = distanceToFixedHMinus(p1)?.distance ?? Number.POSITIVE_INFINITY
      const d2 = distanceToFixedHMinus(p2)?.distance ?? Number.POSITIVE_INFINITY
      if (d1 < d2) right = m2
      else left = m1
    }
    const alpha = (left + right) / 2
    const hit = distanceToFixedHMinus(interpolatePoint(a, b, alpha))
    return hit ? { ...hit, alpha } : null
  }

  const candidates = []
  for (const rawSegment of leafSegments ?? []) {
    const points = (rawSegment ?? []).map(pointObjectFromCoords).filter(Boolean)
    if (points.length < 2) continue

    let nearestIndex = -1
    let nearestDistance = Number.POSITIVE_INFINITY
    for (let i = 0; i < points.length; i += 1) {
      const distance = normalizedDistance3(points[i], start, calcView)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = i
      }
    }
    if (nearestIndex < 0 || nearestDistance > 0.12) continue

    for (const step of [1, -1]) {
      const out = [start.coords]
      let travelled = 0
      let previous = start
      let index = step > 0 ? nearestIndex + 1 : nearestIndex
      let hit = null

      while (index >= 0 && index < points.length) {
        const next = points[index]
        const stepLength = normalizedDistance3(previous, next, calcView)
        const nextTravelled = travelled + stepLength

        if (nextTravelled >= minArcLengthFromStart) {
          const closest = closestOnStep(previous, next)
          if (closest && closest.distance <= tolerance) {
            if (normalizedDistance3(closest.point, out[out.length - 1], calcView) > 1e-12) {
              out.push(closest.point.coords)
            } else {
              out[out.length - 1] = closest.point.coords
            }
            hit = closest
            travelled = nextTravelled - stepLength + closest.alpha * stepLength
            break
          }
        }

        if (normalizedDistance3(next, out[out.length - 1], calcView) > 1e-12) out.push(next.coords)
        previous = next
        travelled = nextTravelled
        index += step
      }

      if (hit && out.length >= 2) {
        candidates.push({
          segment: out,
          hit,
          length: travelled,
          startDistance: nearestDistance,
        })
      }
    }
  }

  if (!candidates.length) {
    // If K_nloc already ended on H_-(U_L), no auxiliary bridge is needed;
    // still return the exact H_- point so the nonlocal shock starts there.
    const direct = distanceToFixedHMinus(start)
    if (direct && direct.distance <= tolerance) {
      return {
        segments: [],
        intersectionPoint: start,
        hMinusLeafPoint: direct.leafPoint,
        fixedRightState,
      }
    }
    return { segments: [], intersectionPoint: null, hMinusLeafPoint: null, fixedRightState }
  }

  candidates.sort((a, b) => (a.length - b.length) || (a.startDistance - b.startDistance))
  const best = candidates[0]
  return {
    segments: [best.segment],
    intersectionPoint: best.hit.point,
    hMinusLeafPoint: best.hit.leafPoint,
    fixedRightState,
  }
}


/** Fast-family mirror of buildHPlusSegmentFromSonicToCs.
 * Follow H_- from a fast-sonic point until the fast characteristic C_f.
 */
export function buildHMinusSegmentFromSonicToCf(sonicPoint, params, view, resolution) {
  const start = pointObjectFromCoords(sonicPoint)
  if (!start || !params || !view) return []
  const fixedLeftState = computeLeftStateFromWavePoint(start.t, start.Y, start.z, params)
  if (!fixedLeftState) return []

  const minDistanceFromStart = 0.006
  const yTolerance = 2e-6
  const closestProjectionOnStep = (a, b) => {
    const ca = coordsOf(a); const cb = coordsOf(b); const cs = coordsOf(start)
    if (!ca || !cb || !cs) return null
    const scales = [
      Math.max(1e-9, Math.abs((view.tMax ?? 1) - (view.tMin ?? 0))),
      Math.max(1e-9, Math.abs((view.yMax ?? 1) - (view.yMin ?? 0))),
      Math.max(1e-9, Math.abs((view.zMax ?? 1) - (view.zMin ?? 0))),
    ]
    const v = cb.map((value, i) => (value - ca[i]) / scales[i])
    const w = cs.map((value, i) => (value - ca[i]) / scales[i])
    const vv = v.reduce((sum, value) => sum + value * value, 0)
    const alpha = vv > 1e-16 ? Math.max(0, Math.min(1, v.reduce((sum, value, i) => sum + value * w[i], 0) / vv)) : 0
    const point = interpolatePoint(a, b, alpha)
    return point ? { point, alpha, distance: normalizedDistance3(point, start, view) } : null
  }
  const refineYMinimum = (a, b) => {
    let left = 0; let right = 1
    for (let iter = 0; iter < 34; iter += 1) {
      const m1 = left + (right - left) / 3; const m2 = right - (right - left) / 3
      const p1 = interpolatePoint(a, b, m1); const p2 = interpolatePoint(a, b, m2)
      if (Math.abs(p1?.Y ?? Number.POSITIVE_INFINITY) <= Math.abs(p2?.Y ?? Number.POSITIVE_INFINITY)) right = m2
      else left = m1
    }
    const alpha = (left + right) / 2; const point = interpolatePoint(a, b, alpha)
    return point ? { point, alpha } : null
  }
  const crossingOnEdge = (a, b, travelled, edgeLength) => {
    const pa = pointObjectFromCoords(a); const pb = pointObjectFromCoords(b)
    if (!pa || !pb || !Number.isFinite(pa.Y) || !Number.isFinite(pb.Y)) return null
    let crossing = null; let alpha = null
    if (Math.abs(pa.Y) <= yTolerance) { crossing = pa; alpha = 0 }
    else if (Math.abs(pb.Y) <= yTolerance) { crossing = pb; alpha = 1 }
    else if (pa.Y * pb.Y < 0) {
      const denom = pa.Y - pb.Y; alpha = Math.abs(denom) > 1e-14 ? pa.Y / denom : 0.5
      crossing = interpolatePoint(pa, pb, Math.max(0, Math.min(1, alpha)))
    } else {
      const minimum = refineYMinimum(pa, pb)
      if (minimum && Math.abs(minimum.point.Y) <= yTolerance) { crossing = minimum.point; alpha = minimum.alpha }
    }
    if (!crossing || characteristicBranch(crossing) !== 'fast') return null
    const crossingArcLength = travelled + Math.max(0, Math.min(1, alpha ?? 0)) * edgeLength
    if (crossingArcLength < minDistanceFromStart) return null
    return { crossing, crossingArcLength }
  }

  const candidates = []
  for (const factor of [0.45, 0.85, 1.35]) {
    const calcView = expandViewZForIntersections(view, factor)
    const leafSegments = buildChosenHMinusLeafSegments(fixedLeftState, params, calcView, Math.max(resolution, 100))
    for (const segment of leafSegments ?? []) {
      const points = (segment ?? []).map(pointObjectFromCoords).filter(Boolean)
      if (points.length < 2) continue
      let bestProjection = null
      for (let i = 0; i < points.length - 1; i += 1) {
        const projection = closestProjectionOnStep(points[i], points[i + 1])
        if (projection && (!bestProjection || projection.distance < bestProjection.distance)) bestProjection = { ...projection, edgeIndex: i }
      }
      if (!bestProjection) continue
      const buildToward = (step) => {
        const out = [start.coords]; let travelled = 0; let current = start
        let index = step > 0 ? bestProjection.edgeIndex + 1 : bestProjection.edgeIndex
        while (index >= 0 && index < points.length) {
          const next = points[index]; const edgeLength = normalizedDistance3(current, next, view)
          const hit = crossingOnEdge(current, next, travelled, edgeLength)
          if (hit) {
            if (normalizedDistance3(hit.crossing, start, view) > 1e-9) out.push(hit.crossing.coords)
            return out.length >= 2 ? { segment: out, length: hit.crossingArcLength, projectionDistance: bestProjection.distance } : null
          }
          if (normalizedDistance3(next, start, view) > 1e-9) out.push(next.coords)
          travelled += edgeLength; current = next; index += step
        }
        return null
      }
      for (const step of [1, -1]) { const candidate = buildToward(step); if (candidate) candidates.push(candidate) }
    }
    if (candidates.length) break
  }
  return candidates.sort((a, b) => (a.length - b.length) || (a.projectionDistance - b.projectionDistance)).slice(0, 1).map((item) => item.segment)
}

/** Follow H_- through startPoint until the fixed fast Hugoniot H_+(U_R). */
export function buildHMinusSegmentToFixedHPlusIntersection({
  startPoint,
  fixedRightState,
  params,
  view,
  resolution,
  tolerance = 0.004,
  minArcLengthFromStart = 0.006,
}) {
  const start = pointObjectFromCoords(startPoint)
  if (!start || !fixedRightState || !params || !view) return { segments: [], intersectionPoint: null, hPlusLeafPoint: null, fixedLeftState: null }
  const fixedLeftState = computeLeftStateFromWavePoint(start.t, start.Y, start.z, params)
  if (!fixedLeftState) return { segments: [], intersectionPoint: null, hPlusLeafPoint: null, fixedLeftState: null }
  const calcView = expandViewZForIntersections(view, 0.35)
  const leafSegments = buildChosenHMinusLeafSegments(fixedLeftState, params, calcView, Math.max(resolution, 90))
  const distanceToFixedHPlus = (point) => {
    const p = pointObjectFromCoords(point)
    if (!p) return null
    const leaf = pointObjectFromCoords(hugoniotPointAt(p.z, fixedRightState, params, BACKWARD_HUGONIOT))
    if (!leaf) return null
    const distance = normalizedDistance3(p, leaf, calcView)
    return Number.isFinite(distance) ? { point: p, leafPoint: leaf, distance } : null
  }
  const closestOnStep = (a, b) => {
    let left = 0; let right = 1
    for (let iter = 0; iter < 32; iter += 1) {
      const m1 = left + (right - left) / 3; const m2 = right - (right - left) / 3
      const d1 = distanceToFixedHPlus(interpolatePoint(a, b, m1))?.distance ?? Number.POSITIVE_INFINITY
      const d2 = distanceToFixedHPlus(interpolatePoint(a, b, m2))?.distance ?? Number.POSITIVE_INFINITY
      if (d1 < d2) right = m2; else left = m1
    }
    const alpha = (left + right) / 2; const hit = distanceToFixedHPlus(interpolatePoint(a, b, alpha))
    return hit ? { ...hit, alpha } : null
  }
  const candidates = []
  for (const rawSegment of leafSegments ?? []) {
    const points = (rawSegment ?? []).map(pointObjectFromCoords).filter(Boolean)
    if (points.length < 2) continue
    let nearestIndex = -1; let nearestDistance = Number.POSITIVE_INFINITY
    for (let i = 0; i < points.length; i += 1) {
      const distance = normalizedDistance3(points[i], start, calcView)
      if (distance < nearestDistance) { nearestDistance = distance; nearestIndex = i }
    }
    if (nearestIndex < 0 || nearestDistance > 0.12) continue
    for (const step of [1, -1]) {
      const out = [start.coords]; let travelled = 0; let previous = start
      let index = step > 0 ? nearestIndex + 1 : nearestIndex; let hit = null
      while (index >= 0 && index < points.length) {
        const next = points[index]; const stepLength = normalizedDistance3(previous, next, calcView); const nextTravelled = travelled + stepLength
        if (nextTravelled >= minArcLengthFromStart) {
          const closest = closestOnStep(previous, next)
          if (closest && closest.distance <= tolerance) {
            if (normalizedDistance3(closest.point, out[out.length - 1], calcView) > 1e-12) out.push(closest.point.coords)
            else out[out.length - 1] = closest.point.coords
            hit = closest; travelled = nextTravelled - stepLength + closest.alpha * stepLength; break
          }
        }
        if (normalizedDistance3(next, out[out.length - 1], calcView) > 1e-12) out.push(next.coords)
        previous = next; travelled = nextTravelled; index += step
      }
      if (hit && out.length >= 2) candidates.push({ segment: out, hit, length: travelled, startDistance: nearestDistance })
    }
  }
  if (!candidates.length) {
    const direct = distanceToFixedHPlus(start)
    if (direct && direct.distance <= tolerance) return { segments: [], intersectionPoint: start, hPlusLeafPoint: direct.leafPoint, fixedLeftState }
    return { segments: [], intersectionPoint: null, hPlusLeafPoint: null, fixedLeftState }
  }
  candidates.sort((a, b) => (a.length - b.length) || (a.startDistance - b.startDistance))
  const best = candidates[0]
  return { segments: [best.segment], intersectionPoint: best.hit.point, hPlusLeafPoint: best.hit.leafPoint, fixedLeftState }
}
