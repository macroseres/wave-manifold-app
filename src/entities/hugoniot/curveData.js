import { FORWARD_HUGONIOT, BACKWARD_HUGONIOT, normalizeHugoniotDirection } from './directions.js'
import { buildHugoniotBifoliation, selectLeafFromBifoliation } from '../waves/index.js'
import { waveColors } from '../../config/waveColors.js'
import { HUGONIOT } from '../../config/numerics.js'

export function buildHugoniotCurveData(fixedState, params, view, samples = 500, direction = FORWARD_HUGONIOT, { compactifiedZ = false } = {}) {
  const bifoliation = buildHugoniotBifoliation({
    fixedState,
    params,
    view,
    samples,
    zExtensionMargin: HUGONIOT.Z_EXTENSION_MARGIN,
    compactifiedZ,
  })
  const branch = normalizeHugoniotDirection(direction) === BACKWARD_HUGONIOT ? 'plus' : 'minus'
  const leaf = selectLeafFromBifoliation(bifoliation, branch)
  return {
    bifoliation,
    leaf,
    segments: leaf?.curve?.segments ?? [],
    markers: leaf?.curve?.metadata?.markers ?? [],
  }
}

export function flattenVisibleHugoniotIntersections(intersectionGroups) {
  if (!intersectionGroups) return []

  const groups = [
    { key: 'characteristic', label: 'C', color: waveColors.characteristicNeutral },
    { key: 'sonicRight', label: 'S^+', color: waveColors.sonicRightNeutral ?? waveColors.sonicRight },
    { key: 'sonicLeft', label: 'S^-', color: waveColors.sonicLeftNeutral },
  ]

  const points = []
  const seen = new Set()

  for (const group of groups) {
    const items = intersectionGroups[group.key] ?? []
    for (const point of items) {
      if (!point?.visibleInWindow) continue
      if (![point.t, point.Y, point.z].every(Number.isFinite)) continue

      const id = `${group.key}:${point.t.toFixed(7)}:${point.Y.toFixed(7)}:${point.z.toFixed(7)}`
      if (seen.has(id)) continue
      seen.add(id)

      points.push({
        ...point,
        intersectionLabel: point.kind ?? group.label,
        markerColor: point.markerColor ?? group.color,
      })
    }
  }

  return points
}
