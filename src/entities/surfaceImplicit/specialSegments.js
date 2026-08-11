import { P, Q, A } from './algebra.js'
import { sonicLineTCoeff, sonicLineConst } from './sonic.js'
import { pushSegment, inExpandedWindow, inflectionZDomain, clipInflectionSegmentToTauWindow, uniqueFiniteLocal } from './helpers.js'

export function solveCoincidenceSegments(view) {
  if (view.tMin > 0 || view.tMax < 0 || view.yMin > 0 || view.yMax < 0) return []
  return [[[0, 0, view.zMin], [0, 0, view.zMax]]]
}

export function solveSecondaryRightBifurcationSegments(params, view, samples = 260) {
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
    .filter((z) => z >= view.zMin && z <= view.zMax)
    .flatMap((z) => {
      const aValue = A(z, b2)
      const denom = aValue
      const points = []
      const n = Math.max(80, samples)
      const dt = (view.tMax - view.tMin) / Math.max(n - 1, 1)
      for (let i = 0; i < n; i += 1) {
        const t = view.tMin + i * dt
        let Y
        if (Math.abs(denom) > 1e-12) {
          // B_R deve estar em S_R. Com a convencao atual de S_R(t,Y,z),
          // o ramo visivel de B_R satisfaz
          //     P(z)=0,  2 b1 z(1+z^2)t - A(z)Y = 0.
          // O sinal oposto colocava a curva no espelho S_L.
          Y = 2 * b1 * z * (1 + z * z) * t / denom
        } else if (Math.abs(2 * b1 * z * (1 + z * z)) < 1e-12) {
          Y = 0
        } else {
          continue
        }
        const point = { t, Y, z }
        if (inExpandedWindow(point, view, 0.04)) points.push([t, Y, z])
      }
      return points.length >= 2 ? [points] : []
    })
}

export function solveInflectionSegments(params, view, samples = 640, branch = 'all') {
  const { b1, b2 } = params
  const segments = []
  let current = []
  const n = Math.max(360, samples)
  const { zMin, zMax } = inflectionZDomain(view)
  const dz = (zMax - zMin) / Math.max(n - 1, 1)
  const tauGap = Math.max(1e-5, 0.001 * Math.max(1, view.tMax - view.tMin))

  const tauWindow = (() => {
    if (branch === 'slow') return { tMin: Math.max(tauGap, view.tMin), tMax: view.tMax }
    if (branch === 'fast') return { tMin: view.tMin, tMax: Math.min(-tauGap, view.tMax) }
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
    const z = zMin + i * dz
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

export function solveDoubleSonicSegments(params, view) {
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
    .filter((z) => z >= view.zMin && z <= view.zMax)
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
