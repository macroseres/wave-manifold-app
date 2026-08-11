import { waveColors } from '../config/waveColors.js'
import { finite } from './projectionBounds.js'
import {
  computeStateFromCharacteristicPoint,
  rarefactionDerivativeDtDz,
  solveCharacteristicHugoniotIntersections,
  solveHugoniotPointForFixedState,
  sonicLeftImplicitF,
  sonicLineTCoeff,
  sonicLineConst,
  P,
} from '../entities/surfaceImplicit/index.js'
import { projectPointPlus } from '../entities/geometry/stateProjections.js'

export function rk4Step(z, t, h, params) {
  const k1 = rarefactionDerivativeDtDz(z, t, params)
  const k2 = rarefactionDerivativeDtDz(z + 0.5 * h, t + 0.5 * h * k1, params)
  const k3 = rarefactionDerivativeDtDz(z + 0.5 * h, t + 0.5 * h * k2, params)
  const k4 = rarefactionDerivativeDtDz(z + h, t + h * k3, params)
  if (![k1, k2, k3, k4].every(finite)) return null
  return t + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
}

export function integrateRarefaction(start, params, view, direction, steps = 140) {
  if (!start || !finite(start.t) || !finite(start.z)) return []
  const zEnd = direction > 0 ? view.zMax : view.zMin
  const total = Math.abs(zEnd - start.z)
  if (total < 1e-12) return []

  const h = direction * total / Math.max(steps, 1)
  const out = []
  let z = start.z
  let t = start.t
  const maxJumpT = 0.18 * Math.max(1, view.tMax - view.tMin)

  for (let i = 0; i <= steps; i += 1) {
    if (finite(t) && finite(z)) out.push({ t, Y: 0, z })
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

export function buildRarefactionWave(start, params, view) {
  const back = integrateRarefaction(start, params, view, -1).reverse()
  const fwd = integrateRarefaction(start, params, view, 1)
  if (!back.length) return fwd
  if (!fwd.length) return back
  const last = back[back.length - 1]
  const first = fwd[0]
  return Math.abs(last.z - first.z) < 1e-10 ? [...back, ...fwd.slice(1)] : [...back, ...fwd]
}

export function inflectionT(z, params) {
  const tCoeff = sonicLineTCoeff(z, params)
  const cTerm = sonicLineConst(z, params)
  if (!finite(tCoeff) || !finite(cTerm) || Math.abs(tCoeff) < 1e-10) return null
  const t = -cTerm / tCoeff
  return finite(t) ? t : null
}

export function findInflectionIndex(points, params) {
  let bestIndex = -1
  let bestValue = Number.POSITIVE_INFINITY
  let prev = null

  for (let i = 0; i < points.length; i += 1) {
    const p = points[i]
    const ti = inflectionT(p.z, params)
    if (ti === null || Math.abs(P(p.z, params.b1, params.b2)) < 5e-5) {
      prev = null
      continue
    }
    const g = p.t - ti
    const abs = Math.abs(g)
    if (abs < bestValue) {
      bestValue = abs
      bestIndex = i
    }
    if (prev && prev.g * g <= 0) return Math.abs(prev.g) < Math.abs(g) ? prev.i : i
    prev = { g, i }
  }

  const scale = Math.max(1, ...points.map((p) => Math.abs(p.t)).filter(finite))
  return bestValue <= Math.max(2.5e-3, 0.035 * scale) ? bestIndex : -1
}

export function bisectRoot(fn, a, b, iterations = 50) {
  let fa = fn(a)
  let fb = fn(b)
  if (!finite(fa) || !finite(fb) || fa * fb > 0) return null
  if (Math.abs(fa) < 1e-9) return a
  if (Math.abs(fb) < 1e-9) return b

  let left = a
  let right = b
  for (let i = 0; i < iterations; i += 1) {
    const mid = 0.5 * (left + right)
    const fm = fn(mid)
    if (!finite(fm)) return null
    if (Math.abs(fm) < 1e-9) return mid
    if (fa * fm <= 0) {
      right = mid
      fb = fm
    } else {
      left = mid
      fa = fm
    }
  }
  return 0.5 * (left + right)
}

export function compositePointFromGenerator(generator, params, view) {
  const state = computeStateFromCharacteristicPoint(generator.t, generator.z, params)
  if (!state) return null

  const zMin = view.zMin
  const zMax = view.zMax
  const samples = 90
  const dz = (zMax - zMin) / samples
  let prev = null

  const f = (z) => {
    const h = solveHugoniotPointForFixedState(z, state, params)
    if (!h) return Number.NaN
    return sonicLeftImplicitF(h.Y, h.t, h.z, params)
  }

  for (let i = 0; i <= samples; i += 1) {
    const z = zMin + i * dz
    const value = f(z)
    if (!finite(value)) {
      prev = null
      continue
    }
    if (prev && prev.value * value <= 0) {
      const root = bisectRoot(f, prev.z, z)
      const h = root === null ? null : solveHugoniotPointForFixedState(root, state, params)
      if (h) return { ...h, generatorState: state }
    }
    prev = { z, value }
  }
  return null
}

export function buildCompositeWave(start, params, view) {
  const rarefaction = buildRarefactionWave(start, params, view)
  const i0 = findInflectionIndex(rarefaction, params)
  if (i0 < 0) return []

  const step = Math.max(1, Math.floor(rarefaction.length / 70))
  const out = []
  for (let i = i0; i < rarefaction.length; i += step) {
    const p = compositePointFromGenerator(rarefaction[i], params, view)
    if (p) out.push(p)
  }
  return out
}

export function projectWavePointToRightState(point, params) {
  const projected = projectPointPlus(point, params)
  return projected ? { u: projected.uPlus, v: projected.vPlus } : null
}

export function projectCharacteristicPoint(point, params) {
  return projectWavePointToRightState({ ...point, Y: 0 }, params)
}

export function projectCompositePoint(point, params) {
  return projectWavePointToRightState(point, params)
}

export function buildProjectedCurves(baseState, params, view, side) {
  if (!baseState) return []
  const curves = []

  const hPoints = []
  const hSamples = 180
  for (let i = 0; i < hSamples; i += 1) {
    const z = view.zMin + (i * (view.zMax - view.zMin)) / Math.max(1, hSamples - 1)
    const p = solveHugoniotPointForFixedState(z, baseState, params)
    const uv = projectWavePointToRightState(p, params)
    if (uv) hPoints.push(uv)
  }
  if (hPoints.length >= 2) {
    curves.push({ id: `hugoniot-${side}`, label: 'H_U- projetada', type: 'hugoniot', side, color: '#1d4ed8', points: hPoints })
  }

  const intersections = solveCharacteristicHugoniotIntersections(baseState, params)
  intersections.forEach((start, idx) => {
    const branchColor = start.t < -1e-9 ? waveColors.characteristicFast : start.t > 1e-9 ? waveColors.characteristicSlow : waveColors.characteristicNeutral
    const rarefaction = buildRarefactionWave(start, params, view)
      .map((p) => projectCharacteristicPoint(p, params))
      .filter(Boolean)
    if (rarefaction.length >= 2) {
      curves.push({ id: `rarefaction-${side}-${idx}`, label: `Característica ${idx + 1}`, type: 'rarefaction', side, color: branchColor, points: rarefaction })
    }

    const composite = buildCompositeWave(start, params, view)
      .map((p) => projectCompositePoint(p, params))
      .filter(Boolean)
    if (composite.length >= 2) {
      curves.push({ id: `composite-${side}-${idx}`, label: `Composta ${idx + 1}`, type: 'composite', side, color: waveColors.composite, points: composite })
    }
  })

  return curves
}
