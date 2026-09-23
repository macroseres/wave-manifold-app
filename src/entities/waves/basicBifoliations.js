import { BACKWARD_HUGONIOT, FORWARD_HUGONIOT } from '../hugoniot/directions.js'
import { createWaveBifoliation } from '../shared/types/mathTypes.js'
import { buildHugoniotLeaf } from './hugoniotLeaf.js'
import { buildRarefactionContinuationLeaf } from './rarefactionLeaf.js'

/**
 * Núcleo canônico das bifolheações básicas.
 *
 * mathcal H_pm: folhas de Hugoniot H_-, H_+.
 * mathcal R_pm: folhas de rarefação R_-, R_+.
 *
 * Este arquivo não importa a composta. Assim, Hugoniot, rarefação e composta
 * podem usar o mesmo núcleo sem criar dependência circular.
 */
export function buildHugoniotBifoliation({ fixedState, params, view, samples = 500, zExtensionMargin = 0, compactifiedZ = false }) {
  const minus = buildHugoniotLeaf({ fixedState, params, view, samples, direction: FORWARD_HUGONIOT, zExtensionMargin, compactifiedZ })
  const plus = buildHugoniotLeaf({ fixedState, params, view, samples, direction: BACKWARD_HUGONIOT, zExtensionMargin, compactifiedZ })

  return createWaveBifoliation({
    name: 'mathcal H_pm',
    family: 'hugoniot',
    minus,
    plus,
    metadata: {
      notation: '(\\mathcal H_-, \\mathcal H_+)',
      definition: 'bifolheacao de Hugoniot; cada curva H_\u00b1(U) e uma folha',
      convention: {
        minus: 'H_- orientada por ds < 0',
        plus: 'H_+ orientada por ds > 0',
      },
    },
  })
}

export function buildRarefactionBifoliation({ fixedState, params, view, samples = 500, constrainZ = false, compactifiedZ = false }) {
  const minus = buildRarefactionContinuationLeaf({
    fixedState,
    params,
    view,
    samples,
    constrainZ,
    direction: FORWARD_HUGONIOT,
    compactifiedZ,
  })
  const plus = buildRarefactionContinuationLeaf({
    fixedState,
    params,
    view,
    samples,
    constrainZ,
    direction: BACKWARD_HUGONIOT,
    compactifiedZ,
  })

  return createWaveBifoliation({
    name: 'mathcal R_pm',
    family: 'rarefaction',
    minus,
    plus,
    metadata: {
      notation: '(\\mathcal R_-, \\mathcal R_+)',
      definition: 'bifolheacao de rarefacao; cada curva R_\u00b1(U) e uma folha',
      convention: {
        minus: 'R_- orientada por dλ = ds > 0',
        plus: 'R_+ orientada por dλ = ds < 0',
      },
    },
  })
}

export function selectLeafFromBifoliation(bifoliation, direction = 'minus') {
  if (!bifoliation) return null
  return direction === 'plus' ? bifoliation.plus : bifoliation.minus
}
