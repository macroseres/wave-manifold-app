import { P, Q, A } from './algebra.js'
import { sonicLineTCoeff, sonicLineConst } from './sonic.js'
import { pushSegment, inflectionZDomain, clipInflectionSegmentToTauWindow, uniqueFiniteLocal } from './helpers.js'
import { VISUAL_Z_MAX, VISUAL_Z_MIN, visualZToPhysical } from '../../geometry/zCompactification.js'
import { reflectDaggerSegments } from '../shared/reflection.js'

// Dagger exchanges the two states: B- is B+ reflected in Y=0.
export function solveSecondaryLeftBifurcationSegments(params, view, samples = 260, options = {}) {
  const reflectedView = { ...view, yMin: -view.yMax, yMax: -view.yMin }
  return reflectDaggerSegments(solveSecondaryRightBifurcationSegments(params, reflectedView, samples, options))
}

export function solveCoincidenceSegments(view) {
  if (view.tMin > 0 || view.tMax < 0 || view.yMin > 0 || view.yMax < 0) return []
  const visualMargin = 1e-4
  const zMin = visualZToPhysical(VISUAL_Z_MIN + visualMargin)
  const zMax = visualZToPhysical(VISUAL_Z_MAX - visualMargin)
  return [[[0, 0, zMin], [0, 0, zMax]]]
}

export function solveSecondaryRightBifurcationSegments(params, view, _samples = 260, { compactifiedZ = false } = {}) {
  const { b1, b2 } = params
  let roots = []

  // P(z)=1+b2 z+(b1-1)z^2.
  if (Math.abs(b1 - 1) < 1e-12) {
    if (Math.abs(b2) > 1e-12) roots = [-1 / b2]
  } else {
    const discriminant = b2 * b2 - 4 * (b1 - 1)
    if (discriminant >= 0) {
      const sqrtD = Math.sqrt(discriminant)
      roots = [
        (-b2 - sqrtD) / (2 * (b1 - 1)),
        (-b2 + sqrtD) / (2 * (b1 - 1)),
      ]
    }
  }

  return uniqueFiniteLocal(roots.filter((z) => Math.abs(P(z, b1, b2)) < 1e-7))
    .filter((z) => compactifiedZ || (z >= view.zMin && z <= view.zMax))
    .flatMap((z) => {
      // P(z)=0 and 2 b1 z(1+z²)t - A(z)Y=0 define a straight
      // line at fixed z. Clip it analytically, including vertical cases.
      const coefficient = 2 * b1 * z * (1 + z * z)
      const denominator = A(z, b2)
      if (Math.abs(denominator) < 1e-12) {
        if (Math.abs(coefficient) < 1e-12) {
          return view.yMin <= 0 && view.yMax >= 0
            ? [[[view.tMin, 0, z], [view.tMax, 0, z]]] : []
        }
        return view.tMin <= 0 && view.tMax >= 0
          ? [[[0, view.yMin, z], [0, view.yMax, z]]] : []
      }
      const slope = coefficient / denominator
      let lo = view.tMin
      let hi = view.tMax
      if (Math.abs(slope) < 1e-14) {
        if (view.yMin > 0 || view.yMax < 0) return []
      } else {
        lo = Math.max(lo, Math.min(view.yMin / slope, view.yMax / slope))
        hi = Math.min(hi, Math.max(view.yMin / slope, view.yMax / slope))
      }
      return hi > lo ? [[[lo, slope * lo, z], [hi, slope * hi, z]]] : []
    })
}

