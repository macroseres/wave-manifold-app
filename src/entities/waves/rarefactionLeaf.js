import { FORWARD_HUGONIOT, normalizeHugoniotDirection } from '../hugoniot/directions.js'
import { rarefactionDerivativeDtDz, waveSpeed, sonicImplicitF, sonicLeftImplicitF } from '../surfaceImplicit/index.js'
import { makeWaveCurve, makeWaveLeaf } from '../shared/types/mathTypes.js'
import { annotateSpeedsAndAdmissibility, orientSegmentsBySpeed, orientationFromDirection, splitSegmentsAtLargeJumps } from './orientation.js'
import { VISUAL_Z_MAX, VISUAL_Z_MIN, physicalZToVisual, visualZToPhysical } from '../../geometry/zCompactification.js'

function rk4Step(z, t, h, params) {
  const k1 = rarefactionDerivativeDtDz(z, t, params)
  const k2 = rarefactionDerivativeDtDz(z + 0.5 * h, t + 0.5 * h * k1, params)
  const k3 = rarefactionDerivativeDtDz(z + 0.5 * h, t + 0.5 * h * k2, params)
  const k4 = rarefactionDerivativeDtDz(z + h, t + h * k3, params)
  if (![k1, k2, k3, k4].every(Number.isFinite)) return null
  return t + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
}

