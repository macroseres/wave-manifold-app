import { buildCompositeBifoliation as buildCompositeBifoliationCore } from './compositeBifoliation.js'
import { buildSaturatedHugoniotBifoliation } from './saturatedBifoliation.js'
import {
  buildHugoniotBifoliation,
  buildRarefactionBifoliation,
  selectLeafFromBifoliation,
} from './basicBifoliations.js'

export {
  buildHugoniotBifoliation,
  buildRarefactionBifoliation,
  selectLeafFromBifoliation,
  buildSaturatedHugoniotBifoliation,
}

/**
 * Bifolheação composta derivada:
 *   K_- = Sat_{H_-}(R_-) ∩ S^-
 *   K_+ = Sat_{H_+}(R_+) ∩ S^+
 */
export function buildCompositeBifoliation(args) {
  return buildCompositeBifoliationCore(args)
}

/**
 * Pacote canônico das três bifolheações do projeto:
 *   mathcal R_pm: rarefação;
 *   mathcal H_pm: Hugoniot;
 *   mathcal K_pm: composta derivada de Sat_{mathcal H}(mathcal R) cap S.
 */
export function buildCanonicalWaveBifoliations({ fixedState, params, view, samples = 500, resolution = 40 }) {
  const mathcalR = buildRarefactionBifoliation({ fixedState, params, view, samples, constrainZ: false })
  const mathcalH = buildHugoniotBifoliation({ fixedState, params, view, samples })
  const mathcalK = buildCompositeBifoliationCore({ fixedState, params, view, samples, resolution })
  return {
    mathcalR,
    mathcalH,
    mathcalK,
    metadata: {
      definition: '(mathcal R_pm, mathcal H_pm, mathcal K_pm)',
      composite: 'mathcal K_pm = (Sat_{mathcal H_pm}(mathcal R_pm)) cap S^pm',
    },
  }
}