export function solveInflectionSegments(params, view, samples = 640, branch = 'all', { compactifiedZ = false } = {}) {
  const { b1, b2 } = params
  const segments = []
  let current = []
  const n = Math.max(360, samples)
  const { zMin, zMax } = inflectionZDomain(view)
  const visualMargin = 1e-4
  const visualZMin = VISUAL_Z_MIN + visualMargin
  const visualZMax = VISUAL_Z_MAX - visualMargin
  const dz = (zMax - zMin) / Math.max(n - 1, 1)
  const tauWindow = (() => {
    // Both branches approach tau=0 as |z| -> infinity. Keep that limiting
    // boundary so their compactified drawings can reach z-hat = +/-1.
    if (branch === 'slow') return { tMin: Math.max(0, view.tMin), tMax: view.tMax }
    if (branch === 'fast') return { tMin: view.tMin, tMax: Math.min(0, view.tMax) }
    return { tMin: view.tMin, tMax: view.tMax }
  })()

  const pushCurrent = () => {
    pushSegment(segments, current)
    current = []
  }

  const rawPointAt = (z) => {
    const tCoeff = sonicLineTCoeff(z, params)
    const cTerm = sonicLineConst(z, params)
    const pValue = P(z, b1, b2)

    if (Math.abs(tCoeff) < 1e-10 || Math.abs(pValue) < 5e-5) return null

    const t = -cTerm / tCoeff
    if (!Number.isFinite(t)) return null
    return { t, Y: 0, z }
  }

  let prev = null
  for (let i = 0; i < n; i += 1) {
    const z = compactifiedZ
      ? visualZToPhysical(visualZMin + (i * (visualZMax - visualZMin)) / Math.max(n - 1, 1))
      : zMin + i * dz
    const raw = rawPointAt(z)

    if (!raw) {
      pushCurrent()
      prev = null
      continue
    }

    if (prev) {
      const jumpT = Math.abs(raw.t - prev.t)
      if (jumpT > 0.45 * Math.max(1, view.tMax - view.tMin)) {
        pushCurrent()
      } else {
        const clipped = clipInflectionSegmentToTauWindow(prev, raw, tauWindow.tMin, tauWindow.tMax)
        if (clipped.length >= 2) {
          for (const mapped of clipped) {
            const last = current[current.length - 1]
            if (!last || Math.hypot(last[0] - mapped[0], last[2] - mapped[2]) > 1e-8) current.push(mapped)
          }
        } else if (current.length) {
          pushCurrent()
        }
      }
    } else {
      const clippedPoint = clipInflectionSegmentToTauWindow(raw, raw, tauWindow.tMin, tauWindow.tMax)
      if (clippedPoint.length) current.push(clippedPoint[0])
    }

    prev = raw
  }

  pushCurrent()
  return segments
}

export function solveDoubleSonicSegments(params, view, { compactifiedZ = false } = {}) {
  const { b1, b2 } = params
  let roots = []
  if (Math.abs(b1 + 1) < 1e-12) {
    // Q(z)=1 neste caso, logo não há Q(z)=0.
    roots = []
  } else {
    const discriminant = b2 * b2 * (b1 + 1) * (b1 + 1) + 4 * (b1 + 1)
    if (discriminant >= 0) {
      const sqrtD = Math.sqrt(discriminant)
      roots = [
        (b2 * (b1 + 1) - sqrtD) / (2 * (b1 + 1)),
        (b2 * (b1 + 1) + sqrtD) / (2 * (b1 + 1)),
      ]
    }
  }

  return uniqueFiniteLocal(roots.filter((z) => Math.abs(Q(z, b1, b2)) < 1e-7))
    .filter((z) => compactifiedZ || (z >= view.zMin && z <= view.zMax))
    .flatMap((z) => {
      const tCoeff = sonicLineTCoeff(z, params)
      const cTerm = sonicLineConst(z, params)
      if (Math.abs(tCoeff) < 1e-10) return []
      const t = -cTerm / tCoeff
      if (!Number.isFinite(t) || t < view.tMin || t > view.tMax) return []

      // Como Q(z)=0, S^+=S^- reduzem a uma reta paralela ao eixo Y.
      // Agora incluimos tambem Y=0: cada raiz de Q(z)=0 gera uma reta
      // vertical continua da dupla sonica, sem separar em dois segmentos.
      return [[[t, view.yMin, z], [t, view.yMax, z]]]
    })
}

