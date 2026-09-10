import { BACKWARD_HUGONIOT, FORWARD_HUGONIOT, normalizeHugoniotDirection } from '../../hugoniot/directions.js'
import { makeWaveBifoliation, makeWaveCurve, makeWaveLeaf } from '../../shared/types/mathTypes.js'
import { finite, compositeBaseRarefactionSampleCount, buildCompositeBaseRarefaction } from './sampling.js'
import { buildHugoniotBifoliation, buildRarefactionBifoliation } from '../../waves/basicBifoliations.js'
import { orientationFromDirection } from '../../waves/orientation.js'
import { COMPOSITE, HUGONIOT, RAREFACTION, clampResolutionSamples } from '../../../config/numerics.js'
import { compositeContinuationView, makeRarefactionParam, makeCompositeLevelFunction, findRarefactionSonicAnchors } from './parametrization.js'
import { traceLevelSet } from './continuation.js'
import { extractGlobalCompositeLevelSet } from './marchingSquares.js'

function buildCompositeFromRarefactionSegment(segment, params, calcView, renderView, direction, sonicTarget, fixedState, desiredSonicBranch = 'all', mathcalR = null, mathcalH = null) {
  const rareParam = makeRarefactionParam(segment, calcView)
  if (!rareParam) return null
  const anchors = findRarefactionSonicAnchors(rareParam, params, sonicTarget, fixedState, calcView, desiredSonicBranch)
  if (!anchors.length) return null

  const etaSpan = Math.max(1e-9, calcView.zMax - calcView.zMin)
  // A composta desenhada continua limitada no eixo z pelo calcView,
  // mas a folha de Hugoniot usada na saturacao precisa de um intervalo
  // maior em eta. Caso contrario, S(mathcal W(u,eta))=0 pode existir,
  // mas ficar fora do dominio parametrico testado.
  const etaMarginFactor = COMPOSITE.HUGONIOT_SATURATION_ETA_MARGIN_FACTOR ?? COMPOSITE.ETA_MARGIN_FACTOR ?? 0
  const etaMargin = Math.max(0, etaMarginFactor) * etaSpan
  const etaMin = Math.min(calcView.zMin - etaMargin, renderView.zMin)
  const etaMax = Math.max(calcView.zMax + etaMargin, renderView.zMax)
  const level = makeCompositeLevelFunction(rareParam, params, direction, sonicTarget, etaMin, etaMax, desiredSonicBranch, mathcalR, mathcalH, renderView.compactifiedZ)

  const anchorPoints = anchors
    .map((anchor) => {
      if (!anchor?.point) return null
      const seedW = level.wFromEta(anchor.eta)
      const seedObj = level.evalAt(anchor.u, seedW)
      const point = seedObj?.point
      if (point?.coords?.every(finite)) return point
      if ([point?.t, point?.Y, point?.z].every(finite)) {
        return { ...point, coords: [point.t, point.Y, point.z] }
      }
      // Fallback: rarefaction/sonic anchor on the characteristic. It is kept
      // only when the composite level evaluation fails; the normal path uses
      // the actual point on K so that A(K_±) starts on the correct branch.
      return { ...anchor.point, Y: 0, coords: [anchor.point.t, 0, anchor.point.z] }
    })
    .filter(Boolean)

  // Regra global real: extraímos a curva de nível inteira F(u,w)=0 por
  // marching squares no domínio estendido (u,w). Assim aparecem componentes
  // desconexas, laços e ramos que não contêm a inflexão. A continuação local
  // por pseudo-arclength fica apenas como fallback caso a malha não detecte
  // nenhum segmento.
  let allSegments = extractGlobalCompositeLevelSet(level, renderView, params)

  if (!allSegments.length) {
    const localSegments = []
    for (const anchor of anchors) {
      const seedW = level.wFromEta(anchor.eta)
      const seedObj = level.evalAt(anchor.u, seedW)
      if (!seedObj?.point) continue
      const forward = traceLevelSet(level, anchor.u, seedW, 1, renderView)
      const backward = traceLevelSet(level, anchor.u, seedW, -1, renderView).reverse()
      const joined = (backward.length && forward.length ? [...backward, ...forward.slice(1)] : [...backward, ...forward])
        .filter((point) => point?.coords?.every(finite))
      if (joined.length >= 2) localSegments.push(joined)
    }
    allSegments = localSegments
  }

  if (!allSegments.length) return null

  return {
    segments: allSegments,
    sonicAnchorPoint: anchorPoints[0] ?? null,
    sonicAnchorPoints: anchorPoints,
    metadata: {
      construction: 'mathcalK = (Sat_mathcalH mathcalR) cap S, global marching-squares level set',
      sourceBifoliations: {
        rarefaction: mathcalR?.metadata?.notation ?? '(\\mathcal R_-, \\mathcal R_+)',
        hugoniot: mathcalH?.metadata?.notation ?? '(\\mathcal H_-, \\mathcal H_+)',
      },
      note: 'curva composta global extraida como F(u,w)=0 por marching squares; sem filtro de conectividade; recorte somente em z pelo calcView',
      sonicBranch: desiredSonicBranch,
    },
  }
}