export function expandedRarefactionView(view, tMargin = 1.0, zMargin = 1.0) {
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


const DEFAULT_CONTINUATION_DOMAIN = Object.freeze({
  // A continuação usada pela composta deve respeitar a janela padronizada
  // recebida do App.jsx no eixo z. O raio em tau permanece amplo para evitar
  // corte visual lateral, mas não precisa ser extremamente grande.
  zRadius: null,
  tRadius: 140,
})

function rarefactionContinuationView(fixedState, view, options = {}) {
  const tRadius = Math.max(1, options.tRadius ?? DEFAULT_CONTINUATION_DOMAIN.tRadius)
  const z0 = Number.isFinite(fixedState?.z) ? fixedState.z : 0
  const t0 = Number.isFinite(fixedState?.t) ? fixedState.t : 0

  const zRadius = options.zRadius ?? DEFAULT_CONTINUATION_DOMAIN.zRadius
  const zMin = Number.isFinite(zRadius) ? z0 - Math.max(1, zRadius) : view.zMin
  const zMax = Number.isFinite(zRadius) ? z0 + Math.max(1, zRadius) : view.zMax

  // Domínio computacional da continuação: no eixo z respeita a janela
  // padronizada de cálculo/desenho. Isso evita calcular milhares de pontos
  // que seriam descartados depois pelo clip em z.
  return {
    ...view,
    zMin,
    zMax,
    tMin: t0 - tRadius,
    tMax: t0 + tRadius,
  }
}

function insideView(t, z, view) {
  return Number.isFinite(t) && Number.isFinite(z) && t >= view.tMin && t <= view.tMax && z >= view.zMin && z <= view.zMax
}

function makeRarefactionPoint(z, t, params) {
  if (!Number.isFinite(z) || !Number.isFinite(t)) return null
  const s = waveSpeed(t, z, params)
  if (!Number.isFinite(s)) return null
  return { t, Y: 0, z, coords: [t, 0, z], speed: s }
}

function localErrorNorm({ coarseT, fineT, coarseZ, fineZ, previousT, previousZ, params, scales }) {
  if (![coarseT, fineT, coarseZ, fineZ].every(Number.isFinite)) return Number.POSITIVE_INFINITY

  const tErr = Math.abs(fineT - coarseT) / scales.t
  const zErr = Math.abs(fineZ - coarseZ) / scales.z

  const sPrev = waveSpeed(previousT, previousZ, params)
  const sCoarse = waveSpeed(coarseT, coarseZ, params)
  const sFine = waveSpeed(fineT, fineZ, params)
  const speedScale = Math.max(1, Math.abs(sPrev), Math.abs(sCoarse), Math.abs(sFine))
  const speedErr = Number.isFinite(sCoarse) && Number.isFinite(sFine)
    ? Math.abs(sFine - sCoarse) / speedScale
    : 0

  return Math.max(tErr, zErr, speedErr)
}

function tryAdaptiveStep(z, t, h, params, scales) {
  const coarseT = rk4Step(z, t, h, params)
  if (!Number.isFinite(coarseT)) return null

  const halfH = 0.5 * h
  const midT = rk4Step(z, t, halfH, params)
  if (!Number.isFinite(midT)) return null

  const fineT = rk4Step(z + halfH, midT, halfH, params)
  if (!Number.isFinite(fineT)) return null

  const nextZ = z + h
  const err = localErrorNorm({
    coarseT,
    fineT,
    coarseZ: nextZ,
    fineZ: nextZ,
    previousT: t,
    previousZ: z,
    params,
    scales,
  })

  return { z: nextZ, t: fineT, error: err }
}

/**
 * Continuação adaptativa da folha de rarefação.
 *
 * A rarefação continua sendo obtida pela EDO dt/dz da característica, mas o
 * passo em z deixa de ser uniforme. O integrador compara um passo RK4 grande
 * com dois meios passos RK4 e aceita/refina automaticamente. Isso preserva o
 * núcleo TypeScript atual, reduz pontos desnecessários e evita pular regiões
 * de grande curvatura, singularidades ou variação rápida de s=lambda.
 */

function sonicRefinementNeeded(previousZ, previousT, candidate, params, sonicFn, h, minAbsStep) {
  if (typeof sonicFn !== 'function') return false
  const f0 = sonicFn(0, previousT, previousZ, params)
  const f1 = sonicFn(0, candidate.t, candidate.z, params)
  if (![f0, f1].every(Number.isFinite)) return false
  const scale = Math.max(1, Math.abs(f0), Math.abs(f1))
  const crossed = f0 === 0 || f1 === 0 || f0 * f1 < 0
  const near = Math.min(Math.abs(f0), Math.abs(f1)) / scale < 0.025
  return (crossed || near) && Math.abs(h) > 8 * minAbsStep
}

function integrateBranchAdaptive(z0, t0, params, view, direction, options = {}) {
  const points = []
  let z = z0
  let t = t0
  const zEnd = direction > 0 ? view.zMax : view.zMin
  const total = Math.abs(zEnd - z0)
  if (total <= 1e-12) return points

  const maxPoints = Math.max(64, options.maxPoints ?? 900)
  const minAbsStep = Math.max(1e-6, options.minAbsStep ?? total / 20000)
  const maxAbsStep = Math.max(minAbsStep, options.maxAbsStep ?? total / 32)
  const initialAbsStep = Math.max(minAbsStep, Math.min(maxAbsStep, options.initialAbsStep ?? total / 140))
  const tolerance = Math.max(1e-6, options.tolerance ?? 2.5e-3)
  const maxJumpT = options.maxJumpT ?? 0.18 * Math.max(1, view.tMax - view.tMin)

  const scales = {
    t: Math.max(1e-12, Math.max(1, view.tMax - view.tMin)),
    z: Math.max(1e-12, Math.max(1, view.zMax - view.zMin)),
  }

  let h = direction * initialAbsStep
  let accepted = 0
  let rejectedInRow = 0

  const collectAll = Boolean(options.collectAll)
  const clipView = options.clipView ?? view
  const sonicFn = options.sonicFn

  const firstPoint = makeRarefactionPoint(z, t, params)
  if (firstPoint && (collectAll || insideView(t, z, clipView))) points.push(firstPoint)

  while (accepted < maxPoints) {
    const remaining = Math.abs(zEnd - z)
    if (remaining <= 1e-12) break

    const maxVisualStep = Number.isFinite(options.maxVisualStep) ? Math.max(1e-5, options.maxVisualStep) : null
    const visualStepCap = maxVisualStep
      ? Math.abs(visualZToPhysical(Math.max(
        VISUAL_Z_MIN + 1e-4,
        Math.min(VISUAL_Z_MAX - 1e-4, physicalZToVisual(z) + direction * maxVisualStep),
      )) - z)
      : Number.POSITIVE_INFINITY
    const absH = Math.min(Math.abs(h), remaining, maxAbsStep, visualStepCap)
    h = direction * Math.max(minAbsStep, absH)

    const candidate = tryAdaptiveStep(z, t, h, params, scales)

    if (!candidate) {
      if (Math.abs(h) <= minAbsStep * 1.01) break
      h *= 0.5
      rejectedInRow += 1
      if (rejectedInRow > 20) break
      continue
    }

    if (candidate.error > tolerance && Math.abs(h) > minAbsStep * 1.01) {
      h *= 0.5
      rejectedInRow += 1
      if (rejectedInRow > 24) break
      continue
    }

    // Refinamento local perto de R_± ∩ S^±.  Essa região é a semente da
    // composta e da saturação; se o passo em z atravessa a sônica com poucos
    // pontos, a malha Sat_H(R) fica com leques/triângulos grandes.
    if (sonicRefinementNeeded(z, t, candidate, params, sonicFn, h, minAbsStep)) {
      h *= 0.5
      rejectedInRow += 1
      if (rejectedInRow > 28) break
      continue
    }

    const jumpT = Math.abs(candidate.t - t)
    if (jumpT > maxJumpT && Math.abs(h) > minAbsStep * 1.01) {
      h *= 0.5
      rejectedInRow += 1
      if (rejectedInRow > 24) break
      continue
    }
    if (jumpT > maxJumpT) break

    z = candidate.z
    t = candidate.t
    accepted += 1
    rejectedInRow = 0

    const point = makeRarefactionPoint(z, t, params)
    if (!point) break

    if (collectAll) {
      points.push(point)
    } else if (!insideView(t, z, clipView)) {
      if (points.length >= 2) break
    } else {
      points.push(point)
    }

    // Controlador simples de passo: aumenta em regiões suaves e reduz perto
    // de curvatura/singularidade. O limitador evita oscilações grandes.
    if (candidate.error < tolerance * 0.15) {
      h *= 1.45
    } else if (candidate.error < tolerance * 0.45) {
      h *= 1.18
    } else if (candidate.error > tolerance * 0.85) {
      h *= 0.75
    }

    if ((direction > 0 && z >= view.zMax) || (direction < 0 && z <= view.zMin)) break
  }

  return points
}

function waveDirectionFromAppDirection(direction) {
  // Convenção geométrica escolhida:
  // R_- acompanha a seleção lenta/forward e é orientada por dλ=ds>0.
  // R_+ acompanha a seleção rápida/backward e é orientada por dλ=ds<0.
  return normalizeHugoniotDirection(direction) === FORWARD_HUGONIOT ? 'minus' : 'plus'
}

export function buildRarefactionLeaf({ fixedState, params, view, samples = 500, direction = FORWARD_HUGONIOT, constrainZ: _constrainZ = false, continuation = false, compactifiedZ = false }) {
  const waveDirection = waveDirectionFromAppDirection(direction)
  const orientation = orientationFromDirection({ family: 'rarefaction', direction: waveDirection })
  const name = waveDirection === 'plus' ? 'R_+' : 'R_-'

  if (!fixedState || !Number.isFinite(fixedState.z) || !Number.isFinite(fixedState.t)) {
    const curve = makeWaveCurve({ name, family: 'rarefaction', direction: waveDirection, orientation })
    return makeWaveLeaf({ name, family: 'rarefaction', direction: waveDirection, orientation, curve })
  }

  // Separacao essencial:
  // - drawView: janela usada somente para desenhar a rarefacao visual.
  // - computeView: dominio computacional da curva integral da EDO.
  // A continuacao da variedade deve usar continuation=true; nesse modo o
  // dominio computacional e proprio da EDO e nao depende da camera/eixos.
  const compactMargin = 1e-4
  const drawView = compactifiedZ
    ? {
      ...expandedRarefactionView(view, 1.0, 0),
      zMin: visualZToPhysical(VISUAL_Z_MIN + compactMargin),
      zMax: visualZToPhysical(VISUAL_Z_MAX - compactMargin),
    }
    : expandedRarefactionView(view, 1.0, 0)
  const computeView = compactifiedZ
    ? drawView
    : continuation
      ? rarefactionContinuationView(fixedState, view)
      : drawView

  const isMinus = waveDirection === 'minus'
  const targetSamples = continuation
    ? Math.max(isMinus ? 1400 : 1100, samples * (isMinus ? 2.2 : 1.8))
    : Math.max(600, samples)
  const zSpan = Math.max(1, computeView.zMax - computeView.zMin)
  const tSpan = Math.max(1, computeView.tMax - computeView.tMin)
  const branchBudget = continuation
    ? Math.max(isMinus ? 1400 : 1100, Math.floor(targetSamples / 2))
    : Math.max(300, Math.floor(targetSamples / 2))
  const sonicFn = waveDirection === 'plus' ? sonicImplicitF : sonicLeftImplicitF

  const integratorOptions = {
    // A continuação global da rarefação precisa de muitos pontos porque ela é
    // a geratriz da superfície Sat_H(R).  R_- recebe orçamento maior, pois é a
    // região onde apareceram triângulos grandes perto da inflexão e de z=0.
    maxPoints: compactifiedZ ? 8000 : Math.max(256, Math.min(continuation ? (isMinus ? 4200 : 3400) : 2600, Math.max(branchBudget, targetSamples))),
    initialAbsStep: compactifiedZ ? 0.01 : zSpan / Math.max(continuation ? (isMinus ? 680 : 560) : 260, branchBudget * (continuation ? 2.6 : 1.8)),
    maxAbsStep: compactifiedZ ? Math.max(8, zSpan / 64) : zSpan / (continuation ? (isMinus ? 260 : 220) : 96),
    minAbsStep: compactifiedZ ? 1e-6 : zSpan / (continuation ? 180000 : 60000),
    tolerance: continuation ? (isMinus ? 8.0e-4 : 1.0e-3) : 5.0e-4,
    maxJumpT: continuation ? Math.max(80, 0.45 * tSpan) : 0.10 * tSpan,
    collectAll: continuation || compactifiedZ,
    clipView: drawView,
    sonicFn: continuation ? sonicFn : null,
    maxVisualStep: compactifiedZ ? 0.004 : null,
  }

  const backward = integrateBranchAdaptive(fixedState.z, fixedState.t, params, computeView, -1, integratorOptions).reverse()
  const forward = integrateBranchAdaptive(fixedState.z, fixedState.t, params, computeView, 1, integratorOptions)

  const raw = [...backward]
  if (forward.length > 0) {
    const last = raw[raw.length - 1]
    const first = forward[0]
    const skipDuplicate = last && first && Math.abs(last.z - first.z) < 1e-10 && Math.abs(last.t - first.t) < 1e-10
    raw.push(...(skipDuplicate ? forward.slice(1) : forward))
  }

  const jumpTMax = 0.30 * tSpan
  const segments = splitSegmentsAtLargeJumps(raw, {
    maxJumpT: jumpTMax,
    maxJumpY: 1e-8,
    maxJumpZ: compactifiedZ ? Number.POSITIVE_INFINITY : Math.max(zSpan / 64, 1e-6),
  })

  const speedFn = (point) => waveSpeed(point.t, point.z, params)
  const orientedSegments = orientSegmentsBySpeed(segments, speedFn, orientation)
  const { speeds, admissible } = annotateSpeedsAndAdmissibility(
    orientedSegments,
    speedFn,
    orientation,
  )

  const validRawPoints = raw.filter(Boolean)

  const curve = makeWaveCurve({
    name,
    family: 'rarefaction',
    direction: waveDirection,
    segments: orientedSegments,
    speeds,
    admissible,
    orientation,
    metadata: {
      fixedState,
      originalDirection: direction,
      sampler: compactifiedZ ? 'adaptive-rk4-dtdz-compactified' : continuation ? 'adaptive-rk4-dtdz-continuation' : 'adaptive-rk4-dtdz-visual',
      sampledPointCount: validRawPoints.length,
    },
  })

  return makeWaveLeaf({
    name,
    family: 'rarefaction',
    direction: waveDirection,
    orientation,
    basePoint: fixedState,
    curve,
    metadata: {
      fixedState,
      sampler: compactifiedZ ? 'adaptive-rk4-dtdz-compactified' : continuation ? 'adaptive-rk4-dtdz-continuation' : 'adaptive-rk4-dtdz-visual',
      sampledPointCount: validRawPoints.length,
    },
  })
}

export function buildRarefactionContinuationLeaf(args) {
  return buildRarefactionLeaf({ ...args, continuation: true })
}
