import * as THREE from 'three'
import { marchingCubes } from 'isosurface'

function clamp01(x) {
  return Math.max(0, Math.min(1, x))
}

function clusteredUnitCoordinate(q, focus = 0.5, fraction = 0, power = 3) {
  const f = clamp01(focus)
  const amount = clamp01(fraction)
  if (amount <= 1e-9) return q

  // Mapeamento monotono que aproxima linhas de grade do foco.
  // Mantem 0->0 e 1->1, evitando trocar a matematica da superficie.
  const p = Math.max(1.0001, power)
  let clustered
  if (q <= f) {
    const local = f <= 1e-12 ? 0 : q / f
    clustered = f * Math.pow(local, p)
  } else {
    const local = (1 - q) / Math.max(1e-12, 1 - f)
    clustered = 1 - (1 - f) * Math.pow(local, p)
  }
  return (1 - amount) * q + amount * clustered
}

export function buildImplicitSurfaceGeometry(
  F,
  params,
  view,
  resolution = 72,
  trimZ = 0.0,
  options = {}
) {
  const dims = [resolution, resolution, resolution]

  const ySpan = view.yMax - view.yMin
  const tSpan = view.tMax - view.tMin
  const zSpan = view.zMax - view.zMin

  if (ySpan <= 0 || tSpan <= 0 || zSpan <= 0) {
    return new THREE.BufferGeometry()
  }

  const zFocus = view.zMin <= 0 && view.zMax >= 0
    ? (0 - view.zMin) / zSpan
    : 0.5
  const zClusterFraction = options?.zClusterNearZero
    ? (options.zClusterFraction ?? 0.7)
    : 0
  const zClusterPower = options?.zClusterPower ?? 3
  const zFromGrid = (gridZ) => {
    const q = gridZ / Math.max(1, resolution - 1)
    const warped = clusteredUnitCoordinate(q, zFocus, zClusterFraction, zClusterPower)
    return view.zMin + warped * zSpan
  }

  const result = marchingCubes(dims, (x, y, z) => {
    const T = view.tMin + (x / (resolution - 1)) * tSpan
    const Y = view.yMin + (y / (resolution - 1)) * ySpan
    const zz = zFromGrid(z)

    const val = F(Y, T, zz, params)
    if (!Number.isFinite(val)) return NaN
    return val
  })

  const geometry = new THREE.BufferGeometry()

  if (!result || !result.positions || !result.cells || result.positions.length === 0 || result.cells.length === 0) {
    return geometry
  }

  const realPositions = result.positions.map((p) => {
    const T = view.tMin + (p[0] / (resolution - 1)) * tSpan
    const Y = view.yMin + (p[1] / (resolution - 1)) * ySpan
    const z = zFromGrid(p[2])
    return [T, Y, z]
  })

  const keptCells = []
  for (const cell of result.cells) {
    const z1 = realPositions[cell[0]][2]
    const z2 = realPositions[cell[1]][2]
    const z3 = realPositions[cell[2]][2]
    const cellPoints = cell.map((index) => {
      const [T, Y, z] = realPositions[index]
      return { t: T, Y, z }
    })

    if (trimZ > 0) {
      const nearLower =
        z1 < view.zMin + trimZ || z2 < view.zMin + trimZ || z3 < view.zMin + trimZ
      const nearUpper =
        z1 > view.zMax - trimZ || z2 > view.zMax - trimZ || z3 > view.zMax - trimZ

      if (nearLower || nearUpper) continue
    }
    if (options.includeCell && !options.includeCell(cellPoints, cell)) continue
    keptCells.push(cell)
  }

  if (keptCells.length === 0) return geometry

  const used = new Set()
  for (const cell of keptCells) {
    used.add(cell[0])
    used.add(cell[1])
    used.add(cell[2])
  }

  const indexMap = new Map()
  const positions = []
  let nextIndex = 0

  for (const oldIndex of used) {
    indexMap.set(oldIndex, nextIndex++)
    const [T, Y, z] = realPositions[oldIndex]
    positions.push(T, Y, z)
  }

  const indices = []
  for (const cell of keptCells) {
    indices.push(indexMap.get(cell[0]), indexMap.get(cell[1]), indexMap.get(cell[2]))
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}
