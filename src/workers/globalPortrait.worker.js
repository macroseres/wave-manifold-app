import { buildGlobalRarefactionPortrait } from '../entities/phasePortrait/rarefactionPortrait.js'
import { buildCompositePortrait } from '../entities/phasePortrait/compositePortrait.js'
import { buildRarefactionSpecialElements } from '../entities/phasePortrait/rarefactionSpecialElements.js'

self.onmessage = ({ data: { params, view, resolution, composite, previous } }) => {
  try {
    const leaves = previous?.leaves ?? buildGlobalRarefactionPortrait(params, view, resolution)
    const data = previous ?? { leaves, components: [], special: buildRarefactionSpecialElements(leaves, params, view) }
    if (composite) {
      self.postMessage({ data, complete: false })
      data.components = buildCompositePortrait(leaves, params, view, resolution)
    }
    self.postMessage({ data, complete: true, hasComposite: composite })
  } catch (error) { self.postMessage({ error: error.message }) }
}
