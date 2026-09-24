import { solveQuadraticRealRoots } from '../numerics/index.js'
import { physicalZToVisual } from '../../geometry/zCompactification.js'
import { realEigenDirections } from './flow.js'

// Diagnostic only; the rarefaction integrator is unchanged. Cancelling the
// removable A factor in the existing dt/dz gives
// P dt/dz = ((2-b1)z-b2)t - 2cP/[b1(1+z²)²].
// At a root of P the finite isolated singularity is (t,z)=(0,z*).
// The triangular linearization has these two real eigenvalues. Its saddle/node
// type is independent of time reversal; no attractor/repulsor claim is made.
export function rarefactionSingularities(params) {
  const { b1, b2 } = params ?? {}
  if (![b1, b2].every(Number.isFinite) || Math.abs(b1) < 1e-12) return []
  return solveQuadraticRealRoots(b1 - 1, b2, 1).map(z => {
    const transverse = (2 - b1) * z - b2
    const longitudinal = b2 + 2 * (b1 - 1) * z
    const tolerance = 1e-8 * Math.max(1, Math.abs(transverse), Math.abs(longitudinal))
    const type = Math.min(Math.abs(transverse), Math.abs(longitudinal)) <= tolerance
      ? 'degenerada' : transverse * longitudinal < 0 ? 'sela' : 'nó'
    const matrix = [[transverse, -2 * (params.c ?? 1) * longitudinal / (b1 * (1 + z * z) ** 2)], [0, longitudinal]]
    return { id: `singularity-${z}`, chart: '(τ,z)', t: 0, Y: 0, z, coords: [0, 0, z], type,
      matrix, eigenvalues: [transverse, longitudinal], eigenDirections: realEigenDirections(matrix) }
  })
}

export function nearRarefactionSingularity(point, singularities, view) {
  const zHat = physicalZToVisual(point.z)
  if (Math.abs(zHat) > 0.94) return true
  const tScale = Math.max(1e-9, view.tMax - view.tMin)
  return singularities.some(s => Math.hypot((point.t - s.t) / tScale,
    (zHat - physicalZToVisual(s.z)) / 2) < 0.055)
}

export function rarefactionInfinitySingularity(params) {
  const { b1, b2 } = params ?? {}
  if (![b1, b2].every(Number.isFinite) || Math.abs(b1) < 1e-12) return null
  // Use the actual second chart (T,x)=(-z²t,1/z), not (t,1/z).
  const eigenvalues = [b1, 1 - b1]
  const matrix = [[b1, 2 * (params.c ?? 1) * (b1 - 1) / b1], [0, 1 - b1]]
  const tolerance = 1e-8 * Math.max(1, ...eigenvalues.map(Math.abs))
  const type = eigenvalues.some(value => Math.abs(value) <= tolerance)
    ? 'degenerada' : eigenvalues[0] * eigenvalues[1] < 0 ? 'sela' : 'nó'
  // ONE mathematical point with TWO drawing positions at the cut of the chart.
  return { id: 'rarefaction-infinity', chart: '(T,Z)', type, matrix, eigenvalues,
    eigenDirections: realEigenDirections(matrix), visualPositions: [[0, 0, -1], [0, 0, 1]] }
}
