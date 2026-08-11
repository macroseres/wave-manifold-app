export {
  closestPointOnSlowArcForHPlus,
  closestPointOnSlowArcForHMinus,
  leftStateDistance2,
} from './surfaceMatching/slowArcMatching.js'
export {
  refineFastSegmentHPlusClosestPoint,
  surfaceCrossingQuality,
} from './surfaceMatching/fastSurfaceRefinement.js'
export {
  coarsenSegments,
  closestPointBetweenFastSegmentsAndSurface,
  dedupeIntersectionResults,
  splitSegmentByPattern,
  dashDotDotSegments,
} from './surfaceMatching/segmentPatterns.js'
export {
  buildChosenHPlusLeafSegments,
  buildChosenHMinusLeafSegments,
  chosenHPlusContainsSurfacePoint,
  chosenHMinusIsFromRarefaction,
} from './surfaceMatching/chosenLeaves.js'
