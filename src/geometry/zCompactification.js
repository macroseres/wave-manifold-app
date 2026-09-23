const Z_VISUAL_EPSILON = 1e-7
export const VISUAL_Z_MIN = -1
export const VISUAL_Z_MAX = 1

export function physicalZToVisual(z) {
  return Number.isFinite(z) ? (2 / Math.PI) * Math.atan(z) : z
}

export function visualZToPhysical(zHat) {
  if (!Number.isFinite(zHat)) return zHat
  const safe = Math.max(-1 + Z_VISUAL_EPSILON, Math.min(1 - Z_VISUAL_EPSILON, zHat))
  return Math.tan((Math.PI / 2) * safe)
}

export function physicalPointToVisual(point) {
  if (!point) return point
  const coords = Array.isArray(point) ? point : point.coords ?? [point.t, point.Y ?? 0, point.z]
  return [coords[0], coords[1], physicalZToVisual(coords[2])]
}

export function compactifyZPositionArray(array) {
  const output = new Float32Array(array)
  for (let index = 2; index < output.length; index += 3) output[index] = physicalZToVisual(output[index])
  return output
}
