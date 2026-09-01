import { BACKWARD_HUGONIOT } from '../../../hugoniot/directions.js'
import { computeLeftStateFromWavePoint } from '../../../surfaceImplicit/index.js'
import {
  enforcePipelineOrientationFromAnchor,
  pointObjectFromCoords,
  relevantStateForPoint,
  makeArc,
  hasUsableSegments,
  uniqueAnchors,
} from '../../internal/pipelineShared.js'
import {
  expandViewZForIntersections,
  terminalAnchorFromFirstSegment,
  trimSegmentsToPoint,
  buildHugoniotSegmentsFromFixedLeafStart,
  firstHugoniotIntersectionOnComposite,
  buildSolutionRarefactionToFastInflectionSegments,
  nonlocalSecondChainAdaptiveSettings,
  buildNonlocalRarefactionCurveData,
  buildFirstIntersectionCompositeFromRarefactionArc,
  anchorCompositeContinuationAtInflection,
  extractOrientedCompositeArcFromFullCurve,
  trimSegmentsToFirstSonic,
  buildGlobalCompositeIntersectionFromRarefactionCurve,
  buildHMinusSegmentFromSonicToCf,
  buildHMinusSegmentToFixedHPlusIntersection,
} from '../../internal/pipelineGeometry.js'
import {
  SOLUTION_ARC_LOCAL,
  SOLUTION_ARC_NONLOCAL,
  FAST_H_ORIENTATION,
  FAST_R_ORIENTATION,
  FAST_K_ORIENTATION,
  buildEmptyBranchPipeline,
  diagnosticsFromPieces,
} from './shared.js'

