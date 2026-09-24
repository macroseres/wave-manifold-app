import { buildCompositeSegmentsFromRarefaction } from '../composite/bifoliation/core.js'
import { FORWARD_HUGONIOT } from '../hugoniot/directions.js'
import { waveSpeed } from '../surfaceImplicit/state.js'
import { orientSegmentBySpeed, solutionArcOrientation } from '../waves/orientation.js'
import { compositeSpeedOrientationDiagnostics } from '../solution/internal/geometry/compositeOrientation.js'

export function orientedCompositeEdge(a, b, params) {
  const records = [a, b].map(p => ({ speed: waveSpeed(p.t, p.z, params) }))
  const orientation = solutionArcOrientation('slow', 'composite')
  const diagnostics = compositeSpeedOrientationDiagnostics(records, orientation)
  if (diagnostics.orientationStrength < 1e-8) return null
  return orientSegmentBySpeed([a, b], p => waveSpeed(p.t, p.z, params), orientation)
}

// S^- is the union of both characteristic-speed sheets over U_-.
// Only the sheet with s(K)=lambda(R) belongs to this generating rarefaction.
// The other sheet produces the transverse second foliation seen on S^-.
export function compositeMatchesGenerator(point, params) {
  const generator = point.generatorPoint
  if (!generator) return false
  const speed = waveSpeed(point.t, point.z, params)
  const characteristicSpeed = waveSpeed(generator.t, generator.z, params)
  return Number.isFinite(speed) && Number.isFinite(characteristicSpeed)
    && Math.abs(speed - characteristicSpeed) <= 1e-6 * Math.max(1, Math.abs(speed), Math.abs(characteristicSpeed))
}

export function splitCompositeByGeneratorFamily(points, params) {
  const segments = []
  let current = []
  for (const point of points) {
    if (compositeMatchesGenerator(point, params)) current.push(point)
    else { if (current.length > 1) segments.push(current); current = [] }
  }
  if (current.length > 1) segments.push(current)
  return segments
}

export function buildCompositePortrait(leaves, params, view, resolution = 40) {
  const components = []
  const renderView = { ...view, compactifiedZ: true }
  for (const leaf of leaves) {
    let componentIndex = 0
    for (const [sourceSegmentIndex, segment] of leaf.segments.entries()) {
      const result = buildCompositeSegmentsFromRarefaction(segment, params, renderView, renderView,
        'all', FORWARD_HUGONIOT, 'left', leaf.seed, {
          globalPortrait: true,
          uSamples: Math.max(40, resolution * 2), wSamples: Math.max(60, resolution * 3),
        })
      for (const points of result.segments.flatMap(points => splitCompositeByGeneratorFamily(points, params))) {
        components.push({ sourceRarefactionId: leaf.id, sourceSegmentIndex,
          componentId: `${leaf.id}-K-${componentIndex++}`, points,
          orientation: solutionArcOrientation('slow', 'composite') })
      }
    }
  }
  return components
}
