const STORAGE_KEY = 'wave-manifold.schaeffer-drawing.v1'

function validDrawing(value) {
  if (!value || !value.scales || !value.view) return false
  const { scales, view, resolution } = value
  if (!Number.isInteger(resolution) || resolution < 32 || resolution > 88) return false
  if (!['yScale', 'tauScale', 'zScale'].every(key => Number.isFinite(scales[key]) && scales[key] > 0)) return false
  return ['y', 't', 'z'].every(axis => (
    Number.isFinite(view[`${axis}Min`]) && Number.isFinite(view[`${axis}Max`])
    && view[`${axis}Min`] < view[`${axis}Max`]
  ))
}

export function readCaseDrawings(storage) {
  try {
    const saved = JSON.parse((storage ?? globalThis.localStorage)?.getItem(STORAGE_KEY) ?? '{}')
    return Object.fromEntries(Object.entries(saved ?? {}).filter(([, value]) => validDrawing(value)))
  } catch {
    return {}
  }
}

export function saveCaseDrawings(presets, storage) {
  try {
    const drawings = Object.fromEntries(Object.entries(presets)
      .filter(([, preset]) => validDrawing(preset))
      .map(([key, { scales, view, resolution }]) => [key, { scales, view, resolution }]))
    const destination = storage ?? globalThis.localStorage
    if (!destination) return false
    destination.setItem(STORAGE_KEY, JSON.stringify(drawings))
    return true
  } catch {
    return false
  }
}
