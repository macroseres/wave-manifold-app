import {
  P,
  rarefactionDerivativeDtDz,
  sonicLineConst,
  sonicLineTCoeff,
  waveColors,
} from '../../../entities/surfaceImplicit'

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

function expandedView(view, tMargin = 2.4, yMargin = 1.1, zMargin = 5.6) {
  const tSpan = Math.max(1, view.tMax - view.tMin)
  const ySpan = Math.max(1, view.yMax - view.yMin)
  const zSpan = Math.max(1, view.zMax - view.zMin)
  return {
    ...view,
    tMin: view.tMin - tMargin * tSpan,
    tMax: view.tMax + tMargin * tSpan,
    yMin: view.yMin - yMargin * ySpan,
    yMax: view.yMax + yMargin * ySpan,
    zMin: view.zMin - zMargin * zSpan,
    zMax: view.zMax + zMargin * zSpan,
  }
}

function insideTZ(t, z, view, margin = 0.06) {
  const tPad = margin * Math.max(1, view.tMax - view.tMin)
  const zPad = margin * Math.max(1, view.zMax - view.zMin)
  return finite(t) && finite(z) &&
    t >= view.tMin - tPad && t <= view.tMax + tPad &&
    z >= view.zMin - zPad && z <= view.zMax + zPad
}

function integrateRarefactionBranch(z0, t0, params, view, direction, steps) {
  const out = []
  let z = z0
  let t = t0
  const zEnd = direction > 0 ? view.zMax : view.zMin
  const total = Math.abs(zEnd - z0)
  if (total <= 1e-12) return out
  const h = direction * total / Math.max(steps, 1)
  const maxJumpT = 0.18 * Math.max(1, view.tMax - view.tMin)

  for (let i = 0; i <= steps; i += 1) {
    if (insideTZ(t, z, view)) out.push({ t, Y: 0, z })
    const nextT = rk4Step(z, t, h, params)
    const nextZ = z + h
    if (!finite(nextT) || !finite(nextZ)) break
    if (Math.abs(nextT - t) > maxJumpT) break
    t = nextT
    z = nextZ
    if ((direction > 0 && z > view.zMax) || (direction < 0 && z < view.zMin)) break
  }

  return out
}

function rarefactionPoints(fixedState, params, view, samples) {
  if (!fixedState || !finite(fixedState.t) || !finite(fixedState.z)) return []
  const half = Math.max(60, Math.floor(samples / 2))
  const back = integrateRarefactionBranch(fixedState.z, fixedState.t, params, view, -1, half).reverse()
  const fwd = integrateRarefactionBranch(fixedState.z, fixedState.t, params, view, 1, half)
  if (!back.length) return fwd
  if (!fwd.length) return back
  const last = back[back.length - 1]
  const first = fwd[0]
  return Math.abs(last.z - first.z) < 1e-10 ? [...back, ...fwd.slice(1)] : [...back, ...fwd]
}

function inflectionT(z, params) {
  const tCoeff = sonicLineTCoeff(z, params)
  const cTerm = sonicLineConst(z, params)
  if (!finite(tCoeff) || !finite(cTerm) || Math.abs(tCoeff) < 1e-10) return null
  const t = -cTerm / tCoeff
  return finite(t) ? t : null
}

function findSlowInflectionIndex(points, params) {
  let bestIndex = -1
  let bestValue = Number.POSITIVE_INFINITY
  let bestCrossing = -1
  let previous = null

  for (let i = 0; i < points.length; i += 1) {
    const point = points[i]
    const tI = inflectionT(point.z, params)
    const isBR = Math.abs(P(point.z, params.b1, params.b2)) < 5e-5
    if (tI !== null && tI <= 1e-9) {
      previous = null
      continue
    }
    if (tI === null || isBR || !finite(point.t)) {
      previous = null
      continue
    }

    const g = point.t - tI
    const value = Math.abs(g)
    if (value < bestValue) {
      bestValue = value
      bestIndex = i
    }
    if (previous && previous.g * g <= 0) {
      bestCrossing = Math.abs(previous.g) < Math.abs(g) ? previous.index : i
      break
    }
    previous = { g, index: i }
  }

  if (bestCrossing >= 0) return bestCrossing
  if (bestIndex < 0) return -1

  const spanT = Math.max(1e-6, ...points.map((point) => Math.abs(point.t)).filter(finite), 1)
  const tolerance = Math.max(2.5e-3, 0.035 * spanT)
  return bestValue <= tolerance ? bestIndex : -1
}

export function computeCompositeSlowInflectionPoint(fixedState, params, view, resolution = 40) {
  const samples = Math.max(520, Math.min(900, resolution * 12))
  const calcView = expandedView(view)
  const rare = rarefactionPoints(fixedState, params, calcView, Math.max(samples, Math.min(900, resolution * 12)))
  const index = findSlowInflectionIndex(rare, params)
  const point = index >= 0 ? rare[index] : null
  if (!point || ![point.t, point.z].every(finite)) return null
  return {
    ...point,
    Y: 0,
    coords: [point.t, 0, point.z],
    markerColor: waveColors.inflectionSlow,
    branchLabelTex: '\\mathcal{R}^-\\cap\\mathcal{J}_s',
  }
}
