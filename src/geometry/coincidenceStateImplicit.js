export function coincidenceStateImplicit(u, v, params) {
  const b1 = params?.b1
  const b2 = params?.b2
  const c = params?.c
  if (![u, v, b1, b2, c].every(Number.isFinite)) return Number.NaN
  return (b1 * u + b2 * v) ** 2 + 4 * v * (v + c)
}
