export const displayCoordinates = {
  tau: 'τ',
  Y: 'Y',
  z: 'z',
}

export const displayCoordinateTex = {
  tau: '\\tau',
  Y: 'Y',
  z: 'z',
  manifold: '\\tau,Y,z',
  coincidence: '\\tau=0,\\;Y=0',
}

export function formatNumber(value, digits = 4) {
  return Number.isFinite(value) ? Number(value).toFixed(digits) : '—'
}
