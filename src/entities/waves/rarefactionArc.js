import { FORWARD_HUGONIOT, BACKWARD_HUGONIOT } from '../hugoniot/directions.js'
import { buildRarefactionContinuationLeaf } from './rarefactionLeaf.js'

function finite(value) {
  return Number.isFinite(value)
}

function decoratePointLike(point) {
  if (!point) return null
  const t = point.t ?? point.coords?.[0]
  const Y = point.Y ?? point.coords?.[1] ?? 0
  const z = point.z ?? point.coords?.[2]
  const speed = point.speed
  if (![t, Y, z].every(finite)) return null
  return {
    ...point,
    t,
    Y,
    z,
    speed,
    coords: [t, Y, z],
  }
}

function inView(point, view, marginT = 0.10, marginZ = 0) {
  const tPad = marginT * Math.max(1, view.tMax - view.tMin)
  const zPad = marginZ * Math.max(1, view.zMax - view.zMin)
  return (
    point &&
    point.t >= view.tMin - tPad &&
    point.t <= view.tMax + tPad &&
    point.z >= view.zMin - zPad &&
    point.z <= view.zMax + zPad
  )
}

function splitVisibleRuns(points, view) {
  const runs = []
  let current = []
  for (const raw of points ?? []) {
    const point = decoratePointLike(raw)
    if (!point) continue
    if (inView(point, view)) {
      current.push(point)
    } else if (current.length) {
      if (current.length >= 2) runs.push(current)
      current = []
    }
  }
  if (current.length >= 2) runs.push(current)
  return runs
}

function pointDistance(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY
  const at = a.t ?? a.coords?.[0]
  const aY = a.Y ?? a.coords?.[1] ?? 0
  const az = a.z ?? a.coords?.[2]
  const bt = b.t ?? b.coords?.[0]
  const bY = b.Y ?? b.coords?.[1] ?? 0
  const bz = b.z ?? b.coords?.[2]
  if (![at, aY, az, bt, bY, bz].every(finite)) return Number.POSITIVE_INFINITY
  return Math.hypot(at - bt, aY - bY, az - bz)
}

function normalizedEndpoint(endpoint) {
  if (!endpoint) return null
  const t = endpoint.t ?? endpoint.coords?.[0]
  const Y = endpoint.Y ?? endpoint.coords?.[1] ?? 0
  const z = endpoint.z ?? endpoint.coords?.[2]
  if (![t, Y, z].every(finite)) return null
  return {
    ...endpoint,
    t,
    Y,
    z,
    coords: [t, Y, z],
  }
}

function splitAtAnchor(points, anchorPoint) {
  const anchor = normalizedEndpoint(anchorPoint)
  if (!anchor || !Array.isArray(points) || points.length < 2) return { backward: [], forward: [] }

  let bestIndex = -1
  let bestDistance = Number.POSITIVE_INFINITY
  for (let i = 0; i < points.length; i += 1) {
    const distance = pointDistance(points[i], anchor)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = i
    }
  }
  if (bestIndex < 0) return { backward: [], forward: [] }

  return {
    backward: points.slice(0, bestIndex + 1),
    forward: points.slice(bestIndex),
  }
}

function enforceSpeedMode(segment, speedMode) {
  const clean = (segment ?? []).map(decoratePointLike).filter(Boolean)
  if (clean.length < 2) return []

  // Mantém somente a componente conexa a partir do ponto clicado, usando a
  // orientação de velocidade apenas para selecionar o arco visual/admissível.
  const out = [clean[0]]
  let previous = clean[0]
  for (let i = 1; i < clean.length; i += 1) {
    const point = clean[i]
    if (!finite(point.speed) || !finite(previous.speed)) break
    const ok = speedMode === 'decreasing'
      ? point.speed < previous.speed - 1e-9
      : point.speed > previous.speed + 1e-9
    if (!ok) break
    out.push(point)
    previous = point
  }
  return out.length >= 2 ? out : []
}

function maybeStopAtCoincidence(segment, stopAtCoincidence) {
  if (!stopAtCoincidence || !Array.isArray(segment) || segment.length < 2) return segment
  const out = [segment[0]]
  for (let i = 1; i < segment.length; i += 1) {
    const previous = out[out.length - 1]
    const point = segment[i]
    if (previous.t * point.t <= 0 && Math.abs(previous.t - point.t) > 1e-12) {
      const alpha = previous.t / (previous.t - point.t)
      const zCoincidence = previous.z + alpha * (point.z - previous.z)
      out.push({
        t: 0,
        Y: 0,
        z: zCoincidence,
        coords: [0, 0, zCoincidence],
        speed: previous.speed + alpha * (point.speed - previous.speed),
        isCoincidenceIntersection: true,
        branchLabel: 'rarefação lenta ∩ coincidência',
        branchLabelTex: '\\mathcal{R}_-\\cap\\mathcal{E}',
      })
      return out.length >= 2 ? out : []
    }
    out.push(point)
  }
  return out
}

export function buildRarefactionArcSegments(anchorPoint, params, view, samples = 900, speedMode = 'increasing', options = {}) {
  if (!anchorPoint || !finite(anchorPoint.t) || !finite(anchorPoint.z)) return []

  const direction = speedMode === 'decreasing' ? BACKWARD_HUGONIOT : FORWARD_HUGONIOT
  const leaf = buildRarefactionContinuationLeaf({
    fixedState: anchorPoint,
    params,
    view,
    samples: Math.max(900, samples * 2),
    direction,
  })
  const globalSegments = leaf.curve?.segments ?? []
  if (!globalSegments.length) return []

  const stopAtCoincidence = Boolean(options.stopAtCoincidence)
  const zDirection = finite(options.zDirection) ? Math.sign(options.zDirection) : 0
  const visibleSegments = []

  for (const segment of globalSegments) {
    const clean = (segment ?? []).map(decoratePointLike).filter(Boolean)
    if (clean.length < 2) continue
    const { backward, forward } = splitAtAnchor(clean, anchorPoint)
    const candidates = []
    if (zDirection <= 0 && backward.length >= 2) candidates.push(backward.slice().reverse())
    if (zDirection >= 0 && forward.length >= 2) candidates.push(forward)

    for (const candidate of candidates) {
      const monotone = maybeStopAtCoincidence(enforceSpeedMode(candidate, speedMode), stopAtCoincidence)
      for (const run of splitVisibleRuns(monotone, view)) {
        if (run.length >= 2) visibleSegments.push(run)
      }
    }
  }

  return visibleSegments
}

export function trimRarefactionArcSegmentsToEndpoint(segments, endpoint) {
  const target = normalizedEndpoint(endpoint)
  if (!target || !Array.isArray(segments) || !segments.length) return segments

  let best = { segmentIndex: -1, pointIndex: -1, distance: Number.POSITIVE_INFINITY }
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i]
    if (!Array.isArray(segment) || segment.length < 2) continue
    for (let j = 0; j < segment.length; j += 1) {
      const distance = pointDistance(segment[j], target)
      if (distance < best.distance) best = { segmentIndex: i, pointIndex: j, distance }
    }
  }

  if (best.segmentIndex < 0 || best.pointIndex < 1) return segments

  const selected = segments[best.segmentIndex]
  const trimmed = selected.slice(0, best.pointIndex + 1)
  return trimmed.length >= 2 ? [trimmed] : []
}
