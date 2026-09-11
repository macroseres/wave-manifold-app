import { P, Q } from './algebra.js'

export function sonicImplicitF(Y, t, z, { b1, b2, c }) {
  const p = P(z, b1, b2)
  const q = Q(z, b1, b2)

  // Equação equivalente a S_R = 0, multiplicada por 2z(1+z^2):
  // -2 b1(1+z^2)((b1+1)z^3 - b2 + 3z)t
  // +(1+z^2)Q(z)Y + 2cP(z) = 0.
  const tCoeff = -2 * b1 * (1 + z * z) * ((b1 + 1) * z ** 3 - b2 + 3 * z)
  const yCoeff = (1 + z * z) * q
  const constTerm = 2 * c * p

  return tCoeff * t + yCoeff * Y + constTerm
}

export function sonicLeftImplicitF(Y, t, z, params) {
  // S_L e obtida de S_R pela troca Y -> -Y.
  return sonicImplicitF(-Y, t, z, params)
}

export function sonicLeftBranchIndicator(Y, t, z, { b1, b2 }) {
  return Y * (b1 * z - b2 + 2 * z) - 2 * b1 * t * (1 + z * z)
}

export function sonicRightBranchIndicator(Y, t, z, { b1, b2 }) {
  return -Y * (b1 * z - b2 + 2 * z) - 2 * b1 * t * (1 + z * z)
}

export function solveSonicBranchSeparatorPoint(side, z, params) {
  const tCoeff = sonicLineTCoeff(z, params)
  const yCoeff = sonicLineYCoeff(z, params)
  const constTerm = sonicLineConst(z, params)
  const indicatorTCoeff = -2 * params.b1 * (1 + z * z)
  const indicatorYCoeff = side === 'left'
    ? params.b1 * z - params.b2 + 2 * z
    : -(params.b1 * z - params.b2 + 2 * z)

  const det = side === 'left'
    ? tCoeff * indicatorYCoeff + yCoeff * indicatorTCoeff
    : tCoeff * indicatorYCoeff - yCoeff * indicatorTCoeff
  if (!Number.isFinite(det) || Math.abs(det) < 1e-10) return null

  const t = (-constTerm * indicatorYCoeff) / det
  const Y = (indicatorTCoeff * constTerm) / det
  if (![t, Y, z].every(Number.isFinite)) return null
  return { t, Y, z }
}

export function hysteresisRightImplicitF(Y, t, z, { b1, b2, c }) {
  const q = Q(z, b1, b2)

// Condição de tangência da folha de Hugoniot à sônica direita.
// Hys+ é definida conjuntamente por S_R = 0 e H_R = 0.
// A expressão abaixo é uma forma equivalente de H_R = 0,
// multiplicada por 2z(1+z^2):
//
// -4b1(1+z^2)Q(z)t
// +(b1+1)(1+z^2)[b2 - 4z - b2(b1+1)z^2]Y
// -4czQ(z) = 0.
  const tCoeff = -4 * b1 * (1 + z * z) * q
  const yCoeff = (b1 + 1) * (1 + z * z) * (b2 - 4 * z - b2 * (b1 + 1) * z * z)
  const constTerm = -4 * c * z * q

  return tCoeff * t + yCoeff * Y + constTerm
}

export function solveRightHysteresisPoint(z, params) {
  const { b1, b2, c } = params
  const p = P(z, b1, b2)
  const q = Q(z, b1, b2)

  // Resolve simultaneamente S_R=0 e H_R=0. Assim H_R e' renderizada
  // como curva contida em S_R, e nao como superficie independente.
  const sT = -2 * b1 * (1 + z * z) * ((b1 + 1) * z ** 3 - b2 + 3 * z)
  const sY = (1 + z * z) * q
  const sC = 2 * c * p

  const hT = -4 * b1 * (1 + z * z) * q
  const hY = (b1 + 1) * (1 + z * z) * (b2 - 4 * z - b2 * (b1 + 1) * z * z)
  const hC = -4 * c * z * q

  const det = sT * hY - sY * hT
  if (!Number.isFinite(det) || Math.abs(det) < 1e-10) return null

  const t = (-sC * hY + sY * hC) / det
  const Y = (-sT * hC + sC * hT) / det

  if (!Number.isFinite(Y) || !Number.isFinite(t)) return null

  return { t, Y, z, det }
}

// Hys^- = S^- cap H_L and, by symmetry, Hys^-(z) = (t_+(z), -Y_+(z), z).
export function solveLeftHysteresisPoint(z, params) {
  const point = solveRightHysteresisPoint(z, params)
  if (!point) return null
  return { ...point, Y: -point.Y, coords: [point.t, -point.Y, point.z] }
}

export function sonicLineTCoeff(z, { b1, b2 }) {
  return -2 * b1 * (1 + z * z) * ((b1 + 1) * z ** 3 - b2 + 3 * z)
}

export function sonicLineYCoeff(z, { b1, b2 }) {
  return (1 + z * z) * Q(z, b1, b2)
}

export function sonicLineConst(z, { b1, b2, c }) {
  return 2 * c * P(z, b1, b2)
}
