import {
  interpolateCoordsPoint,
  pointObjectFromCoords,
  leftStateAtPoint,
  rightStateAtPoint,
  rightStateDistance2,
} from '../pointGeometry.js'

export function closestPointOnSlowArcForHPlus(slowSegments, targetRightState, params) {
  if (!targetRightState) return null
  let best = null

  for (const segment of slowSegments ?? []) {
    const points = (segment ?? []).map(pointObjectFromCoords).filter(Boolean)
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i]
      const b = points[i + 1]

      let left = 0
      let right = 1
      for (let iter = 0; iter < 22; iter += 1) {
        const m1 = left + (right - left) / 3
        const m2 = right - (right - left) / 3
        const p1 = interpolateCoordsPoint(a, b, m1)
        const p2 = interpolateCoordsPoint(a, b, m2)
        const d1 = rightStateDistance2(rightStateAtPoint(p1, params), targetRightState)
        const d2 = rightStateDistance2(rightStateAtPoint(p2, params), targetRightState)
        if (d1 < d2) {
          right = m2
        } else {
          left = m1
        }
      }

      const alpha = 0.5 * (left + right)
      const generatorPoint = interpolateCoordsPoint(a, b, alpha)
      const generatorRightState = rightStateAtPoint(generatorPoint, params)
      const d2 = rightStateDistance2(generatorRightState, targetRightState)
      if (!best || d2 < best.d2) {
        best = { generatorPoint, generatorRightState, d2 }
      }
    }
  }

  return best
}

export function leftStateDistance2(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY
  const du = (a.uMinus ?? 0) - (b.uMinus ?? 0)
  const dv = (a.vMinus ?? 0) - (b.vMinus ?? 0)
  return du * du + dv * dv
}

export function closestPointOnSlowArcForHMinus(slowSegments, targetLeftState, params) {
  if (!targetLeftState) return null
  let best = null

  for (const segment of slowSegments ?? []) {
    const points = (segment ?? []).map(pointObjectFromCoords).filter(Boolean)
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i]
      const b = points[i + 1]

      let left = 0
      let right = 1
      for (let iter = 0; iter < 22; iter += 1) {
        const m1 = left + (right - left) / 3
        const m2 = right - (right - left) / 3
        const p1 = interpolateCoordsPoint(a, b, m1)
        const p2 = interpolateCoordsPoint(a, b, m2)
        const d1 = leftStateDistance2(leftStateAtPoint(p1, params), targetLeftState)
        const d2 = leftStateDistance2(leftStateAtPoint(p2, params), targetLeftState)
        if (d1 < d2) {
          right = m2
        } else {
          left = m1
        }
      }

      const alpha = 0.5 * (left + right)
      const generatorPoint = interpolateCoordsPoint(a, b, alpha)
      const generatorLeftState = leftStateAtPoint(generatorPoint, params)
      const d2 = leftStateDistance2(generatorLeftState, targetLeftState)
      if (!best || d2 < best.d2) {
        best = { generatorPoint, generatorLeftState, d2 }
      }
    }
  }

  return best
}
