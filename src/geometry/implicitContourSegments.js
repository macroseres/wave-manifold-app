import { finite } from './projectionBounds.js'
import { solveRightHysteresisPoint } from '../entities/surfaceImplicit/index.js'
import { projectPointMinus, projectPointPlus } from '../entities/geometry/stateProjections.js'
import { inflectionImplicitJ, hysPlusMinusImplicit, hysPlusPlusImplicit } from './physicalImplicitFunctions.js'

export function buildImplicitSegments(F, bounds, params, resolution = 96) {
  if (!bounds || !params) return []
  const { uMin, uMax, vMin, vMax } = bounds
  if (![uMin, uMax, vMin, vMax].every(finite) || uMax <= uMin || vMax <= vMin) return []

  const du = (uMax - uMin) / resolution
  const dv = (vMax - vMin) / resolution
  const grid = Array.from({ length: resolution + 1 }, (_, i) => {
    const uu = uMin + i * du
    return Array.from({ length: resolution + 1 }, (_, j) => {
      const vv = vMin + j * dv
      return { u: uu, v: vv, value: F(uu, vv, params) }
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
      edges.forEach(([a, b]) => {
        if (Math.abs(a.value) < 1e-12) hits.push({ u: a.u, v: a.v })
        if (a.value * b.value < 0) hits.push(interpolateImplicitPoint(a, b))
      })

      const unique = []
      hits.forEach((h) => {
        if (!unique.some((q) => Math.hypot(q.u - h.u, q.v - h.v) < 1e-9)) unique.push(h)
      })

      if (unique.length === 2) segments.push(unique)
      else if (unique.length === 4) {
        segments.push([unique[0], unique[1]])
        segments.push([unique[2], unique[3]])
      }
    }
  }
  return segments
}

export function buildHysPlusProjectionSamples(params, view, side, samples = 240) {
  if (!params || !view) return []
  const out = []
  for (let i = 0; i < samples; i += 1) {
    const z = view.zMin + (i * (view.zMax - view.zMin)) / Math.max(1, samples - 1)
    const h = solveRightHysteresisPoint(z, params)
    if (!h) continue
    const projected = side === 'minus' ? projectPointMinus(h, params) : projectPointPlus(h, params)
    if (!projected) continue
    const uu = side === 'minus' ? projected.uMinus : projected.uPlus
    const vv = side === 'minus' ? projected.vMinus : projected.vPlus
    if (finite(uu) && finite(vv) && Math.abs(uu) < 1e4 && Math.abs(vv) < 1e4) out.push({ u: uu, v: vv })
  }
  return out
}

export function interpolateImplicitPoint(a, b) {
  const denom = a.value - b.value
  if (!finite(denom) || Math.abs(denom) < 1e-14) {
    return { u: 0.5 * (a.u + b.u), v: 0.5 * (a.v + b.v) }
  }
  const alpha = Math.min(1, Math.max(0, a.value / denom))
  return {
    u: a.u + alpha * (b.u - a.u),
    v: a.v + alpha * (b.v - a.v),
  }
}


export function buildImplicitInflectionSegments(bounds, params, resolution = 120) {
  return buildImplicitSegments(inflectionImplicitJ, bounds, params, resolution)
}

export function buildImplicitHysPlusMinusSegments(bounds, params, resolution = 260) {
  return buildImplicitSegments(hysPlusMinusImplicit, bounds, params, resolution)
}

export function buildImplicitHysPlusPlusSegments(bounds, params, resolution = 260) {
  return buildImplicitSegments(hysPlusPlusImplicit, bounds, params, resolution)
}
