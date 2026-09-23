import { BACKWARD_HUGONIOT, FORWARD_HUGONIOT, normalizeHugoniotDirection } from '../../hugoniot/directions.js'
import { sonicLeftBranchIndicator, sonicLeftImplicitF, sonicImplicitF, sonicRightBranchIndicator } from '../../surfaceImplicit/index.js'
import { buildRarefactionBifoliation, selectLeafFromBifoliation } from '../../waves/basicBifoliations.js'
import { RAREFACTION, COMPOSITE } from '../../../config/numerics.js'

export function finite(value) {
  return Number.isFinite(value)
}


export function uniqueSortedUnit(values) {
  const clean = []
  for (const value of values ?? []) {
    if (!finite(value)) continue
    if (value < -1e-9 || value > 1 + 1e-9) continue
    const clamped = Math.min(1, Math.max(0, value))
    if (!clean.some((x) => Math.abs(x - clamped) < 1e-9)) clean.push(clamped)
  }
  clean.sort((a, b) => a - b)
  return clean
}

export function limitUnitFocuses(values, maxCount = 12) {
  const clean = uniqueSortedUnit(values)
  if (clean.length <= maxCount) return clean
  const out = []
  for (let i = 0; i < maxCount; i += 1) {
    const index = Math.round((i / Math.max(1, maxCount - 1)) * (clean.length - 1))
    out.push(clean[index])
  }
  return uniqueSortedUnit(out)
}

export function makeClusteredUnitGrid(count, focusUnit = 0.5, clusterFraction = 0.45, clusterPower = 2.2) {
  const n = Math.max(2, Math.floor(count ?? 2))
  const uniform = []
  for (let i = 0; i <= n; i += 1) uniform.push(i / n)

  const focus = Math.min(1, Math.max(0, focusUnit))
  const extra = Math.max(8, Math.floor(n * Math.max(0, clusterFraction)))
  const clustered = []
  for (let k = -extra; k <= extra; k += 1) {
    const q = k / Math.max(1, extra)
    const signed = Math.sign(q) * Math.pow(Math.abs(q), Math.max(1.01, clusterPower))
    const radius = q < 0 ? focus : 1 - focus
    clustered.push(focus + signed * radius)
  }

  return uniqueSortedUnit([...uniform, ...clustered, 0, 1])
}

export function normalizePoint(point) {
  if (!point) return null
  const t = point.t ?? point.coords?.[0]
  const Y = point.Y ?? point.coords?.[1] ?? 0
  const z = point.z ?? point.coords?.[2]
  if (![t, Y, z].every(finite)) return null
  return { ...point, t, Y, z, coords: [t, Y, z] }
}

export function normalizedPointDistance(a, b, view) {
  if (!a || !b) return Number.POSITIVE_INFINITY
  const tauScale = Math.max(1, Math.abs(view.tMax - view.tMin))
  const yScale = Math.max(1, Math.abs(view.yMax - view.yMin))
  const zScale = Math.max(1, Math.abs(view.zMax - view.zMin))
  return Math.hypot(
    ((a.t ?? 0) - (b.t ?? 0)) / tauScale,
    ((a.Y ?? 0) - (b.Y ?? 0)) / yScale,
    ((a.z ?? 0) - (b.z ?? 0)) / zScale,
  )
}

export function sonicValue(point, params, sonicTarget = 'left') {
  if (!point || ![point.t, point.Y, point.z].every(finite)) return null
  const value = sonicTarget === 'right'
    ? sonicImplicitF(point.Y, point.t, point.z, params)
    : sonicLeftImplicitF(point.Y, point.t, point.z, params)
  return finite(value) ? value : null
}

export function sonicBranchIndicator(point, params, sonicTarget = 'left') {
  if (!point || ![point.t, point.Y, point.z].every(finite)) return null
  const indicator = sonicTarget === 'right'
    ? sonicRightBranchIndicator(point.Y, point.t, point.z, params)
    : sonicLeftBranchIndicator(point.Y, point.t, point.z, params)
  return finite(indicator) ? indicator : null
}

export function sonicBranchMatches(point, params, sonicTarget = 'left', desiredBranch = 'all') {
  if (desiredBranch !== 'slow' && desiredBranch !== 'fast') return true
  const indicator = sonicBranchIndicator(point, params, sonicTarget)
  if (!finite(indicator)) return false
  const eps = 1e-7
  return desiredBranch === 'slow' ? indicator <= eps : indicator >= -eps
}

export function sonicValueOnRarefaction(t, z, params, sonicTarget = 'left') {
  const value = sonicTarget === 'right'
    ? sonicImplicitF(0, t, z, params)
    : sonicLeftImplicitF(0, t, z, params)
  return finite(value) ? value : null
}

export function pointInsideRarefactionComputationView(point, view) {
  const t = point?.t ?? point?.coords?.[0]
  const z = point?.z ?? point?.coords?.[2]
  // A geratriz da composta é limitada apenas em z para coincidir com a
  // rarefação desenhada. Não cortamos por tau.
  return finite(t) && finite(z) && z >= view.zMin && z <= view.zMax
}

