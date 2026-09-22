import { solveSecondaryLeftBifurcationSegments, solveSecondaryRightBifurcationSegments } from '../surfaceImplicit/index.js'

export function buildSecondaryRightBifurcationSegments(params, view, samples = 260, options = {}) {
  return solveSecondaryRightBifurcationSegments(params, view, samples, options)
}

export { solveSecondaryLeftBifurcationSegments, solveSecondaryRightBifurcationSegments }


export function buildSecondaryLeftBifurcationSegments(params, view, samples = 260, options = {}) {
  return solveSecondaryLeftBifurcationSegments(params, view, samples, options)
}
