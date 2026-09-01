import { buildRarefactionArcSegments, trimRarefactionArcSegmentsToEndpoint } from '../../../rarefaction/arcSegments.js'
import { speedModeFromOrientation } from '../../../waves/index.js'
import { SPEED_DECREASES, SPEED_INCREASES } from '../../../waves/orientation.js'
import { rarefactionDerivativeDtDz, sonicLeftImplicitF, sonicLineTCoeff, sonicLineConst } from '../../../surfaceImplicit/index.js'
import { coordsOf, pointObjectFromCoords, pointSpeed } from '../pipelineShared.js'
import { normalizedDistance3, scaledSegmentLength, expandViewZForIntersections } from './commonGeometry.js'

export function pointOnCharacteristicSide(point, branch) {
  const coords = coordsOf(point)
  if (!coords) return false
  return branch === 'fast' ? coords[0] <= 1e-8 : coords[0] >= -1e-8
}

export function interpolateAtTZero(a, b) {
  const ca = coordsOf(a)
  const cb = coordsOf(b)
  if (!ca || !cb || Math.abs(ca[0] - cb[0]) <= 1e-12) return null
  const alpha = ca[0] / (ca[0] - cb[0])
  if (alpha < 0 || alpha > 1) return null
  return { t: 0, Y: ca[1] + alpha * (cb[1] - ca[1]), z: ca[2] + alpha * (cb[2] - ca[2]), coords: [0, ca[1] + alpha * (cb[1] - ca[1]), ca[2] + alpha * (cb[2] - ca[2])] }
}

export function clipRarefactionToCharacteristicSide(segment, branch) {
  if (!Array.isArray(segment) || segment.length < 2) return []
  const out = []
  for (let i = 0; i < segment.length; i += 1) {
    const point = segment[i]
    if (pointOnCharacteristicSide(point, branch)) {
      out.push(point)
      continue
    }
    const previous = out[out.length - 1]
    const boundary = previous ? interpolateAtTZero(previous, point) : null
    if (boundary) out.push(boundary)
    break
  }
  return out.length >= 2 ? out : []
}

export function buildSolutionRarefactionSegments(anchorPoint, params, view, resolution, orientation, endpointPoint = null, branch = 'slow', options = {}) {
  const samples = Math.max(520, Math.min(900, resolution * 12))
  const raw = buildRarefactionArcSegments(anchorPoint, params, view, samples, speedModeFromOrientation(orientation), {
    enforceMonotonicity: options.enforceRarefactionMonotonicity !== false,
  })
  const trimmed = trimRarefactionArcSegmentsToEndpoint(raw, endpointPoint)
    .map((segment) => options.clipToCharacteristicSide === false ? segment : clipRarefactionToCharacteristicSide(segment, branch))
    .filter((segment) => segment.length >= 2)
  const segments = endpointPoint
    ? trimmed
    : options.returnAllSegments === true
      ? trimmed
      : [...trimmed].sort((a, b) => scaledSegmentLength(b, view) - scaledSegmentLength(a, view)).slice(0, 1)
  // The rarefaction builder receives speedModeFromOrientation(orientation) and
  // enforces monotonicity point-by-point.  Do not apply a second global
  // initial/final speed filter here; it can hide valid arc portions or accept
  // non-monotone arcs.
  return segments
}


/**
 * Builds an admissible rarefaction directly from the clicked state to its
 * first intersection with the corresponding inflection/sonic curve. The
 * endpoint is refined on the very same sampled polyline, so the displayed
 * rarefaction endpoint and the local-composite anchor are identical.
 */
