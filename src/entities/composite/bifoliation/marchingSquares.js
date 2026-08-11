import { COMPOSITE } from '../../../config/numerics.js'
import { finite, uniqueSortedUnit, makeClusteredUnitGrid } from './sampling.js'
import { splitSegmentsByZWindow, compositeBounds, doubleSonicZValues, collectDoubleSonicUvFocuses } from './continuation.js'

function contourEdgePoint(corners, edge) {
  const edgeCorners = [
    [0, 1], // bottom: (u0,w0) -> (u1,w0)
    [1, 2], // right:  (u1,w0) -> (u1,w1)
    [3, 2], // top:    (u0,w1) -> (u1,w1)
    [0, 3], // left:   (u0,w0) -> (u0,w1)
  ]
  const pair = edgeCorners[edge]
  if (!pair) return null
  const a = corners[pair[0]]
  const b = corners[pair[1]]
  if (!a || !b || !finite(a.value) || !finite(b.value)) return null
  const denom = a.value - b.value
  let alpha = Math.abs(denom) > 1e-14 ? a.value / denom : 0.5
  if (!finite(alpha)) alpha = 0.5
  alpha = Math.max(0, Math.min(1, alpha))
  return {
    u: a.u + alpha * (b.u - a.u),
    w: a.w + alpha * (b.w - a.w),
  }
}

function marchingSquarePairs(mask) {
  switch (mask) {
    case 0:
    case 15:
      return []
    case 1: return [[3, 0]]
    case 2: return [[0, 1]]
    case 3: return [[3, 1]]
    case 4: return [[1, 2]]
    case 5: return [[3, 2], [0, 1]]
    case 6: return [[0, 2]]
    case 7: return [[3, 2]]
    case 8: return [[2, 3]]
    case 9: return [[0, 2]]
    case 10: return [[0, 3], [1, 2]]
    case 11: return [[1, 2]]
    case 12: return [[1, 3]]
    case 13: return [[0, 1]]
    case 14: return [[3, 0]]
    default: return []
  }
}

function uvKey(uv, precision = 1e-8) {
  return `${Math.round(uv.u / precision)}:${Math.round(uv.w / precision)}`
}

function edgeKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

function buildPolylinesFromUvEdges(uvEdges, level) {
  const nodes = new Map()
  const adjacency = new Map()
  const edges = new Set()

  const addNode = (uv) => {
    const key = uvKey(uv)
    if (!nodes.has(key)) nodes.set(key, { key, uv })
    return key
  }

  const connect = (ka, kb) => {
    if (!ka || !kb || ka === kb) return
    const ek = edgeKey(ka, kb)
    if (edges.has(ek)) return
    edges.add(ek)
    if (!adjacency.has(ka)) adjacency.set(ka, new Set())
    if (!adjacency.has(kb)) adjacency.set(kb, new Set())
    adjacency.get(ka).add(kb)
    adjacency.get(kb).add(ka)
  }

  for (const [a, b] of uvEdges) connect(addNode(a), addNode(b))

  const pointCache = new Map()
  const pointForKey = (key) => {
    if (pointCache.has(key)) return pointCache.get(key)
    const uv = nodes.get(key)?.uv
    const obj = uv ? level.evalAt(uv.u, uv.w) : null
    const point = obj?.point?.coords?.every(finite)
      ? { ...obj.point, compositeU: uv.u, compositeW: uv.w, coords: [...obj.point.coords] }
      : null
    pointCache.set(key, point)
    return point
  }

  const visited = new Set()
  const traceFrom = (start, next) => {
    const keys = [start]
    let prev = start
    let curr = next
    visited.add(edgeKey(start, next))
    while (curr) {
      keys.push(curr)
      const neighbors = [...(adjacency.get(curr) ?? [])]
      const candidate = neighbors.find((key) => key !== prev && !visited.has(edgeKey(curr, key)))
      if (!candidate) break
      visited.add(edgeKey(curr, candidate))
      prev = curr
      curr = candidate
      if (curr === start) {
        keys.push(curr)
        break
      }
    }
    return keys
  }

  const polylines = []
  const starts = [...nodes.keys()].filter((key) => (adjacency.get(key)?.size ?? 0) !== 2)
  for (const start of starts) {
    for (const next of adjacency.get(start) ?? []) {
      const ek = edgeKey(start, next)
      if (visited.has(ek)) continue
      const keys = traceFrom(start, next)
      const segment = keys.map(pointForKey).filter(Boolean)
      if (segment.length >= 2) polylines.push(segment)
    }
  }

  for (const ek of [...edges]) {
    if (visited.has(ek)) continue
    const [start, next] = ek.split('|')
    const keys = traceFrom(start, next)
    const segment = keys.map(pointForKey).filter(Boolean)
    if (segment.length >= 2) polylines.push(segment)
  }

  return polylines
}

