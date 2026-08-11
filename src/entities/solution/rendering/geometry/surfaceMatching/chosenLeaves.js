import { buildHugoniotBifoliation, selectLeafFromBifoliation } from '../../../../waves/index.js'
import { solveBackwardHugoniotPointForFixedRightState } from '../../../../surfaceImplicit/index.js'
import { withCoords } from '../../../../../geometry/pointUtils.js'
import { HUGONIOT } from '../../../../../config/numerics.js'
import { coordsOf, normalizedDistanceLocal } from '../pointGeometry.js'

export function buildChosenHPlusLeafSegments(rightState, params, view, resolution) {
  if (!rightState || !params || !view) return []
  const samples = Math.max(260, Math.min(560, resolution * 7))
  const bifoliation = buildHugoniotBifoliation({
    fixedState: rightState,
    params,
    view,
    samples,
    zExtensionMargin: HUGONIOT.Z_EXTENSION_MARGIN,
  })
  const leaf = selectLeafFromBifoliation(bifoliation, 'plus')
  return (leaf?.curve?.segments ?? [])
    .map((segment) => (segment ?? []).map(coordsOf).filter(Boolean))
    .filter((segment) => segment.length >= 2)
}

export function buildChosenHMinusLeafSegments(leftState, params, view, resolution) {
  if (!leftState || !params || !view) return []
  const samples = Math.max(260, Math.min(560, resolution * 7))
  const bifoliation = buildHugoniotBifoliation({
    fixedState: leftState,
    params,
    view,
    samples,
    zExtensionMargin: HUGONIOT.Z_EXTENSION_MARGIN,
  })
  const leaf = selectLeafFromBifoliation(bifoliation, 'minus')
  return (leaf?.curve?.segments ?? [])
    .map((segment) => (segment ?? []).map(coordsOf).filter(Boolean))
    .filter((segment) => segment.length >= 2)
}

export function chosenHPlusContainsSurfacePoint(point, params, view) {
  if (!point?.chosenRightState || !point?.surfacePoint) return false
  const projected = withCoords(solveBackwardHugoniotPointForFixedRightState(point.surfacePoint.z, point.chosenRightState, params))
  return normalizedDistanceLocal(projected, point.surfacePoint, view) <= 1e-6
}

export function chosenHMinusIsFromRarefaction(point) {
  return point?.slowKind === 'k' && point?.chosenLeftState && Number.isFinite(point?.chosenLeftStateDistance)
}
