import { buildGlobalRarefactionPortrait } from '../entities/phasePortrait/rarefactionPortrait.js'
import { buildCompositePortrait } from '../entities/phasePortrait/compositePortrait.js'
import { buildRarefactionSpecialElements } from '../entities/phasePortrait/rarefactionSpecialElements.js'
import { buildCompositeSpecialElements, compositeRefinementLeaves, compositeLocalComponents } from '../entities/phasePortrait/compositeSpecialElements.js'

self.onmessage = ({ data: { params, view, resolution, composite, previous } }) => {
  try {
    const leaves = previous?.leaves ?? buildGlobalRarefactionPortrait(params, view, resolution)
    const data = previous ?? { leaves, components: [], special: buildRarefactionSpecialElements(leaves, params, view) }
    if (composite) {
      self.postMessage({ data, complete: false })
      data.compositeSpecial = buildCompositeSpecialElements(params, view)
      data.compositeRefinementLeaves = compositeRefinementLeaves(data.compositeSpecial.singularities, leaves, params, view, resolution)
      data.components = buildCompositePortrait([...leaves, ...data.compositeRefinementLeaves], params, view, resolution)
      data.components.push(...compositeLocalComponents(data.compositeSpecial.singularities, params, view))
    }
    self.postMessage({ data, complete: true, hasComposite: composite })
  } catch (error) { self.postMessage({ error: error.message }) }
}
