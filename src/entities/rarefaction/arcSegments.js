import {
  rarefactionDerivativeDtDz,
  waveSpeed,
} from '../surfaceImplicit/index.js'

function finite(value) {
  return Number.isFinite(value)
}

function rk4Step(z, t, h, params) {
  const k1 = rarefactionDerivativeDtDz(z, t, params)
  const k2 = rarefactionDerivativeDtDz(z + 0.5 * h, t + 0.5 * h * k1, params)
  const k3 = rarefactionDerivativeDtDz(z + 0.5 * h, t + 0.5 * h * k2, params)
  const k4 = rarefactionDerivativeDtDz(z + h, t + h * k3, params)

  if (![k1, k2, k3, k4].every(finite)) return null
  return t + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
}

function expandedView(view, tMargin = 2.4, zMargin = 0) {
  const tSpan = Math.max(1, view.tMax - view.tMin)
  const zSpan = Math.max(1, view.zMax - view.zMin)
  return {
    ...view,
    tMin: view.tMin - tMargin * tSpan,
    tMax: view.tMax + tMargin * tSpan,
    zMin: view.zMin - zMargin * zSpan,
    zMax: view.zMax + zMargin * zSpan,
  }
}

function inExpandedView(point, view, marginT = 0.04, marginZ = 0.04) {
  const tPad = marginT * Math.max(1, view.tMax - view.tMin)
  const zPad = marginZ * Math.max(1, view.zMax - view.zMin)
  return (
    point &&
    finite(point.t) &&
    finite(point.z) &&
    point.t >= view.tMin - tPad &&
    point.t <= view.tMax + tPad &&
    point.z >= view.zMin - zPad &&
    point.z <= view.zMax + zPad
  )
}

function decoratePoint(t, z, params) {
  const speed = waveSpeed(t, z, params)
  if (!finite(speed)) return null
  return {
    t,
    Y: 0,
    z,
    speed,
    coords: [t, 0, z],
  }
}

function traceMonotoneBranch(start, params, view, direction, steps, speedMode = 'increasing', stopAtCoincidence = false, enforceMonotonicity = true) {
  const points = [start]
  let previous = start
  let t = start.t
  let z = start.z
  const zEnd = direction > 0 ? view.zMax : view.zMin
  const total = Math.abs(zEnd - z)
  if (total <= 1e-12) return []

  const h = direction * total / Math.max(steps, 1)
  const maxJumpT = 0.14 * Math.max(1, view.tMax - view.tMin)

  for (let i = 1; i <= steps; i += 1) {
    const nextT = rk4Step(z, t, h, params)
    const nextZ = z + h
    if (!finite(nextT) || !finite(nextZ)) break
    if (Math.abs(nextT - t) > maxJumpT) break

    const point = decoratePoint(nextT, nextZ, params)
    if (!point || !inExpandedView(point, view)) break
    const ok = speedMode === 'decreasing'
      ? point.speed < previous.speed - 1e-9
      : point.speed > previous.speed + 1e-9
    if (enforceMonotonicity && !ok) break

    if (stopAtCoincidence && previous.t * point.t <= 0 && Math.abs(previous.t - point.t) > 1e-12) {
      const alpha = previous.t / (previous.t - point.t)
      const zCoincidence = previous.z + alpha * (point.z - previous.z)
      const coincidencePoint = decoratePoint(0, zCoincidence, params)
      if (coincidencePoint) {
        points.push({
          ...coincidencePoint,
          isCoincidenceIntersection: true,
          branchLabel: 'rarefação lenta ∩ coincidência',
          branchLabelTex: '\\mathcal{R}_s\\cap\\mathcal{E}',
        })
      }
      break
    }

    points.push(point)
    previous = point
    t = nextT
    z = nextZ
  }

  return points.length >= 2 ? points : []
}

export function buildRarefactionArcSegments(anchorPoint, params, view, samples = 1600, speedMode = 'increasing', options = {}) {
  if (!anchorPoint || !finite(anchorPoint.t) || !finite(anchorPoint.z)) return []

  const calcView = expandedView(view)
  const start = decoratePoint(anchorPoint.t, anchorPoint.z, params)
  if (!start || !inExpandedView(start, calcView, 0.08, 0.08)) return []

  const halfSteps = Math.max(800, Math.floor(samples / 2))
  const stopAtCoincidence = Boolean(options.stopAtCoincidence)
  const enforceMonotonicity = options.enforceMonotonicity !== false
  const backward = traceMonotoneBranch(start, params, calcView, -1, halfSteps, speedMode, stopAtCoincidence, enforceMonotonicity)
  const forward = traceMonotoneBranch(start, params, calcView, 1, halfSteps, speedMode, stopAtCoincidence, enforceMonotonicity)

  // Cada arco de rarefação é orientado a partir do ponto inicial clicado
  // até o ponto final, usando o modo de velocidade solicitado.
  return [backward, forward].filter((segment) => segment.length >= 2)
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
  const trimmed = selected.slice(0, best.pointIndex + 1).map((point) => ({ ...point }))
  trimmed[trimmed.length - 1] = {
    ...trimmed[trimmed.length - 1],
    ...target,
    speed: trimmed[trimmed.length - 1]?.speed,
  }

  return trimmed.length >= 2 ? [trimmed] : segments
}
