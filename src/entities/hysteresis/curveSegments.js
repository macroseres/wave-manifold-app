import { solveLeftHysteresisPoint, solveRightHysteresisPoint } from '../surfaceImplicit/index.js'
import { physicalZToVisual, visualZToPhysical } from '../../geometry/zCompactification.js'

export function buildHysteresisCurveSegments(params, view, samples = 400, solver = solveRightHysteresisPoint) {
  const segments = []
  let current = []
  // Uniform visual sampling resolves both physical tails without enormous
  // physical-z steps breaking otherwise continuous segments near infinity.
  const margin = 1e-4
  const count = Math.max(720, samples * 2)
  const dzHat = (2 - 2 * margin) / (count - 1)
  let previousDet = null
  const yTol = 0.02 * Math.max(1, view.yMax - view.yMin)
  const tTol = 0.02 * Math.max(1, view.tMax - view.tMin)

  for (let i = 0; i < count; i += 1) {
    const z = visualZToPhysical(-1 + margin + i * dzHat)
    const point = solver(z, params)
    const isValid = point && point.Y >= view.yMin - yTol && point.Y <= view.yMax + yTol && point.t >= view.tMin - tTol && point.t <= view.tMax + tTol
    if (!isValid) {
      if (current.length >= 2) segments.push(current)
      current = []
      previousDet = null
      continue
    }
    const mapped = [point.t, point.Y, point.z]
    if (current.length > 0) {
      const prev = current[current.length - 1]
      const jumpT = Math.abs(mapped[0] - prev[0])
      const jumpY = Math.abs(mapped[1] - prev[1])
      const jumpZ = Math.abs(physicalZToVisual(mapped[2]) - physicalZToVisual(prev[2]))
      const crossesPole = Number.isFinite(previousDet) && Number.isFinite(point.det) && previousDet * point.det < 0
      const bigJump = jumpT > 0.2 * Math.max(1, view.tMax - view.tMin) || jumpY > 0.2 * Math.max(1, view.yMax - view.yMin) || jumpZ > 4 * dzHat || crossesPole
      if (bigJump) {
        if (current.length >= 2) segments.push(current)
        current = []
      }
    }
    current.push(mapped)
    previousDet = point.det
  }
  if (current.length >= 2) segments.push(current)
  return segments
}

export function buildRightHysteresisCurve(params, view, resolution = 40) {
  const samples = Math.max(240, Math.min(520, resolution * 6))
  return buildHysteresisCurveSegments(params, view, samples, solveRightHysteresisPoint)
}

export function buildLeftHysteresisCurve(params, view, resolution = 40) {
  const samples = Math.max(240, Math.min(520, resolution * 6))
  return buildHysteresisCurveSegments(params, view, samples, solveLeftHysteresisPoint)
}
