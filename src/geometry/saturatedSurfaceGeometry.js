import * as THREE from 'three'
import { hysPlusMinusImplicit, hysPlusPlusImplicit } from '../entities/hysteresis/stateImplicit/index.js'
import { computeLeftStateFromWavePoint, computeRightStateFromWavePoint, solveRightHysteresisPoint } from '../entities/surfaceImplicit/index.js'
import { solveHugoniotPointForFixedState, solveBackwardHugoniotPointForFixedRightState } from '../entities/waves/index.js'
import { visualZToPhysical } from './zCompactification.js'

// Reference equation. A single marching-cubes mesh cannot resolve its double
// curve reliably; the rendering below retains the two parameter sheets.
export function saturatedHysteresisImplicit(Y, t, z, params, direction = 'minus') {
  if (direction === 'plus') {
    const state = computeRightStateFromWavePoint(t, Y, z, params)
    return state ? hysPlusPlusImplicit(state.uPlus, state.vPlus, params) : Number.NaN
  }
  const state = computeLeftStateFromWavePoint(t, Y, z, params)
  if (!state) return Number.NaN
  return hysPlusMinusImplicit(state.uMinus, state.vMinus, params)
}

function clipPolygon(polygon, axis, bound, sign) {
  const result = []
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length]
    const insideA = sign * (a[axis] - bound) >= 0
    const insideB = sign * (b[axis] - bound) >= 0
    if (insideA) result.push(a)
    if (insideA !== insideB) {
      const fraction = (bound - a[axis]) / (b[axis] - a[axis])
      const point = a.map((value, k) => value + fraction * (b[k] - value))
      point[axis] = bound
      result.push(point)
    }
  }
  return result
}

export function buildSaturatedGeometry(params, view, resolution = 40, direction = 'minus') {
  const geometry = new THREE.BufferGeometry()
  if (view.tMax <= view.tMin || view.yMax <= view.yMin || view.zMax <= view.zMin) return geometry
  const seedCount = Math.max(600, Math.min(1200, Math.round(resolution * 12)))
  const leafCount = Math.max(360, Math.min(720, Math.round(resolution * 7)))
  const margin = 1e-4
  const projectState = direction === 'plus' ? computeRightStateFromWavePoint : computeLeftStateFromWavePoint
  const solveLeaf = direction === 'plus' ? solveBackwardHugoniotPointForFixedRightState : solveHugoniotPointForFixedState
  const zHats = Array.from({ length: leafCount + 1 }, (_, i) => -1 + margin + (2 - 2 * margin) * i / leafCount)
  const positions = [], indices = [], vertexIndices = new WeakMap()
  const bounds = [[0, view.tMin, 1], [0, view.tMax, -1], [1, view.yMin, 1], [1, view.yMax, -1]]
  const appendTriangle = (triangle) => {
    let polygon = triangle
    for (const [axis, bound, sign] of bounds) {
      if (polygon.every(point => sign * (point[axis] - bound) >= 0)) continue
      if (polygon.every(point => sign * (point[axis] - bound) < 0)) return
      polygon = clipPolygon(polygon, axis, bound, sign)
      if (polygon.length < 3) return
    }
    const ids = polygon.map(point => {
      if (!vertexIndices.has(point)) {
        vertexIndices.set(point, positions.length / 3)
        // Clip in displayed coordinates, then store physical z for the renderer.
        positions.push(point[0], point[1], visualZToPhysical(point[2]))
      }
      return vertexIndices.get(point)
    })
    for (let i = 1; i < ids.length - 1; i++) indices.push(ids[0], ids[i], ids[i + 1])
  }
  const sampleRow = (seedHat) => {
    const seed = solveRightHysteresisPoint(visualZToPhysical(seedHat), params)
    if (!seed) return null
    const state = projectState(seed.t, seed.Y, seed.z, params)
    if (!state) return null
    return {
      determinant: seed.det,
      points: zHats.map(zHat => {
        const point = solveLeaf(visualZToPhysical(zHat), state, params)
        return point && { coords: [point.t, point.Y, zHat], determinant: point.det }
      }),
    }
  }
  let previous = sampleRow(-1 + margin)
  for (let i = 1; i <= seedCount; i++) {
    const current = sampleRow(-1 + margin + (2 - 2 * margin) * i / seedCount)
    // Never join across a pole of the rational parametrization.
    if (previous && current && previous.determinant * current.determinant > 0) {
      for (let j = 0; j < leafCount; j++) {
        const corners = [previous.points[j], current.points[j], current.points[j + 1], previous.points[j + 1]]
        if (!corners.every(Boolean)) continue
        if (!corners.every(point => point.determinant * corners[0].determinant > 0)) continue
        const [a, b, c, d] = corners.map(point => point.coords)
        appendTriangle([a, b, c])
        appendTriangle([a, c, d])
      }
    }
    previous = current
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
