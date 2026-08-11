import { centerState, projectMinus, projectPlus, equilibriumState } from '../geometry/stateProjections.js'
import { A, P, Q } from './algebra.js'

export function uEquilibrium(z, params) {
  return equilibriumState(z, params).u
}

export function vEquilibrium(z, params) {
  return equilibriumState(z, params).v
}

export function uEquilibriumPrime(z, { b1, b2, c }) {
  if (Math.abs(b1) < 1e-12) return Number.NaN

  const numerator = z * (2 + b2 * z)
  const numeratorPrime = 2 + 2 * b2 * z
  const denominator = 1 + z * z

  return (c / b1) * (
    (numeratorPrime * denominator - numerator * 2 * z) / (denominator * denominator)
  )
}

export function rarefactionDerivativeDtDz(z, t, params) {
  const { b1, b2 } = params
  const p = P(z, b1, b2)
  const a = A(z, b2)
  const aPrime = b2 - 2 * z

  // Sobre Y=0: u = u^E + A(z)t e
  // du/dz = -b1 z(1+z^2)t/P(z).
  if (Math.abs(p) < 1e-9 || Math.abs(a) < 1e-9) return Number.NaN

  const duDz = -b1 * z * (1 + z * z) * t / p
  const dtDz = (duDz - uEquilibriumPrime(z, params) - aPrime * t) / a

  return Number.isFinite(dtDz) ? dtDz : Number.NaN
}

export function barU(t, z, params) {
  return centerState(t, z, params).u
}

export function barV(t, z, params) {
  return centerState(t, z, params).v
}

export function computeStateFromCharacteristicPoint(t, z, params) {
  const center = centerState(t, z, params)
  if (!Number.isFinite(center.u) || !Number.isFinite(center.v)) return null

  // No plano caracteristico Y=0 temos X=0, logo U^- = U^+ = \bar U.
  return {
    t,
    Y: 0,
    z,
    uMinus: center.u,
    vMinus: center.v,
    uPlus: center.u,
    vPlus: center.v,
    uE: center.uE,
    vE: center.vE,
  }
}

export function computeLeftStateFromWavePoint(t, Y, z, params) {
  return projectMinus(t, Y, z, params)
}


export function computeRightStateFromWavePoint(t, Y, z, params) {
  return projectPlus(t, Y, z, params)
}

export function solveBackwardHugoniotPointForFixedRightState(z, fixedRightState, params) {
  if (!fixedRightState) return null

  const { b1, b2 } = params
  const uE = uEquilibrium(z, params)
  const vE = vEquilibrium(z, params)

  // u+ = uE + A(z)t + (z/2)Y
  // v+ = vE - b1 z t + (1/2)Y
  const a11 = A(z, b2)
  const a12 = 0.5 * z
  const a21 = -b1 * z
  const a22 = 0.5

  const rhs1 = fixedRightState.uPlus - uE
  const rhs2 = fixedRightState.vPlus - vE

  const det = a11 * a22 - a12 * a21
  if (!Number.isFinite(det) || Math.abs(det) < 1e-10) return null

  const t = (rhs1 * a22 - a12 * rhs2) / det
  const Y = (a11 * rhs2 - rhs1 * a21) / det

  if (!Number.isFinite(t) || !Number.isFinite(Y)) return null

  const leftState = computeLeftStateFromWavePoint(t, Y, z, params)

  return {
    t,
    Y,
    z,
    uPlus: fixedRightState.uPlus,
    vPlus: fixedRightState.vPlus,
    uMinus: leftState?.uMinus,
    vMinus: leftState?.vMinus,
    det,
  }
}

export function solveHugoniotPointForFixedState(z, fixedState, params) {
  if (!fixedState) return null

  const { b1, b2 } = params
  const uE = uEquilibrium(z, params)
  const vE = vEquilibrium(z, params)

  // u0 = uE + A(z)t - (z/2)Y
  // v0 = vE - b1 z t - (1/2)Y
  const a11 = A(z, b2)
  const a12 = -0.5 * z
  const a21 = -b1 * z
  const a22 = -0.5

  const rhs1 = fixedState.uMinus - uE
  const rhs2 = fixedState.vMinus - vE

  const det = a11 * a22 - a12 * a21
  if (!Number.isFinite(det) || Math.abs(det) < 1e-10) return null

  const t = (rhs1 * a22 - a12 * rhs2) / det
  const Y = (a11 * rhs2 - rhs1 * a21) / det

  if (!Number.isFinite(t) || !Number.isFinite(Y)) return null

  return {
    t,
    Y,
    z,
    uMinus: fixedState.uMinus,
    vMinus: fixedState.vMinus,
    det,
  }
}

export function waveSpeed(t, z, params) {
  const { a = 0, b1, b2, c } = params
  const q = Q(z, b1, b2)

  if (Math.abs(b1) < 1e-12) return Number.NaN

  return (
    a
    + (c * z * (b1 + 2 + b2 * (b1 + 1) * z)) / (b1 * (1 + z * z))
    + q * t
  )
}
