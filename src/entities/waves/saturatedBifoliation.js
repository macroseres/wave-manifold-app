import { BACKWARD_HUGONIOT, normalizeHugoniotDirection } from '../hugoniot/directions.js'
import { computeStateFromCharacteristicPoint, waveSpeed } from '../surfaceImplicit/index.js'
import { makeWaveBifoliation } from '../shared/types/mathTypes.js'
import { orientationFromDirection } from './orientation.js'
import {
  solveHugoniotPointForFixedState,
  solveBackwardHugoniotPointForFixedRightState,
} from './hugoniotBifoliation.js'

function finite(value) {
  return Number.isFinite(value)
}

function normalizePoint(point) {
  if (!point) return null
  const t = point.t ?? point.coords?.[0]
  const Y = point.Y ?? point.coords?.[1] ?? 0
  const z = point.z ?? point.coords?.[2]
  if (![t, Y, z].every(finite)) return null
  return { ...point, t, Y, z, coords: [t, Y, z] }
}

function computeGeneratorState(generator, params, direction) {
  const base = computeStateFromCharacteristicPoint(generator.t, generator.z, params)
  if (!base) return null

  // H_- usa estado esquerdo fixo. H_+ usa estado direito fixo.
  if (normalizeHugoniotDirection(direction) === BACKWARD_HUGONIOT) {
    return { t: base.t, Y: base.Y, z: base.z, uPlus: base.uMinus, vPlus: base.vMinus }
  }
  return base
}

function evaluateHugoniotEta({ eta, generator, params, direction }) {
  const state = computeGeneratorState(generator, params, direction)
  if (!state) return null

  const point = normalizeHugoniotDirection(direction) === BACKWARD_HUGONIOT
    ? solveBackwardHugoniotPointForFixedRightState(eta, state, params)
    : solveHugoniotPointForFixedState(eta, state, params)

  const normalized = normalizePoint(point)
  if (!normalized) return null

  return {
    ...normalized,
    generatorPoint: generator,
    generatorState: state,
    eta,
    shockSpeed: waveSpeed(normalized.t, normalized.z, params),
  }
}

/**
 * Saturação por bifolheação:
 *
 *   W_-(u,eta) = H_-(R_-(u),eta)
 *   W_+(u,eta) = H_+(R_+(u),eta)
 *
 * A primeira variável escolhe a folha da rarefação; a segunda percorre a
 * folha de Hugoniot associada a esse ponto gerador. Esta é a estrutura que a
 * composta deve intersectar com a sônica.
 */
export function makeSaturatedHugoniotBifoliation({
  rarefactionParam,
  params,
  direction,
  etaMin,
  etaMax,
  name,
  sourceBifoliations = {},
}) {
  const normalizedDirection = normalizeHugoniotDirection(direction)
  const branch = normalizedDirection === BACKWARD_HUGONIOT ? 'plus' : 'minus'
  const etaSpan = Math.max(1e-9, etaMax - etaMin)
  const etaFromW = (w) => etaMin + w * etaSpan
  const wFromEta = (eta) => (eta - etaMin) / etaSpan
  const orientation = orientationFromDirection({ family: 'hugoniot', direction: branch })

  const evaluate = (u, w) => {
    if (!finite(u) || !finite(w)) return null
    const generator = rarefactionParam?.interpolate?.(u)
    const normalizedGenerator = normalizePoint(generator)
    if (!normalizedGenerator) return null
    const eta = etaFromW(w)
    const point = evaluateHugoniotEta({ eta, generator: normalizedGenerator, params, direction: normalizedDirection })
    if (!point) return null
    return { point: { ...point, u, w }, generator: normalizedGenerator, state: point.generatorState, eta, u, w }
  }

  return {
    name: name ?? (branch === 'plus' ? 'mathcal W_f = Sat_{mathcal H_+}(mathcal R_+)' : 'mathcal W_s = Sat_{mathcal H_-}(mathcal R_-)'),
    family: 'saturated-hugoniot',
    branch,
    direction: normalizedDirection,
    orientation,
    etaMin,
    etaMax,
    etaFromW,
    wFromEta,
    evaluate,
    metadata: {
      definition: branch === 'plus'
        ? 'mathcal W_f(u,eta) = mathcal H_+(mathcal R_+(u),eta)'
        : 'mathcal W_s(u,eta) = mathcal H_-(mathcal R_-(u),eta)',
      sourceBifoliations,
      coordinates: ['u: parametro da rarefacao', 'w: eta normalizado da Hugoniot'],
    },
  }
}

export function buildSaturatedHugoniotBifoliation({ fixedState, minus = null, plus = null, metadata = {} } = {}) {
  return makeWaveBifoliation({
    name: 'Saturated Hugoniot bifoliation',
    family: 'saturated-hugoniot',
    minus,
    plus,
    metadata: {
      definition: 'mathcal W_pm = Sat_{mathcal H_pm}(mathcal R_pm)',
      fixedState,
      ...metadata,
    },
  })
}
