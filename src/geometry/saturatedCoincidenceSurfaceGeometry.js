import * as THREE from 'three'
import { computeLeftStateFromWavePoint } from '../entities/surfaceImplicit/index.js'
import { solveHugoniotPointForFixedState } from '../entities/waves/index.js'

const EXTENSION_FACTOR = 2.5
const CONNECTION_FACTOR = 3.0
const COINCIDENCE_Z_EXTENSION_FACTOR = 400.0
const HUGONIOT_Z_EXTENSION_FACTOR = 1.0

function sampleInterval(min, span, count) {
  return Array.from({ length: count }, (_, index) => (
    min + (index / Math.max(count - 1, 1)) * span
  ))
}

function mergeSamples(...sampleGroups) {
  return sampleGroups
    .flat()
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
    .filter((value, index, values) => index === 0 || Math.abs(value - values[index - 1]) > 1e-10)
}

function inView(point, view, tTol, yTol, zTol) {
  return (
    point &&
    point.t >= view.tMin - tTol &&
    point.t <= view.tMax + tTol &&
    point.Y >= view.yMin - yTol &&
    point.Y <= view.yMax + yTol &&
    point.z >= view.zMin - zTol &&
    point.z <= view.zMax + zTol
  )
}

export function buildSaturatedCoincidenceGeometry(params, view, resolution = 40) {
  const geometry = new THREE.BufferGeometry()

  const localSeedSamples = Math.max(120, Math.floor(resolution * 2.8))
  const extendedSeedSamples = Math.max(320, Math.floor(resolution * 5.2))
  const curveSamples = Math.max(120, Math.floor(resolution * 2.8))
  const zMin = view.zMin
  const zMax = view.zMax
  const zSpan = zMax - zMin

  if (zSpan <= 0) return geometry

  const zCenter = 0.5 * (zMin + zMax)
  const seedZSpan = COINCIDENCE_Z_EXTENSION_FACTOR * zSpan
  const seedZMin = zCenter - 0.5 * seedZSpan
  const hugoniotZSpan = HUGONIOT_Z_EXTENSION_FACTOR * zSpan
  const hugoniotZMin = zCenter - 0.5 * hugoniotZSpan
  const tSpan = Math.max(1, view.tMax - view.tMin)
  const ySpan = Math.max(1, view.yMax - view.yMin)
  const tTol = EXTENSION_FACTOR * tSpan
  const yTol = EXTENSION_FACTOR * ySpan
  const zTol = 0.5 * (Math.max(COINCIDENCE_Z_EXTENSION_FACTOR, HUGONIOT_Z_EXTENSION_FACTOR) - 1) * zSpan
  const maxJumpT = CONNECTION_FACTOR * tSpan
  const maxJumpY = CONNECTION_FACTOR * ySpan

  const curveZValues = sampleInterval(hugoniotZMin, hugoniotZSpan, curveSamples)
  const seedZValues = mergeSamples(
    sampleInterval(seedZMin, seedZSpan, extendedSeedSamples),
    sampleInterval(zMin, zSpan, localSeedSamples),
    curveZValues,
  )

  const vertices = []
  const indexGrid = Array.from({ length: seedZValues.length }, () => Array(curveZValues.length).fill(-1))

  for (let i = 0; i < seedZValues.length; i += 1) {
    const zSeed = seedZValues[i]
    const fixedState = computeLeftStateFromWavePoint(0, 0, zSeed, params)
    if (!fixedState) continue

    for (let j = 0; j < curveZValues.length; j += 1) {
      const z = curveZValues[j]
      const point = solveHugoniotPointForFixedState(z, fixedState, params)
      if (!inView(point, view, tTol, yTol, zTol)) continue

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

  for (let i = 0; i < seedZValues.length - 1; i += 1) {
    for (let j = 0; j < curveZValues.length - 1; j += 1) {
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
