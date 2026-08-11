import { clamp, coordsOf, finite, pointDistance } from './coordinates.js'

function cross2(ax, az, bx, bz) {
  return ax * bz - az * bx
}

function segmentProjectedIntersection(a0, a1, b0, b1, sceneScale = [1, 1, 1]) {
  const rx = a1[0] - a0[0]
  const rz = a1[2] - a0[2]
  const sx = b1[0] - b0[0]
  const sz = b1[2] - b0[2]
  const denom = cross2(rx, rz, sx, sz)
  if (Math.abs(denom) < 1e-12) return null

  const qpx = b0[0] - a0[0]
  const qpz = b0[2] - a0[2]
  const sourceT = cross2(qpx, qpz, sx, sz) / denom
  const targetT = cross2(qpx, qpz, rx, rz) / denom
  const margin = 1e-5
  if (sourceT < -margin || sourceT > 1 + margin || targetT < -margin || targetT > 1 + margin) return null

  const s = clamp(sourceT, 0, 1)
  const t = clamp(targetT, 0, 1)
  const sourcePoint = [
    a0[0] + (a1[0] - a0[0]) * s,
    a0[1] + (a1[1] - a0[1]) * s,
    a0[2] + (a1[2] - a0[2]) * s,
  ]
  const targetPoint = [
    b0[0] + (b1[0] - b0[0]) * t,
    b0[1] + (b1[1] - b0[1]) * t,
    b0[2] + (b1[2] - b0[2]) * t,
  ]
  const yDistance = Math.abs((sourcePoint[1] - targetPoint[1]) * sceneScale[1])
  return { distance: yDistance, point: sourcePoint, sourcePoint, targetPoint }
}

function segmentRecords(segments) {
  const records = []
  for (const curve of segments ?? []) {
    const points = (curve ?? []).map(coordsOf).filter(Boolean)
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i]
      const b = points[i + 1]
      records.push({
        a,
        b,
        minX: Math.min(a[0], b[0]),
        maxX: Math.max(a[0], b[0]),
        minY: Math.min(a[1], b[1]),
        maxY: Math.max(a[1], b[1]),
        minZ: Math.min(a[2], b[2]),
        maxZ: Math.max(a[2], b[2]),
      })
    }
  }
  return records
}

function boxesCanMeet(a, b, tolerance) {
  return !(
    a.minX - tolerance > b.maxX || b.minX - tolerance > a.maxX ||
    a.minY - tolerance > b.maxY || b.minY - tolerance > a.maxY ||
    a.minZ - tolerance > b.maxZ || b.minZ - tolerance > a.maxZ
  )
}

function collectCurveIntersections(sourceSegments, targetSegments, { tolerance = 0.12, minSeparation = 0.075, maxPoints = 24, sceneScale = [1, 1, 1] } = {}) {
  const points = []
  const sourceRecords = segmentRecords(sourceSegments)
  const targetRecords = segmentRecords(targetSegments)
  if (!sourceRecords.length || !targetRecords.length) return points
  const unscaledBoxTolerance = tolerance / Math.max(1e-6, Math.min(...sceneScale.map((value) => Math.abs(value))))
  for (const source of sourceRecords) {
    for (const target of targetRecords) {
      if (!boxesCanMeet(source, target, unscaledBoxTolerance)) continue
      const hit = segmentProjectedIntersection(source.a, source.b, target.a, target.b, sceneScale)
      if (!hit || hit.distance > tolerance || !hit.point.every(finite)) continue
      const duplicate = points.some((point) => pointDistance(point, hit.point, sceneScale) < minSeparation)
      if (!duplicate) points.push(hit.point)
      if (points.length >= maxPoints) return points
    }
  }
  return points
}

function mergeNearbyIntersections(points, minSeparation = 0.16, sceneScale = [1, 1, 1]) {
  const merged = []
  for (const point of points ?? []) {
    if (!point?.every(finite)) continue
    const existing = merged.find((item) => pointDistance(item, point, sceneScale) < minSeparation)
    if (!existing) merged.push(point)
  }
  return merged
}

function pickIntersectionsByProbeSide(points, probe, maxPoints = 2, sceneScale = [1, 1, 1]) {
  const candidates = mergeNearbyIntersections(points, 0.16, sceneScale)
    .filter((coords) => (!probe ? true : pointDistance(coords, probe, sceneScale) > 0.09))
    .sort((a, b) => (probe ? pointDistance(a, probe, sceneScale) - pointDistance(b, probe, sceneScale) : 0))

  if (!probe || candidates.length <= 1) return candidates.slice(0, maxPoints)

  const lower = candidates
    .filter((coords) => coords[2] < probe[2] - 1e-6)
    .sort((a, b) => pointDistance(a, probe, sceneScale) - pointDistance(b, probe, sceneScale))[0]
  const upper = candidates
    .filter((coords) => coords[2] > probe[2] + 1e-6)
    .sort((a, b) => pointDistance(a, probe, sceneScale) - pointDistance(b, probe, sceneScale))[0]

  const selected = [lower, upper].filter(Boolean)
  if (selected.length >= maxPoints) return selected

  for (const candidate of candidates) {
    if (selected.some((point) => pointDistance(point, candidate, sceneScale) < 0.08)) continue
    selected.push(candidate)
    if (selected.length >= maxPoints) break
  }
  return selected
}

function removeBasePointIntersections(points, basePoint, sceneScale = [1, 1, 1]) {
  const baseCoords = coordsOf(basePoint)
  if (!baseCoords) return points
  return (points ?? []).filter((coords) => pointDistance(coords, baseCoords, sceneScale) > 0.14)
}

export function intersectionMarkerPoints({ point, basePoint, branch, minusSegments, plusSegments, baseMinusSegments, basePlusSegments, rarefactionSegments, compositeSegments, sceneScale }) {
  const attached = point?.attachedCurve ?? null
  const targetsRK = [...(rarefactionSegments ?? []), ...(compositeSegments ?? [])]
  const options = { tolerance: 0.065, minSeparation: 0.08, maxPoints: 30, sceneScale }
  let raw = []
  if (attached === 'H_-') {
    raw = [
      ...collectCurveIntersections([...(minusSegments ?? []), ...(baseMinusSegments ?? [])], targetsRK, options),
      ...collectCurveIntersections(plusSegments, targetsRK, options),
    ]
  } else if (attached === 'H_+') {
    raw = [
      ...collectCurveIntersections(minusSegments, targetsRK, options),
      ...collectCurveIntersections([...(plusSegments ?? []), ...(basePlusSegments ?? [])], targetsRK, options),
    ]
  } else if (attached === 'K') {
    raw = [
      ...collectCurveIntersections(minusSegments, rarefactionSegments, options),
      ...collectCurveIntersections(plusSegments, rarefactionSegments, options),
    ]
  } else if (attached === 'R') {
    raw = [
      ...collectCurveIntersections(minusSegments, compositeSegments, options),
      ...collectCurveIntersections(plusSegments, compositeSegments, options),
    ]
  }
  raw = removeBasePointIntersections(raw, basePoint, sceneScale)
  const probe = coordsOf(point)
  return pickIntersectionsByProbeSide(raw, probe, 2, sceneScale)
    .map((coords, index) => ({ coords, key: `${branch}-${attached ?? 'free'}-${index}` }))
}
