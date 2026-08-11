import { solveCoincidenceSegments } from '../surfaceImplicit/index.js'

export function buildCoincidenceCurveSegments(view) {
  return solveCoincidenceSegments(view)
}

export { solveCoincidenceSegments }
