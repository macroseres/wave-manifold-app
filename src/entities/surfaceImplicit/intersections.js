import { dedupeSortedNumbers, scanRoots, solveQuadraticRealRoots } from '../numerics/index.js'
import { FORWARD_HUGONIOT, BACKWARD_HUGONIOT, normalizeHugoniotDirection } from '../hugoniot/directions.js'
import { waveColors } from '../../config/waveColors.js'
import { A } from './algebra.js'
import { solveHugoniotPointForFixedState, solveBackwardHugoniotPointForFixedRightState, rarefactionDerivativeDtDz, uEquilibrium, vEquilibrium, waveSpeed } from './state.js'
import { sonicImplicitF, sonicLeftImplicitF, sonicLeftBranchIndicator, sonicRightBranchIndicator, sonicLineTCoeff, sonicLineConst } from './sonic.js'

const EPS_MATCH = 1e-4

function sameWavePoint(p, q, tolerance = EPS_MATCH) {
  if (!p || !q) return false
  return (
    Math.abs(p.t - q.t) < tolerance &&
    Math.abs(p.Y - q.Y) < tolerance &&
    Math.abs(p.z - q.z) < tolerance
  )
}

function wavePointDistance(p, q) {
  if (!p || !q) return Number.POSITIVE_INFINITY
  const dt = Number.isFinite(p.t) && Number.isFinite(q.t) ? p.t - q.t : 0
  const dY = Number.isFinite(p.Y) && Number.isFinite(q.Y) ? p.Y - q.Y : 0
  const dz = Number.isFinite(p.z) && Number.isFinite(q.z) ? p.z - q.z : 0
  return Math.hypot(dt, dY, dz)
}

function closestWavePointIndex(points, target) {
  if (!Array.isArray(points) || points.length === 0 || !target) return -1
  let bestIndex = -1
  let bestDistance = Number.POSITIVE_INFINITY
  points.forEach((point, index) => {
    const distance = wavePointDistance(point, target)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  })
  return bestIndex
}

export function solveCharacteristicHugoniotPointForFixedState(z, fixedState, params) {
  if (!fixedState) return null

  const { b1, b2 } = params
  const uE = uEquilibrium(z, params)
  const vE = vEquilibrium(z, params)
  const aValue = A(z, b2)

  let t = Number.NaN
  if (Math.abs(aValue) > 1e-12) {
    t = (fixedState.uMinus - uE) / aValue
  } else if (Math.abs(b1 * z) > 1e-12) {
    t = (vE - fixedState.vMinus) / (b1 * z)
  }

  if (!Number.isFinite(t)) return null

  return {
    t,
    Y: 0,
    z,
    uMinus: fixedState.uMinus,
    vMinus: fixedState.vMinus,
    exactCharacteristic: true,
  }
}

export function solveCharacteristicHugoniotIntersections(fixedState, params) {
  if (!fixedState) return []

  const { b1, b2, c } = params
  const { uMinus: u0, vMinus: v0 } = fixedState

  // A interseção de H_{U^-} com a característica Y=0 é obtida exatamente de
  // (1+b2 z-z^2)v0 + b1 z u0 - c z^2 = 0,
  // isto é,
  // -(v0+c)z^2 + (b2 v0+b1 u0)z + v0 = 0.
  const roots = solveQuadraticRealRoots(
    -(v0 + c),
    b2 * v0 + b1 * u0,
    v0,
  )

  return dedupeSortedNumbers(roots, 1e-8)
    .map((z) => solveCharacteristicHugoniotPointForFixedState(z, fixedState, params))
    .filter(Boolean)
}

function characteristicBranch(point) {
  if (!point || !Number.isFinite(point.t)) return 'unknown'
  if (point.t < -1e-9) return 'fast'
  if (point.t > 1e-9) return 'slow'
  return 'neutral'
}

function characteristicTex(branch) {
  if (branch === 'fast') return '\\mathcal{C}_f'
  if (branch === 'slow') return '\\mathcal{C}_s'
  return '\\mathcal{C}'
}

function sonicLeftBranch(point, params) {
  if (!point) return 'unknown'
  const indicator = sonicLeftBranchIndicator(point.Y, point.t, point.z, params)
  if (!Number.isFinite(indicator)) return 'unknown'
  if (indicator < -1e-7) return 'slow'
  if (indicator > 1e-7) return 'fast'
  return 'neutral'
}

