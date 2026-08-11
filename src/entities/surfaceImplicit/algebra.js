// Coordenadas: X = zY, T = -z^2 t, Z = 1/z.
// Com a correção:
//   \bar u = u^E - (Z^2 + b2 Z - 1)T = u^E + (1 + b2 z - z^2)t
//   \bar v = v^E + b1 ZT = v^E - b1 z t

export function P(z, b1, b2) {
  // P(1/z) = P(z)/z^2 nesta carta.
  return 1 + b2 * z + (b1 - 1) * z * z
}

export function Q(z, b1, b2) {
  // Q(1/z) = Q(z)/z^2 nesta carta.
  return 1 + b2 * (b1 + 1) * z - (b1 + 1) * z * z
}

export function A(z, b2) {
  // A(z) = 1 + b2 z - z^2 = z^2(Z^2 + b2 Z - 1).
  return 1 + b2 * z - z * z
}