export function buildSolutionRarefactionToInflectionSegments(
  anchorPoint,
  params,
  view,
  resolution,
  orientation,
  branch = 'slow',
  options = {},
) {
  const samples = Math.max(520, Math.min(900, resolution * 12))
  const raw = buildRarefactionArcSegments(
    anchorPoint,
    params,
    view,
    samples,
    speedModeFromOrientation(orientation),
    { enforceMonotonicity: options.enforceRarefactionMonotonicity !== false },
  )

  const candidates = []
  for (const rawSegment of raw ?? []) {
    const segment = options.clipToCharacteristicSide === false
      ? rawSegment
      : clipRarefactionToCharacteristicSide(rawSegment, branch)
    if (!Array.isArray(segment) || segment.length < 2) continue

    let previousResidual = slowInflectionResidual(segment[0], params)
    for (let i = 1; i < segment.length; i += 1) {
      const nextResidual = slowInflectionResidual(segment[i], params)
      if (
        finite(previousResidual) &&
        finite(nextResidual) &&
        (previousResidual === 0 || nextResidual === 0 || previousResidual * nextResidual <= 0)
      ) {
        const crossing = interpolateRarefactionInflectionCrossing(
          segment[i - 1],
          segment[i],
          params,
        ) ?? segment[i]
        const trimmed = segment.slice(0, i).map((point) => ({ ...point }))
        trimmed.push({
          ...crossing,
          speed: Number.isFinite(crossing?.speed)
            ? crossing.speed
            : segment[i]?.speed,
        })
        if (trimmed.length >= 2) candidates.push(trimmed)
        break
      }
      previousResidual = nextResidual
    }
  }

  // A coarse sampled leaf can miss a narrow crossing. Do not replace J by a
  // merely nearby point: integrate both intrinsic z-directions and accept only
  // a trajectory that actually brackets and refines a zero of S^-.
  if (!candidates.length) {
    const integrated = []
    for (const sign of [1, -1]) {
      const candidate = traceNonlocalRarefactionSide(
        anchorPoint,
        params,
        view,
        Math.max(resolution, 90),
        sign,
        { stopAtInflection: true },
      )
      if (!candidate?.hitInflection || !Array.isArray(candidate.segment) || candidate.segment.length < 2) continue
      if (!pointOnCharacteristicSide(candidate.endPoint, branch)) continue
      const orientationMatches = orientation === SPEED_DECREASES
        ? candidate.speedDelta <= 1e-8
        : candidate.speedDelta >= -1e-8
      if (!orientationMatches) continue
      const endResidual = slowInflectionResidual(candidate.endPoint, params)
      if (!finite(endResidual) || Math.abs(endResidual) > 1e-8) continue
      integrated.push(candidate)
    }
    integrated.sort((a, b) => a.length - b.length)
    if (integrated.length) return [integrated[0].segment]
    return []
  }
  candidates.sort((a, b) => scaledSegmentLength(a, view) - scaledSegmentLength(b, view))
  return [candidates[0]]
}


export function buildSolutionRarefactionToSlowInflectionSegments(
  anchorPoint, params, view, resolution, orientation, branch = 'slow', options = {},
) {
  return buildSolutionRarefactionToInflectionSegments(
    anchorPoint, params, view, resolution, orientation, branch, options,
  )
}

export function buildSolutionRarefactionToFastInflectionSegments(
  anchorPoint, params, view, resolution, orientation, branch = 'fast', options = {},
) {
  return buildSolutionRarefactionToInflectionSegments(
    anchorPoint, params, view, resolution, orientation, branch, options,
  )
}


export function finite(value) {
  return Number.isFinite(value)
}

export function rk4RarefactionStep(z, t, h, params) {
  const k1 = rarefactionDerivativeDtDz(z, t, params)
  const k2 = rarefactionDerivativeDtDz(z + 0.5 * h, t + 0.5 * h * k1, params)
  const k3 = rarefactionDerivativeDtDz(z + 0.5 * h, t + 0.5 * h * k2, params)
  const k4 = rarefactionDerivativeDtDz(z + h, t + h * k3, params)
  if (![k1, k2, k3, k4].every(finite)) return null
  const nextT = t + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
  return finite(nextT) ? nextT : null
}

export function slowInflectionPointAtZ(z, params) {
  const tCoeff = sonicLineTCoeff(z, params)
  const cTerm = sonicLineConst(z, params)
  if (!finite(tCoeff) || !finite(cTerm) || Math.abs(tCoeff) < 1e-11) return null
  const t = -cTerm / tCoeff
  if (!finite(t)) return null
  return { t, Y: 0, z, coords: [t, 0, z] }
}

export function slowInflectionResidual(point, params) {
  const coords = coordsOf(point)
  if (!coords) return Number.NaN
  // On the characteristic plane Y=0, J_- is the zero set of S^-.
  // Evaluate the implicit equation directly instead of dividing by its
  // t-coefficient; the quotient has poles that can mimic sign changes.
  return sonicLeftImplicitF(0, coords[0], coords[2], params)
}

