import * as THREE from 'three'

const EPS = 1e-9

export function finite(value) {
  return Number.isFinite(value)
}

function normalizePoint(point, view) {
  const tSpan = Math.max(EPS, view.tMax - view.tMin)
  const ySpan = Math.max(EPS, view.yMax - view.yMin)
  const zSpan = Math.max(EPS, view.zMax - view.zMin)
  return [
    (point[0] - view.tMin) / tSpan,
    (point[1] - view.yMin) / ySpan,
    (point[2] - view.zMin) / zSpan,
  ]
}

function distanceNormalized(a, b, view) {
  const an = normalizePoint(a, view)
  const bn = normalizePoint(b, view)
  return Math.hypot(an[0] - bn[0], an[1] - bn[1], an[2] - bn[2])
}

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function add(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

function mul(a, s) {
  return [a[0] * s, a[1] * s, a[2] * s]
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

function segmentTriangleIntersection(p0, p1, tri) {
  // Möller--Trumbore restricted to the segment p0--p1.
  const [v0, v1, v2] = tri
  const dir = sub(p1, p0)
  const edge1 = sub(v1, v0)
  const edge2 = sub(v2, v0)
  const h = cross(dir, edge2)
  const det = dot(edge1, h)
  if (Math.abs(det) < 1e-10) return null

  const invDet = 1 / det
  const s = sub(p0, v0)
  const u = invDet * dot(s, h)
  if (u < -1e-7 || u > 1 + 1e-7) return null

  const q = cross(s, edge1)
  const v = invDet * dot(dir, q)
  if (v < -1e-7 || u + v > 1 + 1e-7) return null

  const t = invDet * dot(edge2, q)
  if (t < -1e-7 || t > 1 + 1e-7) return null

  return add(p0, mul(dir, t))
}

function triangleTriangleIntersectionPoints(a, b) {
  const points = []
  const edgesA = [[a[0], a[1]], [a[1], a[2]], [a[2], a[0]]]
  const edgesB = [[b[0], b[1]], [b[1], b[2]], [b[2], b[0]]]

  for (const [p0, p1] of edgesA) {
    const p = segmentTriangleIntersection(p0, p1, b)
    if (p) points.push(p)
  }
  for (const [p0, p1] of edgesB) {
    const p = segmentTriangleIntersection(p0, p1, a)
    if (p) points.push(p)
  }

  return points
}

function triangleFromIndices(attr, i0, i1, i2) {
  const p0 = [attr.getX(i0), attr.getY(i0), attr.getZ(i0)]
  const p1 = [attr.getX(i1), attr.getY(i1), attr.getZ(i1)]
  const p2 = [attr.getX(i2), attr.getY(i2), attr.getZ(i2)]
  if (![...p0, ...p1, ...p2].every(finite)) return null
  return [p0, p1, p2]
}

function bboxNormalized(tri, view) {
  const n = tri.map((p) => normalizePoint(p, view))
  return {
    min: [0, 1, 2].map((axis) => Math.min(n[0][axis], n[1][axis], n[2][axis])),
    max: [0, 1, 2].map((axis) => Math.max(n[0][axis], n[1][axis], n[2][axis])),
  }
}

function bboxOverlap(a, b, pad = 0.006) {
  for (let axis = 0; axis < 3; axis += 1) {
    if (a.max[axis] + pad < b.min[axis] || b.max[axis] + pad < a.min[axis]) return false
  }
  return true
}

function extractTriangles(geometry, view, maxTriangles = 50000) {
  const attr = geometry?.getAttribute?.('position')
  if (!attr) return []
  const index = geometry.getIndex?.()
  const triangles = []

  if (index?.array?.length) {
    for (let i = 0; i < index.array.length; i += 3) {
      const tri = triangleFromIndices(attr, index.array[i], index.array[i + 1], index.array[i + 2])
      if (tri) triangles.push({ tri, bbox: bboxNormalized(tri, view) })
    }
  } else {
    for (let i = 0; i < attr.count - 2; i += 3) {
      const tri = triangleFromIndices(attr, i, i + 1, i + 2)
      if (tri) triangles.push({ tri, bbox: bboxNormalized(tri, view) })
    }
  }

  if (triangles.length <= maxTriangles) return triangles
  const step = Math.ceil(triangles.length / maxTriangles)
  return triangles.filter((_, i) => i % step === 0)
}

function gridKey3(i, j, k) {
  return `${i}:${j}:${k}`
}

function triangleGridKeys(bbox, cellSize) {
  const mins = bbox.min.map((v) => Math.floor(v / cellSize))
  const maxs = bbox.max.map((v) => Math.floor(v / cellSize))
  const keys = []
  for (let i = mins[0]; i <= maxs[0]; i += 1) {
    for (let j = mins[1]; j <= maxs[1]; j += 1) {
      for (let k = mins[2]; k <= maxs[2]; k += 1) keys.push(gridKey3(i, j, k))
    }
  }
  return keys
}

function buildTriangleGrid(triangles, cellSize) {
  const grid = new Map()
  triangles.forEach((entry, index) => {
    for (const key of triangleGridKeys(entry.bbox, cellSize)) {
      if (!grid.has(key)) grid.set(key, [])
      grid.get(key).push(index)
    }
  })
  return grid
}

function hashPoint(point, view, cellSize) {
  const n = normalizePoint(point, view)
  return `${Math.round(n[0] / cellSize)}:${Math.round(n[1] / cellSize)}:${Math.round(n[2] / cellSize)}`
}

function dedupePoints(points, view, cellSize = 0.004) {
  const map = new Map()
  for (const point of points) {
    if (!point || !point.every(finite)) continue
    const key = hashPoint(point, view, cellSize)
    const current = map.get(key)
    if (!current) map.set(key, { sum: [...point], count: 1 })
    else {
      current.sum[0] += point[0]
      current.sum[1] += point[1]
      current.sum[2] += point[2]
      current.count += 1
    }
  }
  return Array.from(map.values()).map(({ sum, count }) => sum.map((v) => v / count))
}

function pairSegmentFromIntersectionPoints(points, view) {
  const unique = dedupePoints(points, view, 0.0009)
  if (unique.length < 2) return null
  if (unique.length === 2) return [unique[0], unique[1]]

  let bestA = unique[0]
  let bestB = unique[1]
  let bestDistance = -Infinity
  for (let i = 0; i < unique.length; i += 1) {
    for (let j = i + 1; j < unique.length; j += 1) {
      const d = distanceNormalized(unique[i], unique[j], view)
      if (d > bestDistance) {
        bestDistance = d
        bestA = unique[i]
        bestB = unique[j]
      }
    }
  }
  return [bestA, bestB]
}

export function buildMeshIntersectionSegments(slowGeometries, fastGeometries, view) {
  const slowTriangles = slowGeometries.flatMap((geometry) => extractTriangles(geometry, view))
  const fastTriangles = fastGeometries.flatMap((geometry) => extractTriangles(geometry, view))
  if (!slowTriangles.length || !fastTriangles.length) return []

  const cellSize = 0.032
  const fastGrid = buildTriangleGrid(fastTriangles, cellSize)
  const segments = []
  const seenPairs = new Set()

  slowTriangles.forEach((slow, slowIndex) => {
    const candidateFast = new Set()
    for (const key of triangleGridKeys(slow.bbox, cellSize)) {
      const bucket = fastGrid.get(key)
      if (bucket) bucket.forEach((index) => candidateFast.add(index))
    }

    for (const fastIndex of candidateFast) {
      const pairKey = `${slowIndex}:${fastIndex}`
      if (seenPairs.has(pairKey)) continue
      seenPairs.add(pairKey)
      const fast = fastTriangles[fastIndex]
      if (!bboxOverlap(slow.bbox, fast.bbox, 0.003)) continue
      const pairPoints = triangleTriangleIntersectionPoints(slow.tri, fast.tri)
      const segment = pairSegmentFromIntersectionPoints(pairPoints, view)
      if (segment) segments.push(segment)
    }
  })

  return segments
}

function pointKey(point, view, cellSize) {
  const n = normalizePoint(point, view)
  return `${Math.round(n[0] / cellSize)}:${Math.round(n[1] / cellSize)}:${Math.round(n[2] / cellSize)}`
}

function averageCluster(points) {
  const sum = points.reduce((acc, point) => [acc[0] + point[0], acc[1] + point[1], acc[2] + point[2]], [0, 0, 0])
  return sum.map((v) => v / points.length)
}

export function stitchIntersectionSegments(rawSegments, view) {
  if (!rawSegments.length) return []

  const nodeCellSize = 0.018
  const clusters = new Map()
  rawSegments.forEach((segment, segmentIndex) => {
    segment.forEach((point, endIndex) => {
      const key = pointKey(point, view, nodeCellSize)
      if (!clusters.has(key)) clusters.set(key, [])
      clusters.get(key).push({ point, segmentIndex, endIndex })
    })
  })

  const endpointToNode = new Map()
  const nodes = []
  Array.from(clusters.values()).forEach((items) => {
    const nodeIndex = nodes.length
    nodes.push({ point: averageCluster(items.map((item) => item.point)), edges: [] })
    items.forEach(({ segmentIndex, endIndex }) => endpointToNode.set(`${segmentIndex}:${endIndex}`, nodeIndex))
  })

  const edgeMap = new Map()
  rawSegments.forEach((segment, segmentIndex) => {
    const a = endpointToNode.get(`${segmentIndex}:0`)
    const b = endpointToNode.get(`${segmentIndex}:1`)
    if (a == null || b == null || a === b) return
    const key = a < b ? `${a}:${b}` : `${b}:${a}`
    if (edgeMap.has(key)) return
    const edgeIndex = edgeMap.size
    const edge = { a, b }
    edgeMap.set(key, edge)
    nodes[a].edges.push(edgeIndex)
    nodes[b].edges.push(edgeIndex)
  })

  const edges = Array.from(edgeMap.values())
  const usedEdges = new Set()
  const otherEnd = (edge, node) => (edge.a === node ? edge.b : edge.a)

  function traceFrom(startNode, firstEdgeIndex) {
    const polyline = [startNode]
    let currentNode = startNode
    let currentEdgeIndex = firstEdgeIndex

    while (currentEdgeIndex != null && !usedEdges.has(currentEdgeIndex)) {
      usedEdges.add(currentEdgeIndex)
      const edge = edges[currentEdgeIndex]
      const nextNode = otherEnd(edge, currentNode)
      polyline.push(nextNode)
      currentNode = nextNode
      const nextEdges = nodes[currentNode].edges.filter((edgeIndex) => !usedEdges.has(edgeIndex))
      currentEdgeIndex = nextEdges.length === 1 ? nextEdges[0] : null
    }
    return polyline
  }

  const polylines = []

  nodes.forEach((node, nodeIndex) => {
    if (node.edges.length !== 2) {
      node.edges.forEach((edgeIndex) => {
        if (!usedEdges.has(edgeIndex)) polylines.push(traceFrom(nodeIndex, edgeIndex))
      })
    }
  })

  edges.forEach((_, edgeIndex) => {
    if (!usedEdges.has(edgeIndex)) polylines.push(traceFrom(edges[edgeIndex].a, edgeIndex))
  })

  return polylines
    .map((indices) => indices.map((index) => nodes[index].point))
    .filter((points) => points.length >= 3)
}

function reverseSegment(segment) {
  return [...segment].reverse()
}

function bridgePoints(a, b, view) {
  const d = distanceNormalized(a, b, view)
  const steps = Math.max(1, Math.min(18, Math.ceil(d / 0.006)))
  const bridge = []
  for (let i = 1; i <= steps; i += 1) {
    const t = i / (steps + 1)
    bridge.push([
      a[0] * (1 - t) + b[0] * t,
      a[1] * (1 - t) + b[1] * t,
      a[2] * (1 - t) + b[2] * t,
    ])
  }
  return bridge
}

export function mergeClosePolylines(polylines, view, maxGap = 0.055) {
  const remaining = polylines
    .filter((segment) => Array.isArray(segment) && segment.length >= 2)
    .map((segment) => [...segment])
  const merged = []

  while (remaining.length) {
    let current = remaining.shift()
    let changed = true

    while (changed) {
      changed = false
      let best = null
      for (let i = 0; i < remaining.length; i += 1) {
        const candidate = remaining[i]
        const currentStart = current[0]
        const currentEnd = current[current.length - 1]
        const candidateStart = candidate[0]
        const candidateEnd = candidate[candidate.length - 1]
        const options = [
          { mode: 'append', distance: distanceNormalized(currentEnd, candidateStart, view), segment: candidate },
          { mode: 'appendReverse', distance: distanceNormalized(currentEnd, candidateEnd, view), segment: reverseSegment(candidate) },
          { mode: 'prepend', distance: distanceNormalized(currentStart, candidateEnd, view), segment: candidate },
          { mode: 'prependReverse', distance: distanceNormalized(currentStart, candidateStart, view), segment: reverseSegment(candidate) },
        ]
        for (const option of options) {
          if (option.distance <= maxGap && (!best || option.distance < best.distance)) {
            best = { ...option, index: i }
          }
        }
      }

      if (best) {
        const [candidate] = remaining.splice(best.index, 1)
        const oriented = best.mode.includes('Reverse') ? reverseSegment(candidate) : candidate
        if (best.mode.startsWith('append')) {
          const gap = bridgePoints(current[current.length - 1], oriented[0], view)
          current = [...current, ...gap, ...oriented]
        } else {
          const gap = bridgePoints(oriented[oriented.length - 1], current[0], view)
          current = [...oriented, ...gap, ...current]
        }
        changed = true
      }
    }

    merged.push(current)
  }

  return merged
}

export function smoothCurveSegment(points) {
  if (!Array.isArray(points) || points.length < 4) return points
  const vectors = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
  const curve = new THREE.CatmullRomCurve3(vectors, false, 'centripetal', 0.22)
  const smoothCount = Math.min(2200, Math.max(points.length * 12, 360))
  return curve.getPoints(smoothCount).map((p) => [p.x, p.y, p.z])
}
