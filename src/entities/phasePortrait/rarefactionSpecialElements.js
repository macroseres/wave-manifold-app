import { rarefactionSingularities, rarefactionInfinitySingularity } from './rarefactionSingularities.js'
import { rarefactionRegularizedField, rarefactionInfinityField } from '../surfaceImplicit/state.js'
import { integrateOrbit } from '../numerics/integrateOrbit.js'
import { makeRarefactionParam, findRarefactionSonicAnchors } from '../composite/bifoliation/parametrization.js'

export function buildRarefactionSpecialElements(leaves, params, view) {
  const singularities = rarefactionSingularities(params)
  const infinity = rarefactionInfinitySingularity(params)
  const separatrices = [], eigenDirections = [], inflections = []
  for (const leaf of leaves) for (const segment of leaf.segments) {
    const parameter = makeRarefactionParam(segment, view)
    if (!parameter) continue
    for (const anchor of findRarefactionSonicAnchors(parameter, params, 'left', leaf.seed, view, 'all')) {
      inflections.push({ ...anchor.point, sourceRarefactionId: leaf.id })
    }
  }
  for (const singularity of [...singularities, ...(infinity ? [infinity] : [])]) {
    const atInfinity = singularity === infinity
    const origin = atInfinity ? [0, 0] : [0, singularity.z]
    const field = point => (atInfinity ? rarefactionInfinityField : rarefactionRegularizedField)(point, params)
    const radius = Math.max(4, Math.abs(view.zMin), Math.abs(view.zMax), ...singularities.map(s => Math.abs(s.z) + 2))
    const bounds = atInfinity ? { uMin: -20, uMax: 20, vMin: -0.75, vMax: 0.75 }
      : { uMin: view.tMin, uMax: view.tMax, vMin: -radius, vMax: radius }
    const physical = ([t, z]) => atInfinity
      ? Math.abs(z) > 1e-10 ? { t: -t * z * z, Y: 0, z: 1 / z, coords: [-t * z * z, 0, 1 / z] } : null
      : { t, Y: 0, z, coords: [t, 0, z] }
    for (const [index, direction] of singularity.eigenDirections.entries()) {
      // The direction tangent to Z=0 collapses in the app's compactified τ
      // display. Keep it in the matrix/metadata, never invent a visible arc.
      if (atInfinity && Math.abs(direction.vector[1]) < 1e-10) continue
      const stability = direction.value < 0 ? 'stable' : 'unstable'
      const offset = amount => origin.map((x, i) => x + amount * direction.vector[i])
      for (const sign of [-1, 1]) {
        const axis = [physical(offset(sign * 0.002)), physical(offset(sign * 0.08))].filter(Boolean)
        eigenDirections.push({ singularityId: singularity.id, stability, points: axis })
        if (singularity.type !== 'sela') continue
        const epsilon = 1e-5
        const seed = offset(sign * epsilon)
        const orbit = integrateOrbit(field, seed, bounds, Math.sign(direction.value), {
          maxTime: 160, maxPoints: 4000, tolerance: 1e-9, chordTolerance: 1e-5,
        })
        const points = orbit.map(physical).filter(Boolean)
        if (points.length > 1) separatrices.push({ id: `${singularity.id}-${index}-${sign}`,
          singularityId: singularity.id, chart: singularity.chart, stability, points, chartPoints: orbit })
        // The boundary of a coordinate chart is not an endpoint of an orbit.
        // Continue from exactly the last accepted point in the overlapping chart.
        const travelDirection = Math.sign(direction.value)
        const endpoint = travelDirection < 0 ? orbit[0] : orbit.at(-1)
        const needsContinuation = endpoint && (atInfinity
          ? Math.abs(endpoint[1]) > 0.70
          : Math.abs(endpoint[1]) > 0.95 * radius)
        if (!needsContinuation) continue
        const [u, v] = endpoint
        // This coordinate transition is its own inverse.
        const nextSeed = [-u * v * v, 1 / v]
        const nextDirection = travelDirection * Math.sign(v)
        const nextField = point => (atInfinity ? rarefactionRegularizedField : rarefactionInfinityField)(point, params)
        const nextBounds = atInfinity
          ? { uMin: view.tMin, uMax: view.tMax, vMin: -radius, vMax: radius }
          : { uMin: -Math.max(20, 2 * Math.abs(nextSeed[0])), uMax: Math.max(20, 2 * Math.abs(nextSeed[0])), vMin: -0.75, vMax: 0.75 }
        const toPhysical = ([a, b]) => atInfinity
          ? { t: a, Y: 0, z: b, coords: [a, 0, b] }
          : { t: -a * b * b, Y: 0, z: 1 / b, coords: [-a * b * b, 0, 1 / b] }
        const continued = integrateOrbit(nextField, nextSeed, nextBounds, nextDirection, {
          maxTime: 400, maxPoints: 8000, maxAttempts: 20000, tolerance: 1e-10, chordTolerance: 1e-5,
          stopWhen: point => {
            const p = toPhysical(point)
            return (!atInfinity && Math.abs(point[1]) < 1e-6) || p.t < view.tMin || p.t > view.tMax
          },
        })
        if (continued.length > 1) separatrices.push({ id: `${singularity.id}-${index}-${sign}-continuation`,
          singularityId: singularity.id, chart: atInfinity ? '(τ,z)' : '(T,Z)',
          stability, points: continued.map(toPhysical), chartPoints: continued })
      }
    }
  }
  return { singularities, infinity, separatrices, eigenDirections, inflections }
}
