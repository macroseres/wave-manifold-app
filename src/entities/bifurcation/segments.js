import { solveSecondaryRightBifurcationSegments } from '../surfaceImplicit/index.js'

export function buildSecondaryRightBifurcationSegments(params, view, samples = 260, options = {}) {
  return solveSecondaryRightBifurcationSegments(params, view, samples, options)
}

export { solveSecondaryRightBifurcationSegments }

