function finite(x) { return Number.isFinite(x) }

function hysPlusPlusImplicit(u, v, params) {
  const b1 = params?.b1
  const b2 = params?.b2
  const c = params?.c
  if (![u, v, b1, b2, c].every(finite)) return Number.NaN

  const b12 = b1 * b1
  const b13 = b12 * b1
  const b14 = b13 * b1
  const b22 = b2 * b2
  const b23 = b22 * b2
  const b24 = b22 * b22
  const c2 = c * c
  const c3 = c2 * c
  const u2 = u * u
  const u3 = u2 * u
  const v2 = v * v
  const v3 = v2 * v

  return (
    b14 * b2 * u3
    + 3 * b13 * b22 * u2 * v
    + b13 * b2 * u3
    + b13 * c * u2
    + 3 * b13 * u2 * v
    + 3 * b12 * b23 * u * v2
    + 3 * b12 * b22 * u2 * v
    + 5 * b12 * b2 * c * u * v
    + 9 * b12 * b2 * u * v2
    + b12 * c * u2
    + b12 * c * v2
    + 3 * b12 * u2 * v
    + b12 * v3
    + b1 * b24 * v3
    + 3 * b1 * b23 * u * v2
    + 4 * b1 * b22 * c * v2
    + 6 * b1 * b22 * v3
    + b1 * b2 * c2 * u
    + 9 * b1 * b2 * c * u * v
    + 12 * b1 * b2 * u * v2
    + 2 * b1 * c2 * v
    + 10 * b1 * c * v2
    + 8 * b1 * v3
    + b24 * v3
    + 6 * b22 * c * v2
    + 8 * b22 * v3
    + c3
    + 9 * c2 * v
    + 24 * c * v2
    + 16 * v3
  )
}

function hysPlusMinusImplicit(u, v, params) {
  const b1 = params?.b1
  const b2 = params?.b2
  const c = params?.c
  if (![u, v, b1, b2, c].every(finite)) return Number.NaN

  const b12 = b1 * b1
  const b13 = b12 * b1
  const b14 = b13 * b1
  const b15 = b14 * b1
  const b16 = b15 * b1
  const b22 = b2 * b2
  const b23 = b22 * b2
  const b24 = b22 * b22
  const b25 = b24 * b2
  const b26 = b23 * b23
  const c2 = c * c
  const c3 = c2 * c
  const u2 = u * u
  const u3 = u2 * u
  const v2 = v * v
  const v3 = v2 * v

  return (
    b16 * b23 * u3
    + 3 * b15 * b24 * u2 * v
    + 3 * b15 * b23 * u3
    - 15 * b15 * b22 * c * u2
    - 21 * b15 * b22 * u2 * v
    + 3 * b14 * b25 * u * v2
    + 9 * b14 * b24 * u2 * v
    - 3 * b14 * b23 * c * u * v
    + 3 * b14 * b23 * u3
    - 15 * b14 * b23 * u * v2
    + 3 * b14 * b22 * c * u2
    - 27 * b14 * b22 * c * v2
    - 3 * b14 * b22 * u2 * v
    - 27 * b14 * b22 * v3
    + 48 * b14 * b2 * c2 * u
    + 48 * b14 * b2 * c * u * v
    + 12 * b14 * b2 * u * v2
    - 108 * b14 * c * u2
    - 108 * b14 * u2 * v
    + b13 * b26 * v3
    + 9 * b13 * b25 * u * v2
    + 12 * b13 * b24 * c * v2
    + 9 * b13 * b24 * u2 * v
    + 6 * b13 * b24 * v3
    - 27 * b13 * b23 * c2 * u
    - 21 * b13 * b23 * c * u * v
    + b13 * b23 * u3
    - 6 * b13 * b23 * u * v2
    - 6 * b13 * b22 * c2 * v
    + 51 * b13 * b22 * c * u2
    - 60 * b13 * b22 * c * v2
    + 57 * b13 * b22 * u2 * v
    - 42 * b13 * b22 * v3
    + 96 * b13 * b2 * c2 * u
    + 60 * b13 * b2 * c * u * v
    - 48 * b13 * b2 * u * v2
    + 64 * b13 * c3
    + 96 * b13 * c2 * v
    - 60 * b13 * c * v2
    - 100 * b13 * v3
    + 3 * b12 * b26 * v3
    + 9 * b12 * b25 * u * v2
    + 30 * b12 * b24 * c * v2
    + 3 * b12 * b24 * u2 * v
    + 24 * b12 * b24 * v3
    - 54 * b12 * b23 * c2 * u
    - 33 * b12 * b23 * c * u * v
    + 33 * b12 * b23 * u * v2
    - 27 * b12 * b22 * c3
    - 39 * b12 * b22 * c2 * v
    + 33 * b12 * b22 * c * u2
    + 33 * b12 * b22 * c * v2
    + 39 * b12 * b22 * u2 * v
    + 33 * b12 * b22 * v3
    - 48 * b12 * b2 * c2 * u
    - 48 * b12 * b2 * c * u * v
    - 12 * b12 * b2 * u * v2
    + 96 * b12 * c3
    + 72 * b12 * c2 * v
    + 108 * b12 * c * u2
    - 108 * b12 * c * v2
    + 108 * b12 * u2 * v
    - 60 * b12 * v3
    + 3 * b1 * b26 * v3
    + 3 * b1 * b25 * u * v2
    + 24 * b1 * b24 * c * v2
    + 30 * b1 * b24 * v3
    - 27 * b1 * b23 * c2 * u
    - 15 * b1 * b23 * c * u * v
    + 24 * b1 * b23 * u * v2
    - 54 * b1 * b22 * c3
    - 48 * b1 * b22 * c2 * v
    + 114 * b1 * b22 * c * v2
    + 96 * b1 * b22 * v3
    - 96 * b1 * b2 * c2 * u
    - 60 * b1 * b2 * c * u * v
    + 48 * b1 * b2 * u * v2
    - 60 * b1 * c3
    - 108 * b1 * c2 * v
    + 72 * b1 * c * v2
    + 96 * b1 * v3
    + b26 * v3
    + 6 * b24 * c * v2
    + 12 * b24 * v3
    - 27 * b22 * c3
    - 15 * b22 * c2 * v
    + 48 * b22 * c * v2
    + 48 * b22 * v3
    - 100 * c3
    - 60 * c2 * v
    + 96 * c * v2
    + 64 * v3
  )
}


