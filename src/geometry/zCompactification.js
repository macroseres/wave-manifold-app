const Z_VISUAL_EPSILON = 1e-7

let tauDisplay = { mode: 'current', b1: 8, b2: 0.2, c: 1, tMin: null, tMax: null }

export function configureTauDisplay(mode = 'current', params = {}, view = null) {
  const allowed = new Set(['current', 'normalized', 'centered'])
  tauDisplay = {
    mode: allowed.has(mode) ? mode : 'current',
    b1: Number(params?.b1 ?? 8),
    b2: Number(params?.b2 ?? 0.2),
    c: Number(params?.c ?? 1),
    tMin: Number.isFinite(view?.tMin) ? Number(view.tMin) : null,
    tMax: Number.isFinite(view?.tMax) ? Number(view.tMax) : null,
  }
}
function normalizedTauData(z) {
  const { b1, b2, c } = tauDisplay
  const A = 1 + b2 * z - z * z
  const D = A * A + b1 * b1 * z * z
  if (!(D > 1e-14) || Math.abs(b1) < 1e-12) return null
  const sqrtD = Math.sqrt(D)
  const uE = (c * z * (2 + b2 * z)) / (b1 * (1 + z * z))
  const vE = -(c * z * z) / (1 + z * z)
  const lambda = (uE * A - vE * b1 * z) / D
  return { sqrtD, lambda }
}
export function physicalTauToVisual(tau, z) {
  if (tauDisplay.mode === 'current') return tau
  const d = normalizedTauData(z)
  if (!d) return tau
  const normalized = d.sqrtD * (tau + d.lambda)
  if (tauDisplay.mode !== 'centered') return normalized
  const { b1, b2, c } = tauDisplay
  return normalized + (Math.abs(b1) > 1e-12 ? c * b2 / b1 : 0)
}
export function visualTauToPhysical(tau, z) {
  if (tauDisplay.mode === 'current') return tau
  const d = normalizedTauData(z)
  if (!d) return tau
  const { b1, b2, c } = tauDisplay
  const shifted = tauDisplay.mode === 'centered' && Math.abs(b1) > 1e-12 ? tau - c * b2 / b1 : tau
  return shifted / d.sqrtD - d.lambda
}

export function getTauDisplayMode() { return tauDisplay.mode }

export function getTauDisplayBounds() {
  if (tauDisplay.mode === 'current') return null
  const { tMin, tMax } = tauDisplay
  if (!Number.isFinite(tMin) || !Number.isFinite(tMax) || !(tMax > tMin)) return null
  return { min: tMin, max: tMax }
}

// Limit of the infinity singularity T=0 in the selected display coordinate.
// normalized: tau_N -> -c b2/b1; centered: tau_* -> 0.
export function infinitySingularityVisualTau() {
  const { mode, b1, b2, c } = tauDisplay
  if (mode === 'normalized' && Math.abs(b1) > 1e-12) return -(c * b2) / b1
  return 0
}

export const VISUAL_Z_MIN = -1
export const VISUAL_Z_MAX = 1

export function physicalZToVisual(z) {
  if (!Number.isFinite(z)) return z
  const compactified = (2 / Math.PI) * Math.atan(z)
  // Mesh coordinates are stored as Float32. Values too close to ±1 can round
  // onto the projective boundary and make visualZToPhysical singular. Keep all
  // finite physical points strictly inside the compactified chart.
  return Math.max(VISUAL_Z_MIN + Z_VISUAL_EPSILON, Math.min(VISUAL_Z_MAX - Z_VISUAL_EPSILON, compactified))
}

export function visualZToPhysical(zHat) {
  if (!Number.isFinite(zHat)) return zHat
  const safe = Math.max(-1 + Z_VISUAL_EPSILON, Math.min(1 - Z_VISUAL_EPSILON, zHat))
  return Math.tan((Math.PI / 2) * safe)
}

export function physicalPointToVisual(point) {
  if (!point) return point
  const coords = Array.isArray(point) ? point : point.coords ?? [point.t, point.Y ?? 0, point.z]
  return [physicalTauToVisual(coords[0], coords[2]), coords[1], physicalZToVisual(coords[2])]
}

export function visualPointToPhysical(point) {
  if (!point) return point
  const coords = Array.isArray(point) ? point : point.coords ?? [point.t, point.Y ?? 0, point.z]
  const z = visualZToPhysical(coords[2])
  return [visualTauToPhysical(coords[0], z), coords[1], z]
}

export function compactifyZPositionArray(array) {
  const output = new Float32Array(array)
  for (let index = 0; index < output.length; index += 3) {
    const z = output[index + 2]
    output[index] = physicalTauToVisual(output[index], z)
    output[index + 2] = physicalZToVisual(z)
  }
  return output
}