export function interpolateRarefactionInflectionCrossing(a, b, params) {
  const ca = coordsOf(a)
  const cb = coordsOf(b)
  if (!ca || !cb) return null
  let left = { t: ca[0], Y: 0, z: ca[2], coords: [ca[0], 0, ca[2]] }
  let right = { t: cb[0], Y: 0, z: cb[2], coords: [cb[0], 0, cb[2]] }
  let fLeft = slowInflectionResidual(left, params)
  let fRight = slowInflectionResidual(right, params)
  if (!finite(fLeft) || !finite(fRight) || fLeft * fRight > 0) return null

  // Refine the zero of the implicit sonic equation along the actual sampled
  // rarefaction edge.  The returned point therefore belongs simultaneously
  // to the displayed polyline and, up to the bisection tolerance, to J_-.
  for (let i = 0; i < 44; i += 1) {
    const midCoords = [
      0.5 * (left.t + right.t),
      0,
      0.5 * (left.z + right.z),
    ]
    const mid = { t: midCoords[0], Y: 0, z: midCoords[2], coords: midCoords }
    const fMid = slowInflectionResidual(mid, params)
    if (!finite(fMid)) return null
    if (Math.abs(fMid) < 1e-11) return mid
    if (fLeft * fMid <= 0) {
      right = mid
      fRight = fMid
    } else {
      left = mid
      fLeft = fMid
    }
  }

  const coords = [
    0.5 * (left.t + right.t),
    0,
    0.5 * (left.z + right.z),
  ]
  return { t: coords[0], Y: 0, z: coords[2], coords }
}


export function pointInRarefactionCalcView(point, view, tMargin = 2.4, zMargin = 1.4) {
  const coords = coordsOf(point)
  if (!coords || !view) return false
  const tSpan = Math.max(1, view.tMax - view.tMin)
  const zSpan = Math.max(1, view.zMax - view.zMin)
  return coords[0] >= view.tMin - tMargin * tSpan
    && coords[0] <= view.tMax + tMargin * tSpan
    && coords[2] >= view.zMin - zMargin * zSpan
    && coords[2] <= view.zMax + zMargin * zSpan
}

export function traceNonlocalRarefactionSide(anchorPoint, params, view, resolution, sign, options = {}) {
  const start = pointObjectFromCoords(anchorPoint)
  if (!start) return null
  const zSpan = Math.max(1, (view?.zMax ?? start.z + 1) - (view?.zMin ?? start.z - 1))
  const zEnd = sign > 0 ? (view.zMax + 1.35 * zSpan) : (view.zMin - 1.35 * zSpan)
  const total = Math.abs(zEnd - start.z)
  if (total <= 1e-10) return null

  const steps = Math.max(1400, Math.min(9000, resolution * 42))
  const h = sign * total / steps
  const maxJumpT = 0.22 * Math.max(1, view.tMax - view.tMin)
  const minTravelBeforeStop = 0.004
  const stopAtInflection = options.stopAtInflection !== false
  const out = [start.coords]
  let previous = start
  let previousResidual = slowInflectionResidual(previous, params)
  let travelled = 0
  let hitInflection = false

  for (let i = 1; i <= steps; i += 1) {
    const nextZ = previous.z + h
    const nextT = rk4RarefactionStep(previous.z, previous.t, h, params)
    if (!finite(nextT) || !finite(nextZ)) break
    if (Math.abs(nextT - previous.t) > maxJumpT) break

    const next = { t: nextT, Y: 0, z: nextZ, coords: [nextT, 0, nextZ] }
    if (!pointInRarefactionCalcView(next, view)) break

    const edgeLength = normalizedDistance3(previous, next, view)
    const nextTravelled = travelled + edgeLength
    const nextResidual = slowInflectionResidual(next, params)

    if (
      stopAtInflection &&
      nextTravelled >= minTravelBeforeStop &&
      finite(previousResidual) &&
      finite(nextResidual) &&
      (previousResidual === 0 || nextResidual === 0 || previousResidual * nextResidual <= 0)
    ) {
      const crossing = interpolateRarefactionInflectionCrossing(previous, next, params) ?? next
      out.push(crossing.coords)
      travelled = nextTravelled
      hitInflection = true
      break
    }

    out.push(next.coords)
    travelled = nextTravelled
    previous = next
    previousResidual = nextResidual
  }

  if (out.length < 2 || scaledSegmentLength(out, view) < 0.001) return null
  const startSpeed = pointSpeed(start, params)
  const endPoint = pointObjectFromCoords(out[out.length - 1])
  const endSpeed = pointSpeed(endPoint, params)
  return {
    segment: out,
    hitInflection,
    length: scaledSegmentLength(out, view),
    speedDelta: finite(startSpeed) && finite(endSpeed) ? endSpeed - startSpeed : 0,
    endPoint,
  }
}