export function clipRarefactionSegmentsToView(segments, view) {
  const clipped = []
  for (const segment of segments ?? []) {
    let current = []
    for (const rawPoint of segment ?? []) {
      const point = normalizePoint(rawPoint)
      if (point && pointInsideRarefactionComputationView(point, view)) {
        current.push(point)
      } else if (current.length) {
        if (current.length >= 2) clipped.push(current)
        current = []
      }
    }
    if (current.length >= 2) clipped.push(current)
  }
  return clipped
}


export function selectBranchFromDirection(bifoliation, direction) {
  const branch = normalizeHugoniotDirection(direction) === BACKWARD_HUGONIOT ? 'plus' : 'minus'
  return { branch, leaf: selectLeafFromBifoliation(bifoliation, branch) }
}

export function rarefactionSegments(fixedState, params, view, samples, direction = FORWARD_HUGONIOT, mathcalR = null) {
  if (!fixedState || !finite(fixedState.t) || !finite(fixedState.z)) return []
  const R = mathcalR ?? buildRarefactionBifoliation({ fixedState, params, view, samples, constrainZ: false })
  const { leaf } = selectBranchFromDirection(R, direction)

  // A composta nasce explicitamente da bifolheacao de rarefacao mathcal R_pm.
  // A continuacao interna da EDO ainda pode integrar alem da janela, mas a
  // geratriz usada por mathcal K_-/mathcal K_+ e primeiro limitada ao dominio
  // padronizado recebido do App.jsx: calcView = view + 20% no eixo z.
  return clipRarefactionSegmentsToView(leaf?.curve?.segments ?? [], view)
}

export function compositeBaseRarefactionSampleCount(samples, resolution) {
  const sampleValue = finite(samples) ? samples : 0
  const resolutionValue = finite(resolution) ? resolution : 0
  return Math.max(
    RAREFACTION.COMPOSITE_MIN_SAMPLES,
    sampleValue * RAREFACTION.COMPOSITE_SAMPLES_MULTIPLIER,
    resolutionValue * RAREFACTION.COMPOSITE_SAMPLES_PER_RESOLUTION,
    (COMPOSITE.BASE_RAREFACTION_SAMPLES ?? 800) * 2,
  )
}

export function cleanCompositeBaseRarefactionPoints(points, view, minDistance = 1e-8) {
  const normalized = (points ?? []).map(normalizePoint).filter(Boolean)
  if (normalized.length < 2) return []

  const originalDirection = normalized[normalized.length - 1].z >= normalized[0].z ? 1 : -1
  const ordered = [...normalized].sort((a, b) => a.z - b.z || a.t - b.t)
  if (originalDirection < 0) ordered.reverse()

  const clean = []
  for (const point of ordered) {
    const previous = clean[clean.length - 1]
    if (previous && normalizedPointDistance(previous, point, view) < minDistance) continue
    clean.push({ ...point, Y: 0, coords: [point.t, 0, point.z] })
  }
  return clean
}

export function refineCompositeBaseRarefaction(points, options = {}) {
  const {
    view,
    samples = COMPOSITE.BASE_RAREFACTION_SAMPLES ?? 800,
    minDistance = COMPOSITE.BASE_RAREFACTION_MIN_DISTANCE ?? 1e-8,
  } = options
  const clean = cleanCompositeBaseRarefactionPoints(points, view, minDistance)
  if (clean.length < 2) return clean

  const tauScale = Math.max(1, Math.abs(view.tMax - view.tMin))
  const zScale = Math.max(1, Math.abs(view.zMax - view.zMin))
  const s = [0]
  for (let i = 1; i < clean.length; i += 1) {
    const ds = Math.hypot((clean[i].t - clean[i - 1].t) / tauScale, (clean[i].z - clean[i - 1].z) / zScale)
    s.push(s[i - 1] + Math.max(ds, 1e-12))
  }

  const total = s[s.length - 1]
  if (!finite(total) || total <= 1e-12) return clean

  const count = Math.max(2, Math.floor(samples))
  const refined = []
  let lo = 0
  for (let i = 0; i < count; i += 1) {
    const target = (i / Math.max(1, count - 1)) * total
    while (lo < s.length - 2 && s[lo + 1] < target) lo += 1
    const hi = Math.min(s.length - 1, lo + 1)
    const denom = Math.max(1e-14, s[hi] - s[lo])
    const alpha = (target - s[lo]) / denom
    const a = clean[lo]
    const b = clean[hi]
    const t = a.t + alpha * (b.t - a.t)
    const z = a.z + alpha * (b.z - a.z)
    refined.push({ ...a, t, Y: 0, z, coords: [t, 0, z] })
  }
  return refined
}

export function buildCompositeBaseRarefaction({ fixedState, params, view, resolution, samples, direction = FORWARD_HUGONIOT, mathcalR = null }) {
  if (!fixedState || !finite(fixedState.t) || !finite(fixedState.z)) return []
  const compositeSamples = compositeBaseRarefactionSampleCount(samples, resolution)
  const rawSegments = rarefactionSegments(fixedState, params, view, compositeSamples, direction, mathcalR)
  return rawSegments
    .map((segment) => refineCompositeBaseRarefaction(segment, {
      view,
      samples: COMPOSITE.BASE_RAREFACTION_SAMPLES ?? 800,
      minDistance: COMPOSITE.BASE_RAREFACTION_MIN_DISTANCE ?? 1e-8,
    }))
    .filter((segment) => segment.length >= 2)
}
