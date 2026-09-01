import { computeCompositeSlowInflectionPoint } from '../../../../components/curves/compositeInflectionUtils.js'
import { SPEED_DECREASES } from '../../../waves/orientation.js'
import { FORWARD_HUGONIOT, BACKWARD_HUGONIOT } from '../../../hugoniot/directions.js'
import { computeRightStateFromWavePoint, solveDoubleSonicSegments } from '../../../surfaceImplicit/index.js'
import {
  enforcePipelineOrientationFromAnchor,
  coordsOf,
  pointObjectFromCoords,
  relevantStateForPoint,
  makeArc,
  hasUsableSegments,
  uniqueAnchors,
} from '../../internal/pipelineShared.js'
import {
  initialAnchorsFromSegments,
  expandViewZForIntersections,
  terminalAnchorFromFirstSegment,
  trimSegmentsToPoint,
  normalizedDistance3,
  buildHugoniotSegmentsFromFixedLeafStart,
  firstHugoniotIntersectionOnComposite,
  buildSolutionRarefactionSegments,
  buildSolutionRarefactionToSlowInflectionSegments,
  buildHPlusSegmentFromSonicToCs,
  buildHPlusSegmentToFixedHMinusIntersection,
  nonlocalSecondChainAdaptiveSettings,
  totalSegmentsLength,
  trimSegmentsToFirstSonic,
  buildGlobalCompositeIntersectionFromRarefactionCurve,
  buildFirstIntersectionCompositeFromRarefactionArc,
  anchorCompositeContinuationAtInflection,
  extractOrientedCompositeArcFromFullCurve,
} from '../../internal/pipelineGeometry.js'
import { extractCompositeSubarcBetweenPoints, closestProjectionOnPolyline } from '../../internal/compositeSubarc.js'
import {
  SOLUTION_ARC_LOCAL,
  SOLUTION_ARC_NONLOCAL,
  SLOW_H_ORIENTATION,
  SLOW_R_ORIENTATION,
  SLOW_K_ORIENTATION,
  buildEmptyBranchPipeline,
  diagnosticsFromPieces,
} from './shared.js'


function normalizedPointDistance(a, b, view) {
  const ca = coordsOf(a)
  const cb = coordsOf(b)
  if (!ca || !cb) return Number.POSITIVE_INFINITY
  const tScale = Math.max(1e-6, Math.abs((view?.tMax ?? 1) - (view?.tMin ?? 0)))
  const yScale = Math.max(1e-6, Math.abs((view?.yMax ?? 1) - (view?.yMin ?? 0)))
  const zScale = Math.max(1e-6, Math.abs((view?.zMax ?? 1) - (view?.zMin ?? 0)))
  return Math.hypot((ca[0] - cb[0]) / tScale, (ca[1] - cb[1]) / yScale, (ca[2] - cb[2]) / zScale)
}

function pointsCoincideForPipeline(a, b, view, tolerance = 0.035) {
  return normalizedPointDistance(a, b, view) <= tolerance
}

function extractGlobalCompositeSideMatchingReference(rawSegments, anchorPoint, referenceSegments, view) {
  const anchor = coordsOf(anchorPoint)
  const reference = (referenceSegments ?? [])
    .flatMap((segment) => (segment ?? []).map(coordsOf).filter(Boolean))
    .find((point) => normalizedPointDistance(point, anchor, view) > 0.008)
  if (!anchor || !reference) return []

  const scales = [
    Math.max(1e-6, Math.abs(view.tMax - view.tMin)),
    Math.max(1e-6, Math.abs(view.yMax - view.yMin)),
    Math.max(1e-6, Math.abs(view.zMax - view.zMin)),
  ]
  const unitVector = (from, to) => {
    const vector = from.map((value, index) => (to[index] - value) / scales[index])
    const length = Math.hypot(...vector)
    return length > 1e-10 ? vector.map((value) => value / length) : null
  }
  const referenceDirection = unitVector(anchor, reference)
  if (!referenceDirection) return []

  let best = null
  for (const rawSegment of rawSegments ?? []) {
    const segment = (rawSegment ?? []).map(coordsOf).filter(Boolean)
    if (segment.length < 2) continue
    const projection = closestProjectionOnPolyline(segment, anchor, view)
    if (!projection?.fastPoint || Math.sqrt(projection.d2) > 0.075) continue
    const projectedAnchor = anchor
    const sides = [
      [projectedAnchor, ...segment.slice(projection.index + 1)],
      [projectedAnchor, ...segment.slice(0, projection.index + 1).reverse()],
    ]
    for (const side of sides) {
      const probe = side.find((point) => normalizedPointDistance(point, projectedAnchor, view) > 0.008)
        ?? side[side.length - 1]
      const direction = unitVector(projectedAnchor, probe)
      if (!direction || side.length < 2) continue
      const alignment = direction.reduce((sum, value, index) => sum + value * referenceDirection[index], 0)
      const score = alignment - Math.sqrt(projection.d2)
      if (!best || score > best.score) best = { side, score, alignment }
    }
  }
  return best?.alignment > 0 ? [best.side] : []
}



