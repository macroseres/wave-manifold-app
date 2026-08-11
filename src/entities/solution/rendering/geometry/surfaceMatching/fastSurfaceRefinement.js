import { computeRightStateFromWavePoint, solveBackwardHugoniotPointForFixedRightState } from '../../../../surfaceImplicit/index.js'
import { withCoords } from '../../../../../geometry/pointUtils.js'
import {
  closestPointOnSegmentToPoint,
  normalizedCoords,
  normalizedDistance2Local,
  rightStateAtPoint,
  vectorCross,
  vectorDot,
  vectorLength,
  vectorSub,
} from '../pointGeometry.js'

export function refineFastSegmentHPlusClosestPoint(best, params, view) {
  if (!best?.segmentStart || !best?.segmentEnd || !best?.surfacePoint?.generatorPoint) return best

  const generator = best.surfacePoint.generatorPoint
  const rightState = computeRightStateFromWavePoint(generator.t, generator.Y, generator.z, params)
  if (!rightState) return best

  const zSpan = Math.max(1, view.zMax - view.zMin)
  const zMin = view.zMin
  const zMax = view.zMax
  const initialEta = Number.isFinite(best.surfacePoint.saturationZ) ? best.surfacePoint.saturationZ : best.surfacePoint.z
  let eta = Math.max(zMin, Math.min(zMax, initialEta))
  let current = best

  const saturatedAt = (z) => withCoords(solveBackwardHugoniotPointForFixedRightState(z, rightState, params))
  const distanceForEta = (z, fastPoint) => {
    const saturated = saturatedAt(z)
    return saturated ? normalizedDistance2Local(fastPoint, saturated, view) : Number.POSITIVE_INFINITY
  }

  for (let pass = 0; pass < 5; pass += 1) {
    const saturated = saturatedAt(eta)
    const projected = saturated
      ? closestPointOnSegmentToPoint(best.segmentStart, best.segmentEnd, saturated, view)
      : null
    if (!projected) break

    const fastPoint = projected.fastPoint
    const radius = zSpan / (8 * (pass + 1))
    let left = Math.max(zMin, eta - radius)
    let right = Math.min(zMax, eta + radius)

    for (let i = 0; i < 20; i += 1) {
      const m1 = left + (right - left) / 3
      const m2 = right - (right - left) / 3
      if (distanceForEta(m1, fastPoint) < distanceForEta(m2, fastPoint)) {
        right = m2
      } else {
        left = m1
      }
    }

    eta = 0.5 * (left + right)
    const refinedSurface = saturatedAt(eta)
    const refinedProjection = refinedSurface
      ? closestPointOnSegmentToPoint(best.segmentStart, best.segmentEnd, refinedSurface, view)
      : null
    if (!refinedProjection || !refinedSurface) break

    current = {
      ...current,
      ...refinedProjection,
      surfacePoint: {
        ...refinedSurface,
        generatorPoint: generator,
        generatorPrev: best.surfacePoint.generatorPrev,
        generatorNext: best.surfacePoint.generatorNext,
        saturationZ: eta,
      },
      d2: normalizedDistance2Local(refinedProjection.fastPoint, refinedSurface, view),
    }
  }

  return current.d2 <= best.d2 ? current : best
}

export function surfaceCrossingQuality(candidate, params, view) {
  if (!candidate?.segmentStart || !candidate?.segmentEnd || !candidate?.surfacePoint?.generatorPoint) {
    return { crosses: false, planeResidual: Number.POSITIVE_INFINITY }
  }

  const surfacePoint = candidate.surfacePoint
  const generator = surfacePoint.generatorPoint
  const rightState = rightStateAtPoint(generator, params)
  if (!rightState) return { crosses: false, planeResidual: Number.POSITIVE_INFINITY }

  const zSpan = Math.max(1, view.zMax - view.zMin)
  const dz = 1e-4 * zSpan
  const eta = Number.isFinite(surfacePoint.saturationZ) ? surfacePoint.saturationZ : surfacePoint.z
  const etaMinus = withCoords(solveBackwardHugoniotPointForFixedRightState(eta - dz, rightState, params))
  const etaPlus = withCoords(solveBackwardHugoniotPointForFixedRightState(eta + dz, rightState, params))
  const generatorPrev = surfacePoint.generatorPrev ?? generator
  const generatorNext = surfacePoint.generatorNext ?? generator
  const prevState = rightStateAtPoint(generatorPrev, params)
  const nextState = rightStateAtPoint(generatorNext, params)
  const uMinus = prevState ? withCoords(solveBackwardHugoniotPointForFixedRightState(eta, prevState, params)) : null
  const uPlus = nextState ? withCoords(solveBackwardHugoniotPointForFixedRightState(eta, nextState, params)) : null

  const p = normalizedCoords(surfacePoint, view)
  const e0 = normalizedCoords(etaMinus, view)
  const e1 = normalizedCoords(etaPlus, view)
  const u0 = normalizedCoords(uMinus, view)
  const u1 = normalizedCoords(uPlus, view)
  const a = normalizedCoords(candidate.segmentStart, view)
  const b = normalizedCoords(candidate.segmentEnd, view)
  const fast = normalizedCoords(candidate.fastPoint, view)
  if (!p || !e0 || !e1 || !u0 || !u1 || !a || !b || !fast) {
    return { crosses: false, planeResidual: Number.POSITIVE_INFINITY }
  }

  const etaTangent = vectorSub(e1, e0)
  const generatorTangent = vectorSub(u1, u0)
  const normal = vectorCross(etaTangent, generatorTangent)
  const normalLength = vectorLength(normal)
  if (normalLength <= 1e-10) return { crosses: false, planeResidual: Number.POSITIVE_INFINITY }

  const signedA = vectorDot(vectorSub(a, p), normal) / normalLength
  const signedB = vectorDot(vectorSub(b, p), normal) / normalLength
  const signedFast = vectorDot(vectorSub(fast, p), normal) / normalLength
  const planeResidual = Math.min(Math.abs(signedA), Math.abs(signedB), Math.abs(signedFast))
  const crosses = signedA === 0 || signedB === 0 || signedA * signedB < 0
  const nearlyOnPlane = Math.abs(signedA) <= 0.0035 || Math.abs(signedB) <= 0.0035

  return { crosses: crosses || nearlyOnPlane, planeResidual }
}