function sonicLeftTex(branch) {
  if (branch === 'fast') return '\\mathcal{S}^-_f'
  if (branch === 'slow') return '\\mathcal{S}^-_s'
  return '\\mathcal{S}^-'
}

function sonicRightBranch(point, params) {
  if (!point) return 'unknown'
  const indicator = sonicRightBranchIndicator(point.Y, point.t, point.z, params)
  if (!Number.isFinite(indicator)) return 'unknown'
  if (indicator < -1e-7) return 'slow'
  if (indicator > 1e-7) return 'fast'
  return 'neutral'
}

function sonicRightTex(branch) {
  if (branch === 'fast') return '\\mathcal{S}^+_f'
  if (branch === 'slow') return '\\mathcal{S}^+_s'
  return '\\mathcal{S}^+'
}


export function inflectionPointAtZ(z, params) {
  const tCoeff = sonicLineTCoeff(z, params)
  const cTerm = sonicLineConst(z, params)
  if (!Number.isFinite(tCoeff) || !Number.isFinite(cTerm) || Math.abs(tCoeff) < 1e-10) return null
  const t = -cTerm / tCoeff
  if (!Number.isFinite(t)) return null
  const texLabel = t > 1e-9 ? '\\mathcal{J}_-' : '\\mathcal{J}_+'
  return { t, Y: 0, z, s: waveSpeed(t, z, params), kind: t > 1e-9 ? 'J_-' : 'J_+', texLabel }
}

function rk4RarefactionStepForPanel(z, t, h, params) {
  const k1 = rarefactionDerivativeDtDz(z, t, params)
  const k2 = rarefactionDerivativeDtDz(z + 0.5 * h, t + 0.5 * h * k1, params)
  const k3 = rarefactionDerivativeDtDz(z + 0.5 * h, t + 0.5 * h * k2, params)
  const k4 = rarefactionDerivativeDtDz(z + h, t + h * k3, params)
  if (![k1, k2, k3, k4].every(Number.isFinite)) return null
  return t + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
}

function interpolateRarefactionInflectionCrossing(a, b, params) {
  const ia = inflectionPointAtZ(a.z, params)
  const ib = inflectionPointAtZ(b.z, params)
  if (!ia || !ib) return null
  const ga = a.t - ia.t
  const gb = b.t - ib.t
  const denom = ga - gb
  const theta = Math.abs(denom) > 1e-12 ? Math.max(0, Math.min(1, ga / denom)) : 0
  const z = a.z + theta * (b.z - a.z)
  const tRare = a.t + theta * (b.t - a.t)
  const inf = inflectionPointAtZ(z, params)
  if (!inf) return null
  return {
    ...inf,
    t: Number.isFinite(inf.t) ? inf.t : tRare,
    rarefactionResidual: Math.abs(tRare - inf.t),
    visibleInWindow: true,
    markerColor: waveColors.inflection,
    branchLabel: 'rarefação ∩ inflexão',
    branchLabelTex: `\\mathcal{R}\\cap${inf.texLabel}`,
  }
}

function traceRarefactionForInflection(seed, params, view, direction, samples = 900) {
  const zSpan = Math.max(1, view.zMax - view.zMin)
  const tSpan = Math.max(1, view.tMax - view.tMin)
  const zMin = view.zMin - 2.4 * zSpan
  const zMax = view.zMax + 2.4 * zSpan
  const zEnd = direction > 0 ? zMax : zMin
  const total = Math.abs(zEnd - seed.z)
  if (total <= 1e-12) return null
  const h = direction * total / Math.max(samples, 1)
  const maxJumpT = 0.32 * Math.max(1, tSpan)
  let previous = { t: seed.t, Y: 0, z: seed.z }
  let best = null

  for (let i = 0; i < samples; i += 1) {
    const currentInf = inflectionPointAtZ(previous.z, params)
    if (currentInf && Number.isFinite(currentInf.t)) {
      const residual = Math.abs(previous.t - currentInf.t)
      if (!best || residual < best.residual) {
        best = {
          point: {
            ...currentInf,
            rarefactionResidual: residual,
            markerColor: waveColors.inflection,
            branchLabel: 'rarefação ∩ inflexão',
            branchLabelTex: `\\mathcal{R}\\cap${currentInf.texLabel}`,
          },
          residual,
        }
      }
    }

    const nextT = rk4RarefactionStepForPanel(previous.z, previous.t, h, params)
    const nextZ = previous.z + h
    if (!Number.isFinite(nextT) || !Number.isFinite(nextZ) || Math.abs(nextT - previous.t) > maxJumpT) break
    const next = { t: nextT, Y: 0, z: nextZ }

    const infPrev = inflectionPointAtZ(previous.z, params)
    const infNext = inflectionPointAtZ(next.z, params)
    if (infPrev && infNext) {
      const gPrev = previous.t - infPrev.t
      const gNext = next.t - infNext.t
      if (Number.isFinite(gPrev) && Number.isFinite(gNext) && gPrev * gNext <= 0) {
        const point = interpolateRarefactionInflectionCrossing(previous, next, params)
        if (point) return point
      }
    }

    previous = next
  }

  const tolerance = Math.max(2e-3, 0.03 * tSpan)
  return best && best.residual <= tolerance ? best.point : null
}