function interpolateImplicitPoint(a, b, branch) {
  const denom = a.value - b.value
  const alpha = finite(denom) && Math.abs(denom) > 1e-14
    ? Math.max(0, Math.min(1, a.value / denom))
    : 0.5
  return {
    state: {
      u: a.u + alpha * (b.u - a.u),
      v: a.v + alpha * (b.v - a.v),
    },
    manifold: { t: 0, Y: 0, z: 0, branch },
  }
}

function buildImplicitStateSegments(F, bounds, params, resolution = 360, branch = 'implicit-hys') {
  if (!bounds || !params) return []
  const { uMin, uMax, vMin, vMax } = bounds
  if (![uMin, uMax, vMin, vMax].every(finite) || uMax <= uMin || vMax <= vMin) return []

  const du = (uMax - uMin) / resolution
  const dv = (vMax - vMin) / resolution
  const grid = Array.from({ length: resolution + 1 }, (_, i) => {
    const u = uMin + i * du
    return Array.from({ length: resolution + 1 }, (_, j) => {
      const v = vMin + j * dv
      return { u, v, value: F(u, v, params) }
    })
  })

  const segments = []
  for (let i = 0; i < resolution; i += 1) {
    for (let j = 0; j < resolution; j += 1) {
      const p00 = grid[i][j]
      const p10 = grid[i + 1][j]
      const p11 = grid[i + 1][j + 1]
      const p01 = grid[i][j + 1]
      const corners = [p00, p10, p11, p01]
      if (!corners.every((p) => finite(p.value))) continue

      const hits = []
      const edges = [[p00, p10], [p10, p11], [p11, p01], [p01, p00]]
      for (const [a, b] of edges) {
        if (Math.abs(a.value) < 1e-12) hits.push({ state: { u: a.u, v: a.v }, manifold: { t: 0, Y: 0, z: 0, branch } })
        if (a.value * b.value < 0) hits.push(interpolateImplicitPoint(a, b, branch))
      }

      const unique = []
      for (const h of hits) {
        if (!unique.some((q) => Math.hypot(q.state.u - h.state.u, q.state.v - h.state.v) < 1e-8)) unique.push(h)
      }
      if (unique.length === 2) segments.push(unique)
      else if (unique.length === 4) {
        segments.push([unique[0], unique[1]])
        segments.push([unique[2], unique[3]])
      }
    }
  }
  return segments
}

export function buildImplicitHysPlusMinusStateSegments(bounds, params, resolution = 380) {
  return buildImplicitStateSegments(hysPlusMinusImplicit, bounds, params, resolution, 'implicit-hys-plus-minus')
}

export function buildImplicitHysPlusPlusStateSegments(bounds, params, resolution = 380) {
  return buildImplicitStateSegments(hysPlusPlusImplicit, bounds, params, resolution, 'implicit-hys-plus-plus')
}