export function buildFastPipeline({ entry, sonicRarefactionAnchors: _sonicRarefactionAnchors, params, view, resolution, reflected = false }) {
  if (!entry?.state || !entry?.seed) return buildEmptyBranchPipeline(reflected ? 'reflected' : 'fast')
  const direction = BACKWARD_HUGONIOT
  const branch = reflected ? 'reflected' : 'fast'
  const firstChainNonlocalShockOrientation = FAST_H_ORIENTATION
  const secondChainNonlocalShockOrientation = FAST_H_ORIENTATION
  const fastLocalCompositeOrientation = FAST_K_ORIENTATION

  // Classical fast local chain, symmetric to the slow construction:
  //   J_+ = R_+(U_R) cap S^+,
  //   K_+ = Sat_{H_+}(R_+(U_R)) cap S^+.
  // Build the local rarefaction and refine J_+ on that same polyline. Saturate
  // only this restricted arc, so every point of K_+ comes from a Hugoniot leaf
  // through R_loc and no continuation beyond J_+ contributes to the result.
  const localCompositeCalcView = expandViewZForIntersections(view, 0.35)
  const localRarefactionSegments = enforcePipelineOrientationFromAnchor(
    buildSolutionRarefactionToFastInflectionSegments(
      entry.seed,
      params,
      localCompositeCalcView,
      Math.max(resolution, 90),
      FAST_R_ORIENTATION,
      'fast',
    ),
    entry.seed,
    params,
    localCompositeCalcView,
    FAST_R_ORIENTATION,
  )
  const localInflectionPoint = terminalAnchorFromFirstSegment(localRarefactionSegments) ?? null
  const localCompositeSourceRarefactionSegments = localRarefactionSegments
    .map((segment) => segment.map(pointObjectFromCoords).filter(Boolean))
    .filter((segment) => segment.length >= 2)
  const globalLocalCompositeSegments = buildGlobalCompositeIntersectionFromRarefactionCurve(
    localCompositeSourceRarefactionSegments,
    entry.seed,
    params,
    localCompositeCalcView,
    direction,
    'right',
    'fast',
  )
  let orientedRawLocalCompositeSegments = extractOrientedCompositeArcFromFullCurve(
    globalLocalCompositeSegments,
    localInflectionPoint,
    params,
    localCompositeCalcView,
    FAST_K_ORIENTATION,
  )
  if (!hasUsableSegments(orientedRawLocalCompositeSegments)) {
    const leafContinuation = buildFirstIntersectionCompositeFromRarefactionArc(
      localCompositeSourceRarefactionSegments,
      params,
      localCompositeCalcView,
      direction,
      'right',
      'fast',
    )
    orientedRawLocalCompositeSegments = anchorCompositeContinuationAtInflection(
      leafContinuation,
      localInflectionPoint,
      localCompositeCalcView,
    )
  }
  const localCompositeIntersection = firstHugoniotIntersectionOnComposite({
    compositeSegments: orientedRawLocalCompositeSegments,
    fixedState: entry.state,
    params,
    view: localCompositeCalcView,
    direction,
    sonicTarget: 'right',
  })
  const localCompositeStopPoint = localCompositeIntersection?.point ?? null
  const localCompositeSegments = localCompositeStopPoint
    ? trimSegmentsToPoint(
      orientedRawLocalCompositeSegments,
      localCompositeStopPoint,
      localCompositeCalcView,
      { preserveTarget: true },
    )
    : orientedRawLocalCompositeSegments
  const rawLocalShockSegments = buildHugoniotSegmentsFromFixedLeafStart({
    fixedState: entry.state,
    startPoint: entry.seed,
    params,
    view,
    resolution,
    direction,
    orientation: FAST_H_ORIENTATION,
  })
  // A fast local shock is also an arc, not the whole H_+ leaf.  Keep the same
  // rule as the slow side: stop the local shock at its first right sonic hit.
  const localShockSonic = trimSegmentsToFirstSonic(rawLocalShockSegments, params, view, 'right', 'any')
  const localShockSegments = enforcePipelineOrientationFromAnchor(
    localShockSonic.segments,
    entry.seed,
    params,
    view,
    FAST_H_ORIENTATION,
  )

  const localCompositeShockPair = localCompositeIntersection?.leafPoint
    ? {
      anchor: entry.seed,
      fixedState: entry.state,
      start: localCompositeIntersection.leafPoint,
      sourceAnchor: localCompositeIntersection.point ?? localCompositeIntersection.leafPoint,
      source: 'fastLocalRarefactionCompositeHugoniotIntersection',
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
  const usableLocalCompositeShockPairs = [localCompositeShockPair]
    .filter(Boolean)
    .filter((item) => hasUsableSegments(item.segments))
  const nonlocalShockFromLocalCompositeSegments = usableLocalCompositeShockPairs.flatMap((item) => item.segments)

  // Segunda cadeia rápida, espelho geométrico da segunda cadeia lenta:
  //   A_loc(H_+) -> S_f^- -> H_- -> C_f -> R_+^nloc -> J_+
  //   -> K_+^nloc -> H_- -> H_+(U_R) -> A_nloc(H_+).
  const localShockSonicPoint = localShockSonic.sonicPoint ?? null
  const localShockSonicBranch = localShockSonic.sonicBranch ?? null
  const hMinusStartPoint = localShockSonicBranch === 'fast' ? localShockSonicPoint : null
  const hMinusProjectionSegments = hMinusStartPoint
    ? buildHMinusSegmentFromSonicToCf(hMinusStartPoint, params, expandViewZForIntersections(view), resolution)
    : []
  const projectedRarefactionAnchors = uniqueAnchors([
    terminalAnchorFromFirstSegment(hMinusProjectionSegments),
  ].filter(Boolean))
  const hMinusCfPoint = projectedRarefactionAnchors[0] ?? null

  const baseNonlocalChainCalcView = expandViewZForIntersections(view, 0.35)
  const baseNonlocalChainResolution = Math.max(resolution, 90)
  const nonlocalCompositePairs = projectedRarefactionAnchors.map((anchor) => {
    const initialRarefactionCurveData = buildNonlocalRarefactionCurveData(
      anchor, null, params, baseNonlocalChainCalcView, baseNonlocalChainResolution, 'fast',
    )
    const estimatedInflection = initialRarefactionCurveData.arcEnd
      ?? terminalAnchorFromFirstSegment(initialRarefactionCurveData.arcSegments ?? [])
      ?? null
    const adaptive = nonlocalSecondChainAdaptiveSettings(anchor, estimatedInflection, view, baseNonlocalChainResolution)
    const nonlocalChainCalcView = adaptive.view
    const nonlocalChainResolution = adaptive.resolution
    const rarefactionCurveData = buildNonlocalRarefactionCurveData(
      anchor, estimatedInflection, params, nonlocalChainCalcView, nonlocalChainResolution, 'fast',
    )
    const rarefactionSegments = hasUsableSegments(rarefactionCurveData.arcSegments)
      ? rarefactionCurveData.arcSegments
      : []
    const rarefactionCurveSegments = hasUsableSegments(rarefactionCurveData.curveSegments)
      ? rarefactionCurveData.curveSegments
      : []
    const rarefactionEnd = rarefactionCurveData.arcEnd
      ?? terminalAnchorFromFirstSegment(rarefactionSegments)
      ?? null
    const compositeSourceRarefactionSegments = rarefactionSegments
      .map((segment) => segment.map(pointObjectFromCoords).filter(Boolean))
      .filter((segment) => segment.length >= 2)

    // J_nloc is exactly the terminal point of the nonlocal rarefaction.
    // Without that terminal point there is no valid component of K_nloc to
    // select.
    let completeNonlocalCompositeSegments = rarefactionEnd
      ? buildGlobalCompositeIntersectionFromRarefactionCurve(
        compositeSourceRarefactionSegments, anchor, params, nonlocalChainCalcView, direction, 'right', 'fast',
      )
      : []
    const leafContinuation = buildFirstIntersectionCompositeFromRarefactionArc(
      compositeSourceRarefactionSegments, params, nonlocalChainCalcView, direction, 'right', 'fast',
    )
    let compositeSegmentsFromInflection = anchorCompositeContinuationAtInflection(
      leafContinuation, rarefactionEnd, nonlocalChainCalcView,
    )
    if (rarefactionEnd && !hasUsableSegments(compositeSegmentsFromInflection)) {
      compositeSegmentsFromInflection = extractOrientedCompositeArcFromFullCurve(
        completeNonlocalCompositeSegments, rarefactionEnd, params, nonlocalChainCalcView, FAST_K_ORIENTATION,
      )
    }
    const nonlocalCompositeStart = rarefactionEnd
    const orientedCompositeSegments = compositeSegmentsFromInflection
    const compositeEndpoint = terminalAnchorFromFirstSegment(orientedCompositeSegments) ?? null
    return {
      anchor: nonlocalCompositeStart ?? anchor,
      compositeStart: nonlocalCompositeStart,
      rarefactionStart: anchor,
      hMinusCfPoint: anchor,
      nonlocalRarefactionStartPoint: anchor,
      rarefactionEnd,
      inflectionPoint: rarefactionEnd,
      rarefactionSegments,
      rarefactionCurveSegments,
      // Display only the connected component of K_nloc that contains J_nloc.
      // Other components of the full saturation do not intersect the
      // inflection and are not part of the nonlocal composite curve.
      involvedCompositeSegments: compositeSegmentsFromInflection,
      segments: orientedCompositeSegments,
      stopPoint: compositeEndpoint,
      source: 'fastHMinusCfRarefactionToInflectionComposite',
      adaptiveSettings: { distanceToInflection: adaptive.distanceToInflection, resolution: nonlocalChainResolution },
    }
  })
  const trimmedNonlocalCompositePairs = nonlocalCompositePairs.filter((item) => hasUsableSegments(item.segments))
  const nonlocalCompositeSegments = trimmedNonlocalCompositePairs.flatMap((item) => item.segments)

  const postCompositeHMinusPairs = trimmedNonlocalCompositePairs.map((item) => {
    const compositeEndpoint = item.stopPoint ?? terminalAnchorFromFirstSegment(item.segments) ?? null
    const projection = compositeEndpoint
      ? buildHMinusSegmentToFixedHPlusIntersection({
        startPoint: compositeEndpoint, fixedRightState: entry.state, params, view, resolution,
      })
      : null
    return {
      ...item,
      compositeEndpoint,
      segments: projection?.segments ?? [],
      intersectionPoint: projection?.intersectionPoint ?? null,
      hPlusLeafPoint: projection?.hPlusLeafPoint ?? null,
      fixedLeftState: projection?.fixedLeftState ?? null,
    }
  })
  const postCompositeHMinusSegments = postCompositeHMinusPairs.flatMap((item) => item.segments ?? [])
  const nonlocalCompositeShockPairs = postCompositeHMinusPairs
    .filter((item) => item.hPlusLeafPoint)
    .map((item) => ({
      anchor: item.anchor,
      fixedState: entry.state,
      start: item.hPlusLeafPoint,
      sourceAnchor: item.compositeEndpoint,
      source: 'postCompositeHMinusFixedHPlusIntersection',
      segments: enforcePipelineOrientationFromAnchor(buildHugoniotSegmentsFromFixedLeafStart({
        fixedState: entry.state, startPoint: item.hPlusLeafPoint, params, view, resolution, direction,
        orientation: secondChainNonlocalShockOrientation,
      }), item.hPlusLeafPoint, params, view, secondChainNonlocalShockOrientation),
    }))
    .filter((item) => hasUsableSegments(item.segments))
  const nonlocalShockFromNonlocalCompositeSegments = nonlocalCompositeShockPairs.flatMap((item) => item.segments)
  const nonlocalRarefactionSegments = nonlocalCompositePairs.flatMap((item) => item.rarefactionSegments ?? [])

  const localShockArc = makeArc({ branch, family: 'shock', locality: SOLUTION_ARC_LOCAL, segments: localShockSegments, orientation: FAST_H_ORIENTATION, sonicTarget: 'right', direction, stateRole: 'U_+', state: entry.state, anchor: entry.seed, metadata: { sonicPoint: localShockSonic.sonicPoint ?? null, sonicBranch: localShockSonic.sonicBranch ?? null }, params })
  const hMinusProjectionArc = makeArc({ branch, family: 'shock', locality: SOLUTION_ARC_NONLOCAL, segments: hMinusProjectionSegments, orientation: null, sonicTarget: null, direction, stateRole: 'U_-', state: hMinusStartPoint ? computeLeftStateFromWavePoint(hMinusStartPoint.t, hMinusStartPoint.Y, hMinusStartPoint.z, params) : null, anchor: hMinusStartPoint, metadata: { role: 'HMinusProjectionToCf' }, params })
  const postCompositeHMinusArc = makeArc({ branch, family: 'shock', locality: SOLUTION_ARC_NONLOCAL, segments: postCompositeHMinusSegments, orientation: null, sonicTarget: null, direction, stateRole: 'U_-', state: postCompositeHMinusPairs[0]?.fixedLeftState ?? null, anchor: postCompositeHMinusPairs[0]?.compositeEndpoint ?? null, metadata: { role: 'HMinusAfterNonlocalCompositeToHPlus', pairs: postCompositeHMinusPairs }, params })
  const nonlocalShockFromLocalCompositeArc = makeArc({ branch, family: 'shock', locality: SOLUTION_ARC_NONLOCAL, segments: nonlocalShockFromLocalCompositeSegments, orientation: firstChainNonlocalShockOrientation, sonicTarget: null, direction, stateRole: 'U_+', state: usableLocalCompositeShockPairs[0]?.fixedState ?? null, anchor: usableLocalCompositeShockPairs[0]?.start ?? null, metadata: { chain: 'firstChain', starts: usableLocalCompositeShockPairs.map((item) => ({ anchor: item.start, fixedState: item.fixedState, sourceAnchor: item.sourceAnchor, source: item.source })) }, params })
  const nonlocalShockFromNonlocalCompositeArc = makeArc({ branch, family: 'shock', locality: SOLUTION_ARC_NONLOCAL, segments: nonlocalShockFromNonlocalCompositeSegments, orientation: secondChainNonlocalShockOrientation, sonicTarget: null, direction, stateRole: 'U_+', state: nonlocalCompositeShockPairs[0]?.fixedState ?? null, anchor: nonlocalCompositeShockPairs[0]?.start ?? null, metadata: { chain: 'secondChain', starts: nonlocalCompositeShockPairs.map((item) => ({ anchor: item.start, fixedState: item.fixedState, sourceAnchor: item.sourceAnchor, source: item.source })) }, params })
  const nonlocalShockArc = makeArc({ branch, family: 'shock', locality: SOLUTION_ARC_NONLOCAL, segments: [], orientation: null, sonicTarget: null, direction, stateRole: 'U_+', state: null, anchor: null, metadata: { deprecated: true, reason: 'fast nonlocal shocks are split by numbered solution chains' }, params })
  const localCompositeArc = makeArc({ branch, family: 'composite', locality: SOLUTION_ARC_LOCAL, segments: localCompositeSegments, orientation: fastLocalCompositeOrientation, sonicTarget: 'right', direction, stateRole: 'U_+', state: relevantStateForPoint(entry.seed, params, direction), anchor: entry.seed, metadata: { stopPoint: localCompositeStopPoint, inflectionPoint: localInflectionPoint, construction: 'A_loc(K_+) = Sat_{H_+}(R_loc) cap S^+ is generated only by leaves through the restricted local rarefaction arc', sourceRarefactionArc: 'localRarefactionSegments' }, params })
  const nonlocalCompositeArc = makeArc({ branch, family: 'composite', locality: SOLUTION_ARC_NONLOCAL, segments: nonlocalCompositeSegments, orientation: FAST_K_ORIENTATION, sonicTarget: 'right', direction, stateRole: 'U_+', state: relevantStateForPoint(hMinusCfPoint, params, direction), anchor: hMinusCfPoint, metadata: { anchors: projectedRarefactionAnchors, hMinusCfPoint, baseArc: 'nonlocalRarefactionArc', construction: 'mathcal K_nloc = Sat_H(mathcal R_nloc) cap S; K_nloc is extracted from the full nonlocal fast rarefaction curve', pairs: nonlocalCompositePairs, trimmedPairs: trimmedNonlocalCompositePairs }, params })
  const localRarefactionArc = makeArc({ branch, family: 'rarefaction', locality: SOLUTION_ARC_LOCAL, segments: localRarefactionSegments, orientation: FAST_R_ORIENTATION, sonicTarget: 'right', direction, stateRole: 'U_+', state: relevantStateForPoint(entry.seed, params, direction), anchor: entry.seed, params })
  const nonlocalRarefactionArc = makeArc({ branch, family: 'rarefaction', locality: SOLUTION_ARC_NONLOCAL, segments: nonlocalRarefactionSegments, orientation: FAST_R_ORIENTATION, sonicTarget: 'right', direction, stateRole: 'U_+', state: relevantStateForPoint(hMinusCfPoint, params, direction), anchor: hMinusCfPoint, metadata: { anchors: projectedRarefactionAnchors, hMinusCfPoint, curveSegments: nonlocalCompositePairs.flatMap((item) => item.rarefactionCurveSegments ?? []), compositePairs: nonlocalCompositePairs }, params })

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
    auxiliaryShockArc: hMinusProjectionArc,
    postCompositeAuxiliaryShockArc: postCompositeHMinusArc,
    rarefactionArc: nonlocalRarefactionArc,
    compositeArc: nonlocalCompositeArc,
    nonlocalShockArc: secondChainNonlocalShockArc,
    pieces: [localShockArc, hMinusProjectionArc, nonlocalRarefactionArc, nonlocalCompositeArc, postCompositeHMinusArc, secondChainNonlocalShockArc].filter(Boolean),
  }
  const solutionChains = [firstChain, secondChain]

  const activeCompositeArc = null
  const activeShockArc = localShockArc
  const activeRarefactionArc = null
  const activeSaturationArc = null
  const activeSolutionPieces = [
    localRarefactionArc,
    localCompositeArc,
    firstChainNonlocalShockArc,
    localShockArc,
    hMinusProjectionArc,
    postCompositeHMinusArc,
    nonlocalRarefactionArc,
    nonlocalCompositeArc,
    secondChainNonlocalShockArc,
  ].filter(Boolean)

  return {
    branch,
    localRarefactionArc,
    localCompositeArc,
    localShockArc,
    hMinusProjectionArc,
    postCompositeHMinusArc,
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