export function computeRarefactionInflectionIntersection(seed, params, view) {
  if (!seed || !Number.isFinite(seed.t) || !Number.isFinite(seed.z)) return null
  const base = { t: seed.t, Y: 0, z: seed.z }
  const selfInf = inflectionPointAtZ(base.z, params)
  if (selfInf && Math.abs(base.t - selfInf.t) < 1e-7) {
    return {
      ...selfInf,
      rarefactionResidual: Math.abs(base.t - selfInf.t),
      markerColor: waveColors.inflection,
      branchLabel: 'rarefação ∩ inflexão',
      branchLabelTex: `\\mathcal{R}\\cap${selfInf.texLabel}`,
    }
  }
  const backward = traceRarefactionForInflection(base, params, view, -1)
  const forward = traceRarefactionForInflection(base, params, view, 1)
  if (backward && forward) {
    return Math.abs(backward.rarefactionResidual ?? 0) <= Math.abs(forward.rarefactionResidual ?? 0) ? backward : forward
  }
  return backward ?? forward ?? null
}

export function computeHugoniotIntersections(fixedState, params, view, clickedPoint = null, clickedSource = null, direction = FORWARD_HUGONIOT) {
  const hugoniotDirection = normalizeHugoniotDirection(direction)
  if (!fixedState) {
    return { characteristic: [], sonicRight: [], sonicLeft: [], rarefactionInflection: null, zRange: null }
  }

  const zRadius = Math.min(50, Math.max(8, 3 * Math.abs(view.zMin), 3 * Math.abs(view.zMax)))
  const zMin = -zRadius
  const zMax = zRadius

  const pointAt = (z) => hugoniotDirection === BACKWARD_HUGONIOT
    ? solveBackwardHugoniotPointForFixedRightState(z, fixedState, params)
    : solveHugoniotPointForFixedState(z, fixedState, params)
  const visibleInWindow = (point) => (
    point.z >= view.zMin && point.z <= view.zMax &&
    point.t >= view.tMin && point.t <= view.tMax &&
    point.Y >= view.yMin && point.Y <= view.yMax
  )

  const decorate = (point, kind, extra = {}) => ({
    ...point,
    kind,
    s: waveSpeed(point.t, point.z, params),
    visibleInWindow: visibleInWindow(point),
    ...extra,
  })

  const rootToPoint = (z, kind) => {
    const point = pointAt(z)
    if (!point || !Number.isFinite(point.t) || !Number.isFinite(point.Y)) return null
    return decorate(point, kind)
  }

  const rootsOf = (kind, fn, maxCount = 4) => scanRoots((z) => {
    const point = pointAt(z)
    if (!point) return Number.NaN
    return fn(point)
  }, zMin, zMax).map((z) => rootToPoint(z, kind)).filter(Boolean).slice(0, maxCount)

  let characteristicIntersections = hugoniotDirection === BACKWARD_HUGONIOT
    ? []
    : solveCharacteristicHugoniotIntersections(fixedState, params)
    .map((point) => {
      const branch = characteristicBranch(point)
      return decorate(point, branch === 'fast' ? 'C^f' : branch === 'slow' ? 'C^s' : 'C', {
        branch,
        texLabel: characteristicTex(branch),
        branchLabel: branch === 'fast' ? 'característica rápida' : branch === 'slow' ? 'característica lenta' : 'característica',
        markerColor: branch === 'fast' ? waveColors.characteristicFast : branch === 'slow' ? waveColors.characteristicSlow : waveColors.characteristicNeutral,
      })
    })
    .sort((a, b) => a.t - b.t)

  // Quando o clique ocorre na característica, o ponto do raycaster vem da malha
  // desenhada, enquanto a lista do painel vem da solução quadrática exata.
  // Portanto não adicionamos um novo item; apenas marcamos a interseção analítica
  // mais próxima do ponto clicado, como já fazemos para S_L.
  if (clickedSource === 'characteristic' && clickedPoint && characteristicIntersections.length > 0) {
    const clicked = decorate(
      {
        ...clickedPoint,
        Y: 0,
        uMinus: fixedState.uMinus,
        vMinus: fixedState.vMinus,
      },
      'C',
    )

    const exactIndex = characteristicIntersections.findIndex((point) => sameWavePoint(point, clicked))
    const index = exactIndex >= 0 ? exactIndex : closestWavePointIndex(characteristicIntersections, clicked)

    if (index >= 0) {
      characteristicIntersections = characteristicIntersections.map((point, idx) => (
        idx === index
          ? {
              ...point,
              isClicked: true,
              matchedClickedPoint: clicked,
              clickDistance: wavePointDistance(point, clicked),
            }
          : { ...point, isClicked: false }
      ))
    }
  }

  const sonicRight = rootsOf('S_R', (point) => sonicImplicitF(point.Y, point.t, point.z, params), 4)
    .map((point) => {
      const branch = sonicRightBranch(point, params)
      return {
        ...point,
        branch,
        kind: branch === 'fast' ? 'S_R_f' : branch === 'slow' ? 'S_R_s' : 'S_R',
        texLabel: sonicRightTex(branch),
        branchLabel: branch === 'fast' ? 'sônica direita rápida' : branch === 'slow' ? 'sônica direita lenta' : 'sônica direita',
        markerColor: branch === 'fast' ? waveColors.sonicRightFast : branch === 'slow' ? waveColors.sonicRightSlow : waveColors.sonicRightNeutral,
      }
    })

  let sonicLeft = rootsOf('S_L', (point) => sonicLeftImplicitF(point.Y, point.t, point.z, params), 4)

  if (clickedSource === 'sonicLeft' && clickedPoint && sonicLeft.length > 0) {
    const clicked = decorate(
      {
        ...clickedPoint,
        Y: Number.isFinite(clickedPoint.Y) ? clickedPoint.Y : 0,
        uMinus: fixedState.uMinus,
        vMinus: fixedState.vMinus,
      },
      'S_L',
    )

    const exactIndex = sonicLeft.findIndex((point) => sameWavePoint(point, clicked))
    const index = exactIndex >= 0 ? exactIndex : closestWavePointIndex(sonicLeft, clicked)

    if (index >= 0) {
      sonicLeft[index] = {
        ...sonicLeft[index],
        isClicked: true,
        matchedClickedPoint: clicked,
        clickDistance: wavePointDistance(sonicLeft[index], clicked),
      }
    }
  }

  sonicLeft = sonicLeft
    .map((point) => {
      const branch = sonicLeftBranch(point, params)
      return {
        ...point,
        branch,
        kind: branch === 'fast' ? 'S_L_f' : branch === 'slow' ? 'S_L_s' : 'S_L',
        texLabel: sonicLeftTex(branch),
        branchLabel: branch === 'fast' ? 'sônica à esquerda rápida' : branch === 'slow' ? 'sônica à esquerda lenta' : 'sônica à esquerda',
        markerColor: branch === 'fast' ? waveColors.sonicLeftFast : branch === 'slow' ? waveColors.sonicLeftSlow : waveColors.sonicLeftNeutral,
      }
    })
    .sort((a, b) => a.z - b.z)

  return {
    characteristic: characteristicIntersections,
    sonicRight,
    sonicLeft,
    rarefactionInflection: computeRarefactionInflectionIntersection(clickedPoint ?? fixedState, params, view),
    zRange: { zMin, zMax },
  }
}