function dedupeShockPairsByStart(pairs, view, tolerance = 0.018) {
  const out = []
  for (const pair of pairs ?? []) {
    const startCoords = coordsOf(pair?.start)
    if (!startCoords) continue
    const duplicateIndex = out.findIndex((existing) => {
      const existingCoords = coordsOf(existing?.start)
      return existingCoords && normalizedDistance3(startCoords, existingCoords, view) <= tolerance
    })
    if (duplicateIndex < 0) {
      out.push(pair)
      continue
    }
    const currentLength = totalSegmentsLength(pair?.segments ?? [], view)
    const existingLength = totalSegmentsLength(out[duplicateIndex]?.segments ?? [], view)
    if (currentLength > existingLength) out[duplicateIndex] = pair
  }
  return out
}

function doubleSonicLineData(params, view) {
  return (solveDoubleSonicSegments(params, view) ?? [])
    .map((segment) => {
      const p = coordsOf(segment?.[0])
      return p ? { t: p[0], z: p[2] } : null
    })
    .filter(Boolean)
}

function normalizedDistanceToDoubleSonicLine(point, line, view) {
  const p = coordsOf(point)
  if (!p || !line) return Number.POSITIVE_INFINITY
  const tScale = Math.max(1e-6, Math.abs((view?.tMax ?? 1) - (view?.tMin ?? 0)))
  const zScale = Math.max(1e-6, Math.abs((view?.zMax ?? 1) - (view?.zMin ?? 0)))
  return Math.hypot((p[0] - line.t) / tScale, (p[2] - line.z) / zScale)
}

function interpolateCoords(a, b, alpha) {
  const q = Math.max(0, Math.min(1, alpha))
  return [
    a[0] + q * (b[0] - a[0]),
    a[1] + q * (b[1] - a[1]),
    a[2] + q * (b[2] - a[2]),
  ]
}

function refineClosestPointOnStep(a, b, distanceFn) {
  let left = 0
  let right = 1
  for (let iter = 0; iter < 32; iter += 1) {
    const m1 = left + (right - left) / 3
    const m2 = right - (right - left) / 3
    if (distanceFn(interpolateCoords(a, b, m1)) < distanceFn(interpolateCoords(a, b, m2))) right = m2
    else left = m1
  }
  const alpha = (left + right) / 2
  return { point: interpolateCoords(a, b, alpha), alpha }
}

function firstStopOnCompositeStep(previous, next, { view, doubleSonicLines }) {
  const doubleSonicTol = 0.010
  const candidates = []

  for (const line of doubleSonicLines ?? []) {
    const closest = refineClosestPointOnStep(
      previous,
      next,
      (point) => normalizedDistanceToDoubleSonicLine(point, line, view),
    )
    const distance = normalizedDistanceToDoubleSonicLine(closest.point, line, view)
    if (distance <= doubleSonicTol) {
      // The tolerance only detects which polyline step contains the contact.
      // The authoritative endpoint belongs exactly to the vertical double-
      // sonic line; retain Y from the refined composite interpolation.
      const point = [line.t, closest.point[1], line.z]
      candidates.push({ kind: 'doubleSonic', point, distance, alpha: closest.alpha })
    }
  }

  return candidates.sort((a, b) => a.alpha - b.alpha || a.distance - b.distance)[0] ?? null
}

function trimOrderedCompositeToFirstStop({ segments, startPoint, params, view }) {
  const startTarget = coordsOf(startPoint)
  if (!startTarget || !params || !view) {
    return { segments: [], stopPoint: null, leafPoint: null, stopKind: null }
  }
  const doubleSonicLines = doubleSonicLineData(params, view)
  for (const rawSegment of segments ?? []) {
    const segment = (rawSegment ?? []).map(coordsOf).filter(Boolean)
    if (segment.length < 2) continue
    const start = closestProjectionOnPolyline(segment, startTarget, view)
    if (!start?.fastPoint) continue
    const out = [start.fastPoint.coords]
    let previous = start.fastPoint.coords
    // The first-intersection composite is already ordered from J outward.
    // There is no second side and no composite-speed orientation test here.
    for (let index = start.index + 1; index < segment.length; index += 1) {
      const next = segment[index]
      const stop = firstStopOnCompositeStep(previous, next, {
        view,
        doubleSonicLines,
      })
      if (stop?.point) {
        out.push(stop.point)
        return {
          segments: out.length >= 2 ? [out] : [],
          stopPoint: stop.point,
          leafPoint: stop.leafPoint ?? null,
          stopKind: stop.kind ?? null,
        }
      }
      if (normalizedDistance3(next, out[out.length - 1], view) > 1e-12) out.push(next)
      previous = next
    }
    if (out.length >= 2) {
      return {
        segments: [out],
        stopPoint: out[out.length - 1],
        leafPoint: null,
        stopKind: null,
      }
    }
  }
  return { segments: [], stopPoint: null, leafPoint: null, stopKind: null }
}

