import { projectMinus, projectPlus } from '../geometry/stateProjections.js'
import { waveSpeed } from '../surfaceImplicit/state.js'
import { viscousJacobian } from '../phasePortrait/flow.js'

export const HOPF_EPS = 1e-9

export function hopfTracePlus(t, Y, z, { b1, b2 }) {
  return 2 * b1 * (1 + z * z) * t + ((b1 + 2) * z - b2) * Y
}

export function hopfTraceMinus(t, Y, z, { b1, b2 }) {
  return 2 * b1 * (1 + z * z) * t - ((b1 + 2) * z - b2) * Y
}

export function hopfPlus(Y, z, { b1, b2 }) {
  if (Math.abs(b1) < 1e-12) return NaN
  return -((b1 + 2) * z - b2) * Y / (2 * b1 * (1 + z * z))
}

export function hopfMinus(Y, z, params) {
  return -hopfPlus(Y, z, params)
}

export function hopfSpectrum(direction, t, Y, z, params) {
  const state = direction === 'plus' ? projectPlus(t, Y, z, params) : projectMinus(t, Y, z, params)
  if (!state) return { trace: NaN, determinant: NaN, discriminant: NaN }
  const { u, v } = state
  const s = waveSpeed(t, z, params)
  // M = DF(U±) - sI, with the same flux Jacobian as inspection/diagnostics.
  const [[m11, m12], [m21, m22]] = viscousJacobian([u, v], s, params)
  const trace = m11 + m22
  const determinant = m11 * m22 - m12 * m21
  return { trace, determinant, discriminant: trace * trace - 4 * determinant }
}

// Conservative interval enclosure of Δ on a physical coordinate box. This
// also covers the interiors of triangles AFTER monotone z compactification.
// Checking only vertex signs can bridge disconnected elliptic regions.
const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
const scale = (a, k) => k >= 0 ? [a[0] * k, a[1] * k] : [a[1] * k, a[0] * k]
const mul = (a, b) => {
  const products = [a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]]
  return [Math.min(...products), Math.max(...products)]
}
const square = a => [a[0] <= 0 && a[1] >= 0 ? 0 : Math.min(a[0] ** 2, a[1] ** 2), Math.max(a[0] ** 2, a[1] ** 2)]

export function hopfDiscriminantUpperBound(direction, [t, Y, z], { b1, b2, c }) {
  const z2 = square(z)
  const reciprocal = [1 / (1 + z2[1]), 1 / (1 + z2[0])]
  const uE = scale(mul(mul(z, add([2, 2], scale(z, b2))), reciprocal), c / b1)
  const vE = scale(mul(z2, reciprocal), -c)
  const sign = direction === 'plus' ? 0.5 : -0.5
  const u = add(add(uE, mul(add(add([1, 1], scale(z, b2)), scale(z2, -1)), t)), scale(mul(z, Y), sign))
  const v = add(add(vE, scale(mul(z, t), -b1)), scale(Y, sign))
  // Δ is shift invariant: (m11-m22)^2 + 4*m12*m21.
  return add(square(add(scale(u, b1), scale(v, b2))), scale(mul(v, add(v, [c, c])), 4))[1]
}
