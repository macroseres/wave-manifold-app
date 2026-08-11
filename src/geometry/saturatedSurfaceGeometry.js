import * as THREE from 'three'
import { computeLeftStateFromWavePoint, solveRightHysteresisPoint } from '../entities/surfaceImplicit/index.js'
import { solveHugoniotPointForFixedState } from '../entities/waves/index.js'

function inView(point, view, tTol, yTol) {
  return (
    point &&
    point.t >= view.tMin - tTol &&
    point.t <= view.tMax + tTol &&
    point.Y >= view.yMin - yTol &&
    point.Y <= view.yMax + yTol &&
    point.z >= view.zMin &&
    point.z <= view.zMax
  )
}

export function buildSaturatedGeometry(params, view, resolution = 40) {
  const geometry = new THREE.BufferGeometry()

  const hystSamples = Math.max(96, Math.floor(resolution * 2.4))
  const curveSamples = Math.max(96, Math.floor(resolution * 2.4))
  const zMin = view.zMin
  const zMax = view.zMax
  const zSpan = zMax - zMin

  if (zSpan <= 0) return geometry

  const tTol = 0.04 * Math.max(1, view.tMax - view.tMin)
  const yTol = 0.04 * Math.max(1, view.yMax - view.yMin)
  const maxJumpT = 0.25 * Math.max(1, view.tMax - view.tMin)
  const maxJumpY = 0.25 * Math.max(1, view.yMax - view.yMin)

  const vertices = []
  const indexGrid = Array.from({ length: hystSamples }, () => Array(curveSamples).fill(-1))

  for (let i = 0; i < hystSamples; i += 1) {
    const zH = zMin + (i / Math.max(hystSamples - 1, 1)) * zSpan
    const hPoint = solveRightHysteresisPoint(zH, params)
    if (!hPoint) continue

    const fixedState = computeLeftStateFromWavePoint(hPoint.t, hPoint.Y, hPoint.z, params)
    if (!fixedState) continue

    for (let j = 0; j < curveSamples; j += 1) {
      const z = zMin + (j / Math.max(curveSamples - 1, 1)) * zSpan
      const point = solveHugoniotPointForFixedState(z, fixedState, params)
      if (!inView(point, view, tTol, yTol)) continue

      const index = vertices.length / 3
      vertices.push(point.t, point.Y, point.z)
      indexGrid[i][j] = index
    }
  }

  const indices = []

  const okEdge = (a, b) => {
    if (a < 0 || b < 0) return false
    const ax = vertices[3 * a]
    const ay = vertices[3 * a + 1]
    const bx = vertices[3 * b]
    const by = vertices[3 * b + 1]
    return Math.abs(ax - bx) <= maxJumpT && Math.abs(ay - by) <= maxJumpY
  }

  for (let i = 0; i < hystSamples - 1; i += 1) {
    for (let j = 0; j < curveSamples - 1; j += 1) {
      const a = indexGrid[i][j]
      const b = indexGrid[i + 1][j]
      const c = indexGrid[i][j + 1]
      const d = indexGrid[i + 1][j + 1]

      if (okEdge(a, b) && okEdge(a, c) && okEdge(b, d) && okEdge(c, d)) {
        indices.push(a, b, c)
        indices.push(c, b, d)
      }
    }
  }

  if (vertices.length === 0 || indices.length === 0) return geometry

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