function pointInsideDisplayRarefactionView(point, view) {
  const coords = Array.isArray(point?.coords) ? point.coords : Array.isArray(point) ? point : null
  const z = coords?.[2] ?? point?.z
  return Number.isFinite(z) && z >= view.zMin && z <= view.zMax
}

function clipRarefactionCurveToDisplayView(segments, displayView) {
  if (!displayView) return segments ?? []
  const clipped = []
  for (const segment of segments ?? []) {
    let current = []
    for (const point of segment ?? []) {
      if (pointInsideDisplayRarefactionView(point, displayView)) {
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

export function buildSlowPipeline({ entry, params, view, resolution }) {
  if (!entry?.state || !entry?.seed) return buildEmptyBranchPipeline('slow')
  const direction = FORWARD_HUGONIOT
  const firstChainNonlocalShockOrientation = SPEED_DECREASES
  const secondChainNonlocalShockOrientation = SPEED_DECREASES

  // Classical local chain: saturate only the restricted local rarefaction arc
  //   K_- = Sat_{H_-}(R_loc) cap S^-.
  // Each composite point therefore comes from a Hugoniot leaf whose generator
  // belongs to the displayed R_loc; no continuation beyond J_- is involved.
  const localCompositeCalcView = expandViewZForIntersections(view, 0.35)
  let localRarefactionSegments = enforcePipelineOrientationFromAnchor(
    buildSolutionRarefactionToSlowInflectionSegments(
      entry.seed,
      params,
      localCompositeCalcView,
      Math.max(resolution, 90),
      SLOW_R_ORIENTATION,
      'slow',
    ),
    entry.seed,
    params,
    localCompositeCalcView,
    SLOW_R_ORIENTATION,
  )
  let localInflectionPoint = terminalAnchorFromFirstSegment(localRarefactionSegments) ?? null

  // buildSolutionRarefactionToSlowInflectionSegments already performs a
  // refined integration fallback. Never substitute a merely nearby sampled
  // point for J_-: the displayed endpoint must satisfy the implicit equation.
  const localRarefactionEndpointPoint = terminalAnchorFromFirstSegment(localRarefactionSegments)
    ?? localInflectionPoint
    ?? null
  const localCompositeSourceRarefactionSegments = localRarefactionSegments
    .map((segment) => segment.map(pointObjectFromCoords).filter(Boolean))
    .filter((segment) => segment.length >= 2)
  const globalLocalCompositeSegments = buildGlobalCompositeIntersectionFromRarefactionCurve(
    localCompositeSourceRarefactionSegments,
    entry.seed,
    params,
    localCompositeCalcView,
    direction,
    'left',
    'slow',
  )
  // Build K_loc in its intrinsic direction: traverse the restricted
  // rarefaction from J_- back toward U_L and, for every generator, keep the
  // first S^- intersection reached along the oriented H_- leaf. This removes
  // the two-sided ambiguity of the global implicit component.
  const leafOrderedLocalComposite = buildFirstIntersectionCompositeFromRarefactionArc(
    localCompositeSourceRarefactionSegments,
    params,
    localCompositeCalcView,
    direction,
    'left',
    'slow',
  )
  const anchoredLeafOrderedLocalComposite = anchorCompositeContinuationAtInflection(
    leafOrderedLocalComposite,
    localRarefactionEndpointPoint ?? localInflectionPoint,
    localCompositeCalcView,
  )
  const matchingGlobalLocalComposite = extractGlobalCompositeSideMatchingReference(
    globalLocalCompositeSegments,
    localRarefactionEndpointPoint ?? localInflectionPoint,
    anchoredLeafOrderedLocalComposite,
    localCompositeCalcView,
  )
  // Use the full global component only after its side has been selected from
  // the intrinsic leaf-by-leaf direction. It can then reach H_-(U_L) even
  // when the finite generator sampling ends slightly before the intersection.
  let orientedRawLocalCompositeSegments = hasUsableSegments(matchingGlobalLocalComposite)
    ? matchingGlobalLocalComposite
    : anchoredLeafOrderedLocalComposite
  // Marching a leaf can become numerically singular in isolated parameter
  // configurations. Only then recover the component from the global curve.
  if (!hasUsableSegments(orientedRawLocalCompositeSegments)) {
    orientedRawLocalCompositeSegments = extractOrientedCompositeArcFromFullCurve(
      globalLocalCompositeSegments,
      localRarefactionEndpointPoint ?? localInflectionPoint,
      params,
      localCompositeCalcView,
      SLOW_K_ORIENTATION,
    )
  }
  const localCompositeHugoniotIntersection = firstHugoniotIntersectionOnComposite({
    compositeSegments: orientedRawLocalCompositeSegments,
    fixedState: entry.state,
    params,
    view,
    direction,
    sonicTarget: 'left',
  })
  // The first chain has two possible terminal events for K_loc. First trim at
  // H_-(U_L), when that intersection exists, and then search that ordered
  // prefix for the double-composite locus. Therefore a double-composite hit
  // can suppress the nonlocal shock only when it is reached before H_-(U_L).
  const localCompositeThroughHugoniot = localCompositeHugoniotIntersection?.point
    ? trimSegmentsToPoint(orientedRawLocalCompositeSegments, localCompositeHugoniotIntersection.point, view, { preserveTarget: true })
    : orientedRawLocalCompositeSegments
  const localCompositeDoubleStop = trimOrderedCompositeToFirstStop({
    segments: localCompositeThroughHugoniot,
    startPoint: localRarefactionEndpointPoint ?? localInflectionPoint,
    params,
    view: localCompositeCalcView,
  })
  const localCompositeEndsAtDoubleSonic = localCompositeDoubleStop.stopKind === 'doubleSonic'
  const localCompositeIntersection = localCompositeEndsAtDoubleSonic ? null : localCompositeHugoniotIntersection
  const localCompositeStopPoint = localCompositeEndsAtDoubleSonic
    ? localCompositeDoubleStop.stopPoint
    : localCompositeHugoniotIntersection?.point ?? null
  const provisionalLocalCompositeSegments = localCompositeEndsAtDoubleSonic
    ? localCompositeDoubleStop.segments
    : localCompositeThroughHugoniot
  // K_loc is already anchored and oriented from J_-. Do not re-filter it here.
  const compositeStart = initialAnchorsFromSegments(provisionalLocalCompositeSegments)[0]
    ?? localRarefactionEndpointPoint
    ?? null
  // The condition for drawing A_loc(K_-) is evaluated later from the
  // actual endpoint of the local rarefaction arc, not from the already-built
  // composite anchor.  Using the composite anchor here can make A_loc(K_-)
  // appear in configurations where R_loc does not actually end at J_-.

  // Shock-first slow branch:
  // A_loc(H_-) leaves the clicked point and must be truncated at S^+.
  const rawLocalShockSegments = buildHugoniotSegmentsFromFixedLeafStart({
    fixedState: entry.state,
    startPoint: entry.seed,
    params,
    view,
    resolution,
    direction,
    orientation: SLOW_H_ORIENTATION,
  })
  const localShockSonic = trimSegmentsToFirstSonic(rawLocalShockSegments, params, view, 'right', 'any', entry.seed)
  const localShockSegments = enforcePipelineOrientationFromAnchor(localShockSonic.segments, entry.seed, params, view, SLOW_H_ORIENTATION)
  const localShockSonicPoint = localShockSonic.sonicPoint ?? null
  const localShockSonicBranch = localShockSonic.sonicBranch ?? null

  // If A_loc(H_-) first hits S_f^+, it stops there. Only S_s^+ starts H_+.
  // The auxiliary H_+ segment is followed only until C_s.
  const hPlusStartPoint = localShockSonicBranch === 'slow' ? localShockSonicPoint : null
  const hPlusProjectionSegments = hPlusStartPoint
    ? buildHPlusSegmentFromSonicToCs(hPlusStartPoint, params, expandViewZForIntersections(view), resolution)
    : []
  const projectedRarefactionAnchors = uniqueAnchors([
    terminalAnchorFromFirstSegment(hPlusProjectionSegments),
  ].filter(Boolean))
  const hPlusCsPoint = projectedRarefactionAnchors[0] ?? null

  // Second chain: use exactly the same geometric construction as the local
  // rarefaction/composite pair.  The only difference is the rarefaction seed:
  // P2 = H_+ cap C_s instead of the clicked state U_L.
  //
  // For each P2:
  //   1. build R_-(P2) and refine its first intersection J_nloc with S^-;
  //   2. build the complete K_-(P2) = Sat_{H_-}(R_-(P2)) cap S^-;
  //   3. select the component of K_-(P2) through that same J_nloc;
  //   4. trim only at the double-sonic admissibility boundary, when present;
  //   5. continue from endpoint(K_nloc) along H_+ until H_-(U_L).
  const baseNonlocalChainCalcView = expandViewZForIntersections(view, 0.35)
  const baseNonlocalChainResolution = Math.max(resolution, 90)
  const nonlocalChainPairs = projectedRarefactionAnchors.map((anchor) => {
    let estimatedInflection = computeCompositeSlowInflectionPoint(
      anchor,
      params,
      baseNonlocalChainCalcView,
      baseNonlocalChainResolution,
    ) ?? null
    const adaptive = nonlocalSecondChainAdaptiveSettings(
      anchor,
      estimatedInflection,
      view,
      baseNonlocalChainResolution,
    )
    const nonlocalChainCalcView = adaptive.view
    const nonlocalChainResolution = adaptive.resolution

    // Same rarefaction construction used by the local chain, with `anchor`
    // replacing entry.seed.
    let rarefactionSegments = enforcePipelineOrientationFromAnchor(
      buildSolutionRarefactionToSlowInflectionSegments(
        anchor,
        params,
        nonlocalChainCalcView,
        nonlocalChainResolution,
        SLOW_R_ORIENTATION,
        'slow',
      ),
      anchor,
      params,
      nonlocalChainCalcView,
      SLOW_R_ORIENTATION,
    )
    let sampledRarefactionEnd = terminalAnchorFromFirstSegment(rarefactionSegments) ?? null

    // Same fallback used by the local chain for degenerate samplings.  The
    // computed point is only a target for rebuilding the rarefaction; it is
    // not accepted as J_nloc unless it becomes the actual terminal point of
    // the rebuilt nonlocal rarefaction arc.
    if (!sampledRarefactionEnd) {
      const fallbackInflectionTarget = computeCompositeSlowInflectionPoint(
        anchor,
        params,
        nonlocalChainCalcView,
        nonlocalChainResolution,
      ) ?? estimatedInflection
      rarefactionSegments = enforcePipelineOrientationFromAnchor(
        buildSolutionRarefactionSegments(
          anchor,
          params,
          nonlocalChainCalcView,
          nonlocalChainResolution,
          SLOW_R_ORIENTATION,
          fallbackInflectionTarget,
          'slow',
        ),
        anchor,
        params,
        nonlocalChainCalcView,
        SLOW_R_ORIENTATION,
      )
      sampledRarefactionEnd = terminalAnchorFromFirstSegment(rarefactionSegments) ?? null
    }

    // By definition, the inflection point J_nloc used to select K_nloc is
    // exactly the final point of the nonlocal rarefaction arc.
    const rarefactionEnd = sampledRarefactionEnd
    const inflectionPoint = rarefactionEnd

    // Build K_nloc from the *same sampled nonlocal rarefaction* P2 -> J_nloc.
    // Rebuilding the global composite from P2 and then choosing a nearby
    // component can select a different branch of Sat_{H_-}(R_-(P2)) cap S^-;
    // visually this produces a chord/auxiliary arc that is not contained in
    // the displayed nonlocal composite curve.  Saturate the exact R_nloc
    // polyline and restrict the resulting composite through the same J_nloc.
    const compositeSourceRarefactionSegments = rarefactionSegments
      .map((segment) => segment.map(pointObjectFromCoords).filter(Boolean))
      .filter((segment) => segment.length >= 2)

    // Keep two distinct geometric objects:
    //   (a) the complete nonlocal composite curve generated by the exact
    //       displayed R_nloc; and
    //   (b) the admissible arc extracted from that complete curve at J_nloc.
    // The previous implementation stored the restricted arc as the
    // "involved composite curve".  When the restriction became empty, both
    // the diagnostic curve and A_nloc(K_-) disappeared from rendering.
    let completeNonlocalCompositeSegments = rarefactionEnd
      ? buildGlobalCompositeIntersectionFromRarefactionCurve(
        compositeSourceRarefactionSegments,
        anchor,
        params,
        nonlocalChainCalcView,
        direction,
        'left',
        'slow',
      )
      : []

    // The authoritative nonlocal arc follows the generator order explicitly:
    // u=1 at J_nloc down to u=0 at P2. This avoids choosing the opposite side
    // after drawable-geometry conversion has discarded compositeU metadata.
    const leafContinuation = buildFirstIntersectionCompositeFromRarefactionArc(
      compositeSourceRarefactionSegments,
      params,
      nonlocalChainCalcView,
      direction,
      'left',
      'slow',
    )
    let globalNonlocalCompositeSegments = anchorCompositeContinuationAtInflection(
      leafContinuation,
      rarefactionEnd,
      nonlocalChainCalcView,
    )

    // Marching-squares extraction is retained only as a numerical fallback.
    // It is still restricted to the saturation of the exact R_nloc arc.
    if (rarefactionEnd && !hasUsableSegments(globalNonlocalCompositeSegments)) {
      globalNonlocalCompositeSegments = extractOrientedCompositeArcFromFullCurve(
        completeNonlocalCompositeSegments,
        rarefactionEnd,
        params,
        nonlocalChainCalcView,
        SLOW_K_ORIENTATION,
      )
    }
    const compositeSegmentsFromInflection = globalNonlocalCompositeSegments
    const nonlocalCompositeStart = rarefactionEnd

    const compositeStop = trimOrderedCompositeToFirstStop({
      segments: compositeSegmentsFromInflection,
      startPoint: nonlocalCompositeStart,
      params,
      view: nonlocalChainCalcView,
    })
    const trimmedCompositeSegments = compositeStop.segments
    const stopPoint = compositeStop.stopPoint ?? null

    return {
      anchor: nonlocalCompositeStart ?? anchor,
      compositeStart: nonlocalCompositeStart,
      rarefactionStart: anchor,
      hPlusCsPoint: anchor,
      nonlocalRarefactionStartPoint: anchor,
      rarefactionEnd,
      inflectionPoint,
      rarefactionSegments,
      rarefactionCurveSegments: rarefactionSegments,
      displayRarefactionCurveSegments: clipRarefactionCurveToDisplayView(
        rarefactionSegments,
        view,
      ),
      // Display only the connected component of K_nloc that contains J_nloc.
      // The full saturation may contain other disconnected branches that do
      // not intersect the inflection and therefore do not belong to K_nloc.
      involvedCompositeSegments: compositeSegmentsFromInflection,
      admissibleCompositeSegments: trimmedCompositeSegments,
      segments: trimmedCompositeSegments,
      stopPoint,
      source: 'localShockSlowSonicToHPlusToCs',
      adaptiveSettings: {
        distanceToInflection: adaptive.distanceToInflection,
        resolution: nonlocalChainResolution,
        minRarefactionLength: adaptive.minRarefactionLength,
        minCompositeLength: adaptive.minCompositeLength,
        compositeStopKind: compositeStop.stopKind ?? null,
        continuation: 'K_nloc -> H_+ -> H_-(U_L) -> H_nloc',
      },
    }
  })
  const trimmedNonlocalCompositePairs = nonlocalChainPairs.filter((item) => hasUsableSegments(item.segments))
  const nonlocalCompositeSegments = trimmedNonlocalCompositePairs.flatMap((item) => item.segments)

  const localCompositeShockPair = localCompositeIntersection?.leafPoint
    ? {
      anchor: entry.seed,
      fixedState: entry.state,
      start: localCompositeIntersection.leafPoint,
      sourceAnchor: localCompositeIntersection.point ?? localCompositeIntersection.leafPoint,
      source: 'localRarefactionCompositeHugoniotIntersection',
      segments: enforcePipelineOrientationFromAnchor(buildHugoniotSegmentsFromFixedLeafStart({
        fixedState: entry.state,
        startPoint: localCompositeIntersection.leafPoint,
        params,
        view,
        resolution,
        direction,
        orientation: firstChainNonlocalShockOrientation,
      }), localCompositeIntersection.leafPoint, params, view, firstChainNonlocalShockOrientation),
    }
    : null

  // Segunda cadeia after K_nloc:
  //   endpoint(K_nloc) -> H_+ (auxiliary, dashed) -> H_-(U_L)
  //   -> H_nloc.
  // K_nloc is never cut directly by H_-(U_L). The nonlocal shock must not
  // start at endpoint(K_nloc).
  // It starts at the refined intersection of the H_+ leaf through that
  // endpoint with the fixed leaf H_-(U_L).
  const postCompositeHPlusPairs = trimmedNonlocalCompositePairs.map((item) => {
    const compositeEndpoint = item.stopPoint
      ?? terminalAnchorFromFirstSegment(item.segments)
      ?? null
    const projection = compositeEndpoint
      ? buildHPlusSegmentToFixedHMinusIntersection({
        startPoint: compositeEndpoint,
        fixedLeftState: entry.state,
        params,
        view: expandViewZForIntersections(view, 0.35),
        resolution,
      })
      : { segments: [], intersectionPoint: null, hMinusLeafPoint: null, fixedRightState: null }
    return {
      sourceItem: item,
      compositeEndpoint,
      ...projection,
    }
  })

  const postCompositeHPlusSegments = postCompositeHPlusPairs.flatMap((item) => item.segments ?? [])
  const nonlocalCompositeShockPairs = postCompositeHPlusPairs
    .filter((item) => item.hMinusLeafPoint)
    .map((item) => ({
      anchor: entry.seed,
      fixedState: entry.state,
      start: item.hMinusLeafPoint,
      sourceAnchor: item.compositeEndpoint,
      source: 'postCompositeHPlusFixedHMinusIntersection',
      segments: enforcePipelineOrientationFromAnchor(buildHugoniotSegmentsFromFixedLeafStart({
        fixedState: entry.state,
        startPoint: item.hMinusLeafPoint,
        params,
        view,
        resolution,
        direction,
        orientation: secondChainNonlocalShockOrientation,
      }), item.hMinusLeafPoint, params, view, secondChainNonlocalShockOrientation),
    }))
  const usableLocalCompositeShockPairs = [localCompositeShockPair]
    .filter(Boolean)
    .filter((item) => hasUsableSegments(item.segments))
  const usableNonlocalCompositeShockPairs = dedupeShockPairsByStart(
    nonlocalCompositeShockPairs.filter((item) => hasUsableSegments(item.segments)),
    view,
  )
  const nonlocalShockFromLocalCompositeSegments = usableLocalCompositeShockPairs.flatMap((item) => item.segments)
  const nonlocalShockFromNonlocalCompositeSegments = usableNonlocalCompositeShockPairs.flatMap((item) => item.segments)

  // buildNonlocalRarefactionCurveData already selects and orders the exact
  // arc P2 -> J_nloc. Reapplying a pointwise orientation filter here can erase
  // a valid arc because of tiny numerical speed oscillations.
  const nonlocalRarefactionSegments = nonlocalChainPairs.flatMap(
    (item) => item.rarefactionSegments ?? [],
  )

  // Extract the actual local composite arc from the endpoint reached by R_loc
  // to the first H_-(U_-) intersection. This avoids relying on the arbitrary
  // orientation/start index returned by the global composite polyline.
  const extractedLocalCompositeSegments = localRarefactionEndpointPoint && localCompositeStopPoint
    ? extractCompositeSubarcBetweenPoints(
      orientedRawLocalCompositeSegments,
      localRarefactionEndpointPoint,
      localCompositeStopPoint,
      view,
      { preserveStopTarget: true },
    )
    : []
  const localCompositeSegments = hasUsableSegments(extractedLocalCompositeSegments)
    ? extractedLocalCompositeSegments
    : provisionalLocalCompositeSegments
  const localRarefactionEndpointIsInflection = pointsCoincideForPipeline(
    localRarefactionEndpointPoint,
    localInflectionPoint,
    expandViewZForIntersections(view, 0.35),
  )

  const localShockArc = makeArc({ branch: 'slow', family: 'shock', locality: SOLUTION_ARC_LOCAL, segments: localShockSegments, orientation: SLOW_H_ORIENTATION, sonicTarget: 'right', direction, stateRole: 'U_-', state: entry.state, anchor: entry.seed, metadata: { sonicPoint: localShockSonicPoint, sonicBranch: localShockSonicBranch }, params })
  const hPlusProjectionArc = makeArc({ branch: 'slow', family: 'shock', locality: SOLUTION_ARC_NONLOCAL, segments: hPlusProjectionSegments, orientation: null, sonicTarget: null, direction: BACKWARD_HUGONIOT, stateRole: 'U_+', state: hPlusStartPoint ? computeRightStateFromWavePoint(hPlusStartPoint.t, hPlusStartPoint.Y, hPlusStartPoint.z, params) : null, anchor: hPlusStartPoint, metadata: { role: 'HPlusProjectionToCs' }, params })
  const postCompositeHPlusArc = makeArc({ branch: 'slow', family: 'shock', locality: SOLUTION_ARC_NONLOCAL, segments: postCompositeHPlusSegments, orientation: null, sonicTarget: null, direction: BACKWARD_HUGONIOT, stateRole: 'U_+', state: postCompositeHPlusPairs[0]?.fixedRightState ?? null, anchor: postCompositeHPlusPairs[0]?.compositeEndpoint ?? null, metadata: { role: 'HPlusAfterNonlocalCompositeToHMinus', pairs: postCompositeHPlusPairs }, params })
  const nonlocalShockFromLocalCompositeArc = makeArc({ branch: 'slow', family: 'shock', locality: SOLUTION_ARC_NONLOCAL, segments: nonlocalShockFromLocalCompositeSegments, orientation: firstChainNonlocalShockOrientation, sonicTarget: null, direction, stateRole: 'U_-', state: usableLocalCompositeShockPairs[0]?.fixedState ?? null, anchor: usableLocalCompositeShockPairs[0]?.start ?? null, metadata: { chain: 'firstChain', starts: usableLocalCompositeShockPairs.map((item) => ({ anchor: item.start, fixedState: item.fixedState, sourceAnchor: item.sourceAnchor, source: item.source })) }, params })
  const nonlocalShockFromNonlocalCompositeArc = makeArc({ branch: 'slow', family: 'shock', locality: SOLUTION_ARC_NONLOCAL, segments: nonlocalShockFromNonlocalCompositeSegments, orientation: secondChainNonlocalShockOrientation, sonicTarget: null, direction, stateRole: 'U_-', state: usableNonlocalCompositeShockPairs[0]?.fixedState ?? null, anchor: usableNonlocalCompositeShockPairs[0]?.start ?? null, metadata: { chain: 'secondChain', starts: usableNonlocalCompositeShockPairs.map((item) => ({ anchor: item.start, fixedState: item.fixedState, sourceAnchor: item.sourceAnchor, source: item.source })) }, params })
  const nonlocalShockArc = makeArc({ branch: 'slow', family: 'shock', locality: SOLUTION_ARC_NONLOCAL, segments: [], orientation: null, sonicTarget: null, direction, stateRole: 'U_-', state: null, anchor: null, metadata: { deprecated: true, reason: 'slow nonlocal shocks are split by numbered solution chains' }, params })
  const localCompositeArc = makeArc({ branch: 'slow', family: 'composite', locality: SOLUTION_ARC_LOCAL, segments: localCompositeSegments, orientation: SLOW_K_ORIENTATION, sonicTarget: 'left', direction, stateRole: 'U_-', state: relevantStateForPoint(entry.seed, params, direction), anchor: entry.seed, metadata: { stopPoint: localCompositeStopPoint, stopKind: localCompositeEndsAtDoubleSonic ? 'doubleSonic' : (localCompositeHugoniotIntersection ? 'fixedHugoniot' : null), endsAtDoubleComposite: localCompositeEndsAtDoubleSonic, rarefactionEnd: localRarefactionEndpointPoint, compositeStart, inflectionPoint: localInflectionPoint, rarefactionEndpointIsInflection: localRarefactionEndpointIsInflection, construction: 'A_loc(K_-) = Sat_{H_-}(R_loc) cap S^- is generated only by leaves through the restricted local rarefaction arc and stops at the first event: double composite or H_-(U_L)', sourceRarefactionArc: 'localRarefactionSegments' }, params })
  const nonlocalCompositeArc = makeArc({ branch: 'slow', family: 'composite', locality: SOLUTION_ARC_NONLOCAL, segments: nonlocalCompositeSegments, orientation: SLOW_K_ORIENTATION, sonicTarget: 'left', direction, stateRole: 'U_-', state: relevantStateForPoint(hPlusCsPoint, params, direction), anchor: hPlusCsPoint, metadata: { anchors: projectedRarefactionAnchors, hPlusCsPoint, nonlocalRarefactionStartPoint: hPlusCsPoint, baseArc: 'nonlocalRarefactionArc', construction: 'K_nloc is built exactly like K_loc: select the component through J_nloc from K_-(P2) = Sat_{H_-}(R_-(P2)) cap S^-; only the rarefaction seed differs', pairs: nonlocalChainPairs, trimmedPairs: trimmedNonlocalCompositePairs }, params })
  const localRarefactionArc = makeArc({ branch: 'slow', family: 'rarefaction', locality: SOLUTION_ARC_LOCAL, segments: localRarefactionSegments, orientation: SLOW_R_ORIENTATION, sonicTarget: 'left', direction, stateRole: 'U_-', state: relevantStateForPoint(entry.seed, params, direction), anchor: entry.seed, metadata: { rarefactionEnd: localRarefactionEndpointPoint, compositeStart, inflectionPoint: localInflectionPoint, rarefactionEndpointIsInflection: localRarefactionEndpointIsInflection }, params })
  const nonlocalRarefactionArc = makeArc({ branch: 'slow', family: 'rarefaction', locality: SOLUTION_ARC_NONLOCAL, segments: nonlocalRarefactionSegments, orientation: SLOW_R_ORIENTATION, sonicTarget: 'left', direction, stateRole: 'U_-', state: relevantStateForPoint(hPlusCsPoint, params, direction), anchor: hPlusCsPoint, metadata: { anchors: projectedRarefactionAnchors, hPlusCsPoint, nonlocalRarefactionStartPoint: hPlusCsPoint, curveSegments: nonlocalChainPairs.flatMap((item) => item.displayRarefactionCurveSegments ?? item.rarefactionCurveSegments ?? []), compositePairs: nonlocalChainPairs }, params })

  // Numbered chains keep the solution architecture extensible.
  // Primeira cadeia: R_loc -> K_loc -> H_nloc generated from K_loc.
  // Segunda cadeia: H_loc -> S_s^+ -> H_+ auxiliary -> C_s -> R_nloc -> K_nloc -> H_nloc generated from K_nloc.
  const firstChainNonlocalShockArc = nonlocalShockFromLocalCompositeArc
  const secondChainNonlocalShockArc = nonlocalShockFromNonlocalCompositeArc
  const firstChain = {
    id: 'firstChain',
    order: 1,
    label: 'Primeira cadeia',
    rarefactionArc: localRarefactionArc,
    compositeArc: localCompositeArc,
    nonlocalShockArc: firstChainNonlocalShockArc,
    pieces: [localRarefactionArc, localCompositeArc, firstChainNonlocalShockArc].filter(Boolean),
  }
  const secondChain = {
    id: 'secondChain',
    order: 2,
    label: 'Segunda cadeia',
    localShockArc,
    auxiliaryShockArc: hPlusProjectionArc,
    postCompositeAuxiliaryShockArc: postCompositeHPlusArc,
    rarefactionArc: nonlocalRarefactionArc,
    compositeArc: nonlocalCompositeArc,
    nonlocalShockArc: secondChainNonlocalShockArc,
    pieces: [localShockArc, hPlusProjectionArc, nonlocalRarefactionArc, nonlocalCompositeArc, postCompositeHPlusArc, secondChainNonlocalShockArc].filter(Boolean),
  }
  const solutionChains = [firstChain, secondChain]

  const activeCompositeArc = null
  const activeShockArc = localShockArc
  const activeRarefactionArc = null
  const activeSaturationArc = hasUsableSegments(hPlusProjectionArc.segments) ? hPlusProjectionArc : activeShockArc
  const activeSolutionPieces = [
    localRarefactionArc,
    localCompositeArc,
    firstChainNonlocalShockArc,
    localShockArc,
    hPlusProjectionArc,
    postCompositeHPlusArc,
    nonlocalRarefactionArc,
    nonlocalCompositeArc,
    secondChainNonlocalShockArc,
  ].filter(Boolean)
  return {
    branch: 'slow',
    localRarefactionArc,
    localCompositeArc,
    localShockArc,
    hPlusProjectionArc,
    postCompositeHPlusArc,
    nonlocalRarefactionArc,
    nonlocalCompositeArc,
    nonlocalShockArc,
    nonlocalShockFromLocalCompositeArc,
    nonlocalShockFromNonlocalCompositeArc,
    firstChainNonlocalShockArc,
    secondChainNonlocalShockArc,
    firstChain,
    secondChain,
    solutionChains,
    activeRarefactionArc,
    activeCompositeArc,
    activeShockArc,
    activeSaturationArc,
    activeSolutionPieces,
    diagnosticPoints: diagnosticsFromPieces(solutionChains.flatMap((chain) => chain.pieces)),
  }
}