export function nonlocalSecondChainAdaptiveSettings(anchorPoint, inflectionPoint, view, baseResolution) {
  const anchor = coordsOf(anchorPoint)
  const inflection = coordsOf(inflectionPoint)
  const base = Math.max(90, baseResolution ?? 90)
  if (!anchor || !inflection || !view) {
    return {
      view: expandViewZForIntersections(view, 0.35),
      resolution: base,
      distanceToInflection: Number.POSITIVE_INFINITY,
      minRarefactionLength: 0.0015,
      minCompositeLength: 0.0015,
    }
  }

  // Perto da inflexao a segunda cadeia fica mal condicionada. Em vez de
  // descartar a cadeia, refinamos a construcao: janela maior, mais pontos na
  // rarefacao, mais pontos na composta e tolerancias de comprimento menores.
  // O fator cresce continuamente quando P2 = H_+ cap C_s se aproxima de J.
  const distanceToInflection = normalizedDistance3(anchor, inflection, view)
  const nearScale = Number.isFinite(distanceToInflection)
    ? Math.max(0, Math.min(1, (0.09 - distanceToInflection) / 0.09))
    : 0
  const resolutionMultiplier = 1 + 2.4 * nearScale
  const resolution = Math.max(base, Math.min(280, Math.round(base * resolutionMultiplier)))
  const margin = 0.35 + 0.35 * nearScale
  return {
    view: expandViewZForIntersections(view, margin),
    resolution,
    distanceToInflection,
    minRarefactionLength: 0.001 + 0.002 * (1 - nearScale),
    minCompositeLength: 0.001 + 0.002 * (1 - nearScale),
  }
}

export function totalSegmentsLength(segments, view) {
  return (segments ?? []).reduce((sum, segment) => sum + scaledSegmentLength(segment, view), 0)
}

export function buildNonlocalRarefactionCurveData(anchorPoint, endpointPoint, params, view, resolution, branch = 'slow') {
  const anchor = pointObjectFromCoords(anchorPoint)
  if (!anchor || !params || !view) {
    return { curveSegments: [], arcSegments: [], arcEnd: null, arcCandidate: null, candidates: [] }
  }

  // Authoritative nonlocal rarefaction construction.
  // Build the rarefaction leaf once, then extract R_nloc and its endpoint J
  // from those exact sampled segments. This prevents the displayed arc, the
  // inflection endpoint and the composite generator from coming from different
  // integrations/discretizations.
  const orientation = branch === 'fast' ? SPEED_DECREASES : SPEED_INCREASES
  const samples = Math.max(520, Math.min(900, resolution * 12))
  const rawLeaf = buildRarefactionArcSegments(
    anchor,
    params,
    view,
    samples,
    speedModeFromOrientation(orientation),
    { enforceMonotonicity: true },
  )

  const curveSegments = (rawLeaf ?? [])
    .map((segment) => clipRarefactionToCharacteristicSide(segment, branch))
    .filter((segment) => Array.isArray(segment) && segment.length >= 2)

  const arcCandidates = []
  for (const segment of curveSegments) {
    let previousResidual = slowInflectionResidual(segment[0], params)
    for (let i = 1; i < segment.length; i += 1) {
      const nextResidual = slowInflectionResidual(segment[i], params)
      if (
        finite(previousResidual) &&
        finite(nextResidual) &&
        (previousResidual === 0 || nextResidual === 0 || previousResidual * nextResidual <= 0)
      ) {
        const crossing = interpolateRarefactionInflectionCrossing(
          segment[i - 1],
          segment[i],
          params,
        ) ?? pointObjectFromCoords(segment[i])
        if (!crossing) break
        const arc = segment.slice(0, i).map((point) => ({ ...point }))
        arc.push({
          ...crossing,
          speed: Number.isFinite(crossing?.speed) ? crossing.speed : segment[i]?.speed,
        })
        if (arc.length >= 2) {
          arcCandidates.push({
            segment: arc,
            hitInflection: true,
            endPoint: crossing,
            length: scaledSegmentLength(arc, view),
          })
        }
        break
      }
      previousResidual = nextResidual
    }
  }

  // The nonlocal chain uses the first inflection reached from its anchor.  With
  // both integration directions present, this is the shortest valid subarc.
  arcCandidates.sort((a, b) => a.length - b.length)
  const arcCandidate = arcCandidates[0] ?? null
  const arcSegments = arcCandidate ? [arcCandidate.segment] : []
  const arcEnd = arcCandidate?.endPoint ?? null

  // endpointPoint remains diagnostic only; it is never used to move or replace
  // J.  J is the refined zero found on the authoritative rarefaction polyline.
  const referenceEndpoint = pointObjectFromCoords(endpointPoint)
  const endpointDistance = arcEnd && referenceEndpoint
    ? normalizedDistance3(arcEnd, referenceEndpoint, view)
    : Number.POSITIVE_INFINITY
  const normalizedCandidate = arcCandidate
    ? { ...arcCandidate, endpointDistance }
    : null

  return {
    curveSegments,
    arcSegments,
    arcEnd,
    arcCandidate: normalizedCandidate,
    candidates: normalizedCandidate ? [normalizedCandidate] : [],
  }
}
