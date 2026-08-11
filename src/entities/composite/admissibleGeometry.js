export { buildCompositeAdmissibleSegmentsForSolution } from './admissible/buildSegments.js'
export { buildStopGeometry } from './admissible/stopping.js'
export {
  branchFromT,
  coordsOf,
  finite,
  normalizeSegment,
  solutionProbePointFromLineEvent,
} from './admissible/primitives.js'
export { trimSegmentCollectionToPoint } from './admissible/trimming.js'
export {
  filterCompositeBranchesThroughPoint,
  filterCompositeBranchesSharingRarefactionAnchors,
  keepDrawableSegment,
  orientSegmentBySpeed,
  restrictCompositeFromRarefactionAnchor,
  slowCompositeSideReference,
  splitSegmentBySpeed,
} from './admissible/restriction.js'
