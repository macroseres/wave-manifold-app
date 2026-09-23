import { normalizeWavePoint } from '../shared/types/mathTypes.js'

function finitePoint(point) {
  return !!normalizeWavePoint(point)
}

function normalizedDistance(a, b, scales) {
  if (!finitePoint(a) || !finitePoint(b)) return Number.POSITIVE_INFINITY
  const pa = normalizeWavePoint(a)
  const pb = normalizeWavePoint(b)
  const dt = (pa.t - pb.t) / scales.t
  const dY = (pa.Y - pb.Y) / scales.Y
  const dz = (pa.z - pb.z) / scales.z
  return Math.sqrt(dt * dt + dY * dY + dz * dz)
}

function lerpPoint(a, b, alpha = 0.5) {
  const pa = normalizeWavePoint(a)
  const pb = normalizeWavePoint(b)
  if (!pa || !pb) return null
  return {
    t: (1 - alpha) * pa.t + alpha * pb.t,
    Y: (1 - alpha) * pa.Y + alpha * pb.Y,
    z: (1 - alpha) * pa.z + alpha * pb.z,
    coords: [
      (1 - alpha) * pa.t + alpha * pb.t,
      (1 - alpha) * pa.Y + alpha * pb.Y,
      (1 - alpha) * pa.z + alpha * pb.z,
    ],
  }
}

function finiteSpeed(point, speedFn) {
  if (!finitePoint(point) || typeof speedFn !== 'function') return Number.NaN
  const speed = speedFn(normalizeWavePoint(point))
  return Number.isFinite(speed) ? speed : Number.NaN
}

function shouldSubdivide({ left, mid, right, depth, maxDepth, scales, speedFn, tolerance, speedTolerance }) {
  if (depth >= maxDepth) return false

  const leftOk = finitePoint(left)
  const midOk = finitePoint(mid)
  const rightOk = finitePoint(right)

  // If a singularity/gap may lie inside this interval, subdivide to localize it.
  if ((leftOk || rightOk) && !midOk) return true
  if (midOk && (!leftOk || !rightOk)) return true
  if (!leftOk || !midOk || !rightOk) return false

  const chordMid = lerpPoint(left, right, 0.5)
  const curvatureError = normalizedDistance(mid, chordMid, scales)
  if (curvatureError > tolerance) return true

  const chordLength = normalizedDistance(left, right, scales)
  if (chordLength > 3.5 * tolerance) return true

  if (typeof speedFn === 'function') {
    const sLeft = finiteSpeed(left, speedFn)
    const sMid = finiteSpeed(mid, speedFn)
    const sRight = finiteSpeed(right, speedFn)
    if (Number.isFinite(sLeft) && Number.isFinite(sMid) && Number.isFinite(sRight)) {
      const speedLinearMid = 0.5 * (sLeft + sRight)
      const speedScale = Math.max(1, Math.abs(sLeft), Math.abs(sMid), Math.abs(sRight))
      if (Math.abs(sMid - speedLinearMid) / speedScale > speedTolerance) return true
    }
  }

  return false
}

/**
 * Amostrador adaptativo de uma curva parametrizada por uma variável escalar.
 *
 * Ele ainda usa a parametrização algébrica z ↦ X(z), mas abandona a malha
 * uniforme. O intervalo é refinado onde a curva tem curvatura, salto, mudança
 * rápida de velocidade ou singularidades numéricas. Isso é uma etapa
 * intermediária antes de Newton/pseudo-arclength completo.
 */
export function sampleParametricCurveAdaptive({
  zMin,
  zMax,
  initialSamples = 96,
  maxDepth = 8,
  tolerance = 0.015,
  speedTolerance = 0.015,
  maxPoints = 2400,
  evaluate,
  speedFn,
  scales = { t: 1, Y: 1, z: 1 },
}) {
  if (typeof evaluate !== 'function' || !Number.isFinite(zMin) || !Number.isFinite(zMax) || zMin === zMax) {
    return []
  }

  const safeScales = {
    t: Math.max(1e-12, Math.abs(scales.t ?? 1)),
    Y: Math.max(1e-12, Math.abs(scales.Y ?? 1)),
    z: Math.max(1e-12, Math.abs(scales.z ?? 1)),
  }

  const n = Math.max(4, Math.floor(initialSamples))
  const budget = { remaining: Math.max(n + 1, maxPoints) }
  const result = []

  function evalAt(z) {
    try {
      const point = evaluate(z)
      return finitePoint(point) ? { ...normalizeWavePoint(point), parameter: z } : null
    } catch {
      return null
    }
  }

  function pushPoint(point) {
    if (budget.remaining <= 0) return
    result.push(point)
    budget.remaining -= 1
  }

  function recurse(z0, p0, z1, p1, depth) {
    if (budget.remaining <= 0) return
    const zm = 0.5 * (z0 + z1)
    const pm = evalAt(zm)

    if (shouldSubdivide({
      left: p0,
      mid: pm,
      right: p1,
      depth,
      maxDepth,
      scales: safeScales,
      speedFn,
      tolerance,
      speedTolerance,
    })) {
      recurse(z0, p0, zm, pm, depth + 1)
      recurse(zm, pm, z1, p1, depth + 1)
      return
    }

    // Preserve gaps explicitly. splitSegmentsAtLargeJumps will also guard later.
    if (pm && !p0) pushPoint(null)
    if (pm) pushPoint(pm)
    if (!pm && p0 && p1) pushPoint(null)
  }

  let prevZ = zMin
  let prevPoint = evalAt(prevZ)
  pushPoint(prevPoint)

  for (let i = 1; i <= n && budget.remaining > 0; i += 1) {
    const z = zMin + (i / n) * (zMax - zMin)
    const point = evalAt(z)
    recurse(prevZ, prevPoint, z, point, 0)
    pushPoint(point)
    prevZ = z
    prevPoint = point
  }

  // Remove immediate duplicate object positions/nulls introduced at interval boundaries.
  const cleaned = []
  for (const point of result) {
    const last = cleaned[cleaned.length - 1]
    if (!point && !last) continue
    if (point && last && normalizedDistance(point, last, safeScales) < 1e-12) continue
    cleaned.push(point)
  }
  return cleaned
}