export function buildCompositeSegmentsFromRarefaction(rare, params, calcView, view, _inflectionBranch = 'all', direction = FORWARD_HUGONIOT, sonicTarget = 'left', fixedState = null) {
  const result = buildCompositeFromRarefactionSegment(rare, params, calcView, view, direction, sonicTarget, fixedState, _inflectionBranch)
  return result ?? { segments: [], inflectionPoint: null }
}

export function buildCompositeSegments(fixedState, params, view, samples, resolution, _inflectionBranch = 'all', direction = FORWARD_HUGONIOT, sonicTarget = 'left', renderView = view) {
  if (!fixedState) return { segments: [], inflectionPoint: null, endpoint: null }
  const calcView = compositeContinuationView(fixedState, view)
  const compositeSamples = compositeBaseRarefactionSampleCount(samples, resolution)
  const mathcalR = buildRarefactionBifoliation({ fixedState, params, view: calcView, samples: compositeSamples, constrainZ: false })
  const mathcalH = buildHugoniotBifoliation({ fixedState, params, view: calcView, samples: clampResolutionSamples(resolution * HUGONIOT.SAMPLES_PER_RESOLUTION, HUGONIOT.MIN_SAMPLES, HUGONIOT.MAX_SAMPLES) })
  const rareSegments = buildCompositeBaseRarefaction({
    fixedState,
    params,
    view: calcView,
    samples,
    resolution,
    direction,
    mathcalR,
  })

  const results = rareSegments
    .map((segment) => buildCompositeFromRarefactionSegment(segment, params, calcView, renderView, direction, sonicTarget, fixedState, _inflectionBranch, mathcalR, mathcalH))
    .filter((result) => result?.segments?.length)

  if (!results.length) return { segments: [], inflectionPoint: null, endpoint: null }

  // Regra global: manter todos os ramos encontrados em todos os segmentos da
  // rarefação. Não escolhemos o ramo de menor distância ao estado fixo.
  const segments = results.flatMap((result) => result.segments ?? [])
  const sonicAnchorPoints = results.flatMap((result) => result.sonicAnchorPoints ?? (result.sonicAnchorPoint ? [result.sonicAnchorPoint] : []))
  const sonicAnchorPoint = sonicAnchorPoints[0] ?? null

  return {
    segments,
    inflectionPoint: sonicAnchorPoint,
    sonicAnchorPoint,
    sonicAnchorPoints,
    metadata: {
      construction: 'mathcal K_pm as global marching-squares level set S(mathcal W_pm(u,eta))=0, with mathcal W_pm = Sat_{mathcal H_pm}(mathcal R_pm); no connectivity filter; z-clipped to calcView',
      sonicBranch: _inflectionBranch,
      definition: normalizeHugoniotDirection(direction) === BACKWARD_HUGONIOT
        ? 'mathcal K_+ = (Sat_{mathcal H_+}(mathcal R_+)) cap S^+_f'
        : 'mathcal K_- = (Sat_{mathcal H_-}(mathcal R_-)) cap S^-_s',
    },
  }
}

export function buildCompositeArcRestrictedSegments(fixedState, params, view, samples, resolution, options = {}) {
  return buildCompositeSegments(
    fixedState,
    params,
    view,
    samples,
    resolution,
    options.inflectionBranch ?? 'all',
    normalizeHugoniotDirection(options.direction),
    options.sonicTarget ?? 'left',
  )
}

function branchFromDirection(direction) {
  return normalizeHugoniotDirection(direction) === BACKWARD_HUGONIOT ? 'plus' : 'minus'
}

export function buildCompositeBifoliationLeaf({ fixedState, params, view, samples = 650, resolution = 40, direction = FORWARD_HUGONIOT, inflectionBranch = 'slow', sonicTarget = 'left' }) {
  const branch = branchFromDirection(direction)
  const name = branch === 'plus' ? 'K_+' : 'K_-'
  const orientation = orientationFromDirection({ family: 'hugoniot', direction: branch })
  const { segments, inflectionPoint, metadata } = buildCompositeSegments(fixedState, params, view, samples, resolution, inflectionBranch, direction, sonicTarget)
  const curve = makeWaveCurve({
    name,
    family: 'composite',
    direction: branch,
    segments,
    orientation,
    metadata: {
      definition: 'mathcal K_pm = (Sat_{mathcal H_pm}(mathcal R_pm)) cap S^pm',
      construction: 'bifoliation-levelset-global-marching-squares',
      fixedState,
      inflectionPoint,
      sonicTarget,
      ...metadata,
    },
  })
  return makeWaveLeaf({ name, family: 'composite', direction: branch, orientation, basePoint: fixedState, curve, metadata: curve.metadata })
}

export function buildCompositeBifoliation({ fixedState, params, view, samples = 650, resolution = 40 }) {
  const minus = buildCompositeBifoliationLeaf({ fixedState, params, view, samples, resolution, direction: FORWARD_HUGONIOT, inflectionBranch: 'slow', sonicTarget: 'left' })
  const plus = buildCompositeBifoliationLeaf({ fixedState, params, view, samples, resolution, direction: BACKWARD_HUGONIOT, inflectionBranch: 'fast', sonicTarget: 'right' })
  return makeWaveBifoliation({
    name: 'Composite bifoliation',
    family: 'composite',
    minus,
    plus,
    metadata: {
      definition: 'mathcal K_pm = (Sat_{mathcal H_pm}(mathcal R_pm)) cap S^pm',
      construction: 'bifoliation-levelset-global-marching-squares',
    },
  })
}
