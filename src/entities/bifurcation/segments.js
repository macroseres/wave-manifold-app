import { solveSecondaryRightBifurcationSegments } from '../surfaceImplicit/index.js'

export function buildSecondaryRightBifurcationSegments(params, view, samples = 260) {
  return solveSecondaryRightBifurcationSegments(params, view, samples)
}

export { solveSecondaryRightBifurcationSegments }
