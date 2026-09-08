import * as THREE from 'three'
import { computeLeftStateFromWavePoint, computeRightStateFromWavePoint } from '../entities/surfaceImplicit/index.js'
import { solveBackwardHugoniotPointForFixedRightState, solveHugoniotPointForFixedState } from '../entities/waves/index.js'
import { VISUAL_Z_MAX, VISUAL_Z_MIN, visualZToPhysical } from './zCompactification.js'

const EXTENSION_FACTOR = 2.5
const CONNECTION_FACTOR = 3.0
const VISUAL_Z_MARGIN = 1e-4

function sampleInterval(min, span, count) {
  return Array.from({ length: count }, (_, index) => (
    min + (index / Math.max(count - 1, 1)) * span
  ))
}

function sampleCompactifiedZ(count) {
  const zHatMin = VISUAL_Z_MIN + VISUAL_Z_MARGIN
  const zHatSpan = VISUAL_Z_MAX - VISUAL_Z_MIN - 2 * VISUAL_Z_MARGIN
  return Array.from({ length: count }, (_, index) => {
    const fraction = index / Math.max(count - 1, 1)
    return visualZToPhysical(zHatMin + fraction * zHatSpan)
  })
}

function mergeSamples(...sampleGroups) {
  return sampleGroups
    .flat()
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
    .filter((value, index, values) => index === 0 || Math.abs(value - values[index - 1]) > 1e-10)
}

function inView(point, view, tTol, yTol) {
  return (
    point &&
    point.t >= view.tMin - tTol &&
    point.t <= view.tMax + tTol &&
    point.Y >= view.yMin - yTol &&
    point.Y <= view.yMax + yTol
  )
}

export function buildSaturatedCoincidenceGeometry(params, view, resolution = 40, direction = 'minus') {
  const geometry = new THREE.BufferGeometry()

  const localSeedSamples = Math.max(120, Math.floor(resolution * 2.8))
  const extendedSeedSamples = Math.max(320, Math.floor(resolution * 5.2))
  const curveSamples = Math.max(120, Math.floor(resolution * 2.8))
  const zMin = view.zMin
  const zMax = view.zMax
  const zSpan = zMax - zMin

  if (zSpan <= 0) return geometry

  const tSpan = Math.max(1, view.tMax - view.tMin)
  const ySpan = Math.max(1, view.yMax - view.yMin)
  const tTol = EXTENSION_FACTOR * tSpan
  const yTol = EXTENSION_FACTOR * ySpan
  const maxJumpT = CONNECTION_FACTOR * tSpan
  const maxJumpY = CONNECTION_FACTOR * ySpan

  // Tanto a geratriz E quanto cada folha H_± percorrem todo o eixo
  // compactificado. As amostras físicas locais reforçam a região central.
  const curveZValues = mergeSamples(
    sampleCompactifiedZ(Math.max(220, Math.floor(curveSamples * 1.5))),
    sampleInterval(zMin, zSpan, curveSamples),
  )
  const seedZValues = mergeSamples(
    sampleCompactifiedZ(extendedSeedSamples),
    sampleInterval(zMin, zSpan, localSeedSamples),
  )

  const vertices = []
  const indexGrid = Array.from({ length: seedZValues.length }, () => Array(curveZValues.length).fill(-1))

  for (let i = 0; i < seedZValues.length; i += 1) {
    const zSeed = seedZValues[i]
    const fixedState = direction === 'plus'
      ? computeRightStateFromWavePoint(0, 0, zSeed, params)
      : computeLeftStateFromWavePoint(0, 0, zSeed, params)
    if (!fixedState) continue

    for (let j = 0; j < curveZValues.length; j += 1) {
      const z = curveZValues[j]
      const point = direction === 'plus'
        ? solveBackwardHugoniotPointForFixedRightState(z, fixedState, params)
        : solveHugoniotPointForFixedState(z, fixedState, params)
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
