export function hugoniotMinusImplicit(u, v, fixedLeftState, params) {
  const uL = fixedLeftState?.uMinus ?? fixedLeftState?.u
  const vL = fixedLeftState?.vMinus ?? fixedLeftState?.v
  const b1 = params?.b1
  const b2 = params?.b2
  const c = params?.c
  if (![u, v, uL, vL, b1, b2, c].every(Number.isFinite)) return Number.NaN
  const x = u - uL
  const y = v - vL
  return (
    y ** 3
    + b2 * x * y ** 2
    + (b1 - 1) * x ** 2 * y
    + 2 * vL * y ** 2
    + 2 * (b1 * uL + b2 * vL) * x * y
    - 2 * (vL + c) * x ** 2
  )
}