export function extractGlobalCompositeLevelSet(level, renderView, params) {
  const bounds = compositeBounds()
  const baseUSamples = Math.max(20, Math.floor(COMPOSITE.GLOBAL_LEVELSET_U_SAMPLES ?? 150))
  const baseWSamples = Math.max(20, Math.floor(COMPOSITE.GLOBAL_LEVELSET_W_SAMPLES ?? 220))
  const valueCap = Math.max(1, COMPOSITE.GLOBAL_LEVELSET_VALUE_CAP ?? 1e8)
  const uSpan = bounds.uMax - bounds.uMin
  const wSpan = bounds.wMax - bounds.wMin
  const wFocus = bounds.wMin <= 0 && bounds.wMax >= 0 ? (0 - bounds.wMin) / Math.max(1e-12, wSpan) : 0.5
  const dsView = { ...renderView, tMin: renderView.tMin - Math.max(1, renderView.tMax - renderView.tMin), tMax: renderView.tMax + Math.max(1, renderView.tMax - renderView.tMin) }
  const doubleSonicZs = params ? doubleSonicZValues(params, dsView) : []
  const doubleSonicFocuses = doubleSonicZs.length ? collectDoubleSonicUvFocuses(level, bounds, doubleSonicZs) : { u: [], w: [] }
  const uUnitGrid = uniqueSortedUnit([
    ...makeClusteredUnitGrid(baseUSamples, 0.5, 0.0, 2.0),
    ...doubleSonicFocuses.u.flatMap((focus) => makeClusteredUnitGrid(Math.max(10, Math.floor(baseUSamples * 0.14)), focus, 0.72, 2.0)),
  ])
  const wUnitGrid = uniqueSortedUnit([
    ...makeClusteredUnitGrid(
    baseWSamples,
    wFocus,
    COMPOSITE.SATURATED_SURFACE_ETA_CLUSTER_FRACTION ?? 0.65,
    COMPOSITE.SATURATED_SURFACE_ETA_CLUSTER_POWER ?? 2.8,
    ),
    ...doubleSonicFocuses.w.flatMap((focus) => makeClusteredUnitGrid(Math.max(12, Math.floor(baseWSamples * 0.12)), focus, 0.72, 2.0)),
  ])
  const uSamples = Math.max(1, uUnitGrid.length - 1)
  const wSamples = Math.max(1, wUnitGrid.length - 1)

  const grid = Array.from({ length: uSamples + 1 }, () => Array(wSamples + 1).fill(null))
  for (let i = 0; i <= uSamples; i += 1) {
    const u = bounds.uMin + uUnitGrid[i] * uSpan
    for (let j = 0; j <= wSamples; j += 1) {
      const w = bounds.wMin + wUnitGrid[j] * wSpan
      const obj = level.evalAt(u, w)
      const value = obj?.value
      if (!finite(value) || Math.abs(value) > valueCap) continue
      grid[i][j] = { u, w, value }
    }
  }

  const uvEdges = []
  for (let i = 0; i < uSamples; i += 1) {
    for (let j = 0; j < wSamples; j += 1) {
      const c00 = grid[i][j]
      const c10 = grid[i + 1][j]
      const c11 = grid[i + 1][j + 1]
      const c01 = grid[i][j + 1]
      const corners = [c00, c10, c11, c01]
      if (corners.some((corner) => !corner)) continue
      let mask = 0
      if (c00.value >= 0) mask |= 1
      if (c10.value >= 0) mask |= 2
      if (c11.value >= 0) mask |= 4
      if (c01.value >= 0) mask |= 8
      for (const [edgeA, edgeB] of marchingSquarePairs(mask)) {
        const a = contourEdgePoint(corners, edgeA)
        const b = contourEdgePoint(corners, edgeB)
        if (a && b && finite(a.u) && finite(a.w) && finite(b.u) && finite(b.w)) uvEdges.push([a, b])
      }
    }
  }

  const segments = buildPolylinesFromUvEdges(uvEdges, level)
  // Mantem todos os componentes encontrados, mas recorta cada polilinha
  // ao intervalo computacional em z (view ja vem com margem de 20%).
  return splitSegmentsByZWindow(segments, renderView)
}

