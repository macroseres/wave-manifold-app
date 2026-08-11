// Projeções canônicas do espaço (t,Y,z) para os espaços de estados.
// Convenção usada no aplicativo:
//   Z = 1/z, X = zY, T = -z^2 t,
//   U^+ - U^- = X(1,Z) = (zY,Y),
//   U^\pm = \bar U \pm 1/2 (zY,Y).

export function equilibriumState(z, params) {
  const { b1, b2, c } = params
  const den = 1 + z * z
  if (Math.abs(b1) < 1e-12 || Math.abs(den) < 1e-12) {
    return { u: Number.NaN, v: Number.NaN }
  }

  return {
    u: (c * z * (2 + b2 * z)) / (b1 * den),
    v: -(c * z * z) / den,
  }
}

export function centerState(t, z, params) {
  const { b1, b2 } = params
  const eq = equilibriumState(z, params)

  return {
    u: eq.u + (1 + b2 * z - z * z) * t,
    v: eq.v - b1 * z * t,
    uE: eq.u,
    vE: eq.v,
  }
}

export function projectMinus(t, Y, z, params) {
  const center = centerState(t, z, params)
  const u = center.u - 0.5 * z * Y
  const v = center.v - 0.5 * Y

  if (!Number.isFinite(u) || !Number.isFinite(v)) return null
  return { t, Y, z, uMinus: u, vMinus: v, u, v }
}

export function projectPlus(t, Y, z, params) {
  const center = centerState(t, z, params)
  const u = center.u + 0.5 * z * Y
  const v = center.v + 0.5 * Y

  if (!Number.isFinite(u) || !Number.isFinite(v)) return null
  return { t, Y, z, uPlus: u, vPlus: v, u, v }
}

export function projectStates(t, Y, z, params) {
  const minus = projectMinus(t, Y, z, params)
  const plus = projectPlus(t, Y, z, params)
  if (!minus || !plus) return null
  return { t, Y, z, minus, plus }
}

export function projectPointMinus(point, params) {
  if (!point) return null
  return projectMinus(point.t, point.Y ?? 0, point.z, params)
}

export function projectPointPlus(point, params) {
  if (!point) return null
  return projectPlus(point.t, point.Y ?? 0, point.z, params)
}

export function projectPointStates(point, params) {
  if (!point) return null
  return projectStates(point.t, point.Y ?? 0, point.z, params)
}
