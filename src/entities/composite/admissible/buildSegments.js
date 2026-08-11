import { FORWARD_HUGONIOT } from '../../hugoniot/directions.js'
import { RAREFACTION, clampResolutionSamples } from '../../../config/numerics.js'
import { buildCompositeArcRestrictedSegments } from '../../waves/index.js'
import { SPEED_DECREASES, SPEED_INCREASES } from '../../waves/orientation.js'
import { buildDrawableCompositeSegments } from '../../../geometry/compositeCurveGeometry.js'
import { computeCompositeSlowInflectionPoint } from '../../../components/curves/compositeInflectionUtils.js'
import { normalizeSegment } from './primitives.js'
import { buildStopGeometry } from './stopping.js'
import {
  filterCompositeBranchesSharingRarefactionAnchors,
  keepDrawableSegment,
  orientSegmentBySpeed,
  restrictCompositeFromRarefactionAnchor,
  slowCompositeSideReference,
  splitSegmentBySpeed,
} from './restriction.js'

export function buildCompositeAdmissibleSegmentsForSolution({
  fixedState,
  params,
  view,
  resolution = 40,
  direction = FORWARD_HUGONIOT,
  sonicTarget = 'left',
  inflectionBranch = 'slow',
  admissibleOrientation = null,
  stopFixedState = null,
}) {
  if (!fixedState) return []
  const samples = clampResolutionSamples(
    resolution * RAREFACTION.SAMPLES_PER_RESOLUTION,
    RAREFACTION.MIN_SAMPLES,
    RAREFACTION.MAX_SAMPLES,
  )
  const data = buildCompositeArcRestrictedSegments(
    fixedState,
    params,
    view,
    samples,
    resolution,
    { inflectionBranch, direction, sonicTarget },
  )
  const rawSegments = (data?.segments ?? []).map(normalizeSegment).filter((segment) => segment.length >= 2)
  const branchPoint = inflectionBranch === 'slow'
    ? computeCompositeSlowInflectionPoint(fixedState, params, view, resolution)
    : null
  const rarefactionAnchorPoints = data?.sonicAnchorPoints ?? (data?.sonicAnchorPoint ? [data.sonicAnchorPoint] : [])
  const branchTolerance = Math.max(0.025, 0.10 / Math.max(1, resolution))
  const branchSegments = filterCompositeBranchesSharingRarefactionAnchors(
    rawSegments,
    branchPoint,
    rarefactionAnchorPoints,
    view,
    {
      branchTolerance,
      anchorTolerance: Math.max(0.030, 0.12 / Math.max(1, resolution)),
      fallbackToBranchPoint: true,
    },
  )
  const stopGeometry = buildStopGeometry({ fixedState, stopFixedState, params, view, resolution, direction })
  const sideReference = slowCompositeSideReference({
    fixedState,
    params,
    view,
    resolution,
    inflectionBranch,
    admissibleOrientation,
  })
  // The local composite must be the connected piece that shares the
  // rarefaction-to-composite transition.  In regular cases the transition
  // point is one of `sonicAnchorPoints`; in near-tangent/marching-squares
  // cases that point can be slightly missed, so include the analytically
  // computed branch point as a secondary anchor.  This prevents K_loc from
  // disappearing when the strict anchor list is numerically empty or not on
  // the sampled component.
  const restrictionAnchors = [
    ...(rarefactionAnchorPoints ?? []),
    branchPoint,
  ].filter(Boolean)
  const anchored = restrictCompositeFromRarefactionAnchor(
    branchSegments,
    restrictionAnchors,
    params,
    view,
    admissibleOrientation,
    stopGeometry,
    sideReference,
  )
  const source = anchored ?? branchSegments
  const oriented = source
    .flatMap((segment) => anchored ? [segment] : splitSegmentBySpeed(segment, params, admissibleOrientation))
    .map((segment) => anchored ? segment : orientSegmentBySpeed(segment, params, admissibleOrientation))
  return buildDrawableCompositeSegments(oriented)
    .filter((segment) => keepDrawableSegment(segment, view))
}

export { SPEED_DECREASES, SPEED_INCREASES }
