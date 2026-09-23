import HopfSurface from '../../../components/objects/hopf/HopfSurface.jsx'

import CharacteristicSurface from '../../../components/objects/characteristic/CharacteristicSurface.jsx'
import SonicPlusSurface from '../../../components/objects/sonic/SonicPlusSurface.jsx'
import SonicMinusSurface from '../../../components/objects/sonic/SonicMinusSurface.jsx'
import HysteresisSaturationSurface from '../../../components/objects/hysteresis/HysteresisSaturationSurface.jsx'
import CoincidenceSaturationSurface from '../../../components/objects/coincidence/CoincidenceSaturationSurface.jsx'
import { RarefactionSaturationSlowSurface, RarefactionSaturationFastSurface } from '../../../components/objects/rarefaction/RarefactionSaturationSurfaces.jsx'

const surfaceRegistry = {
  hopf: HopfSurface,
  characteristic: CharacteristicSurface,
  'sonic-right': SonicPlusSurface,
  'sonic-left': SonicMinusSurface,
  saturated: HysteresisSaturationSurface,
  'saturated-coincidence': CoincidenceSaturationSurface,
  'composite-saturated-slow': RarefactionSaturationSlowSurface,
  'composite-saturated-fast': RarefactionSaturationFastSurface,
}

export default function ImplicitSurface({ type, ...props }) {
  const Surface = surfaceRegistry[type]
  if (!Surface) {
    console.warn(`ImplicitSurface: unknown type "${type}"`)
    return null
  }
  return <Surface {...props} />
}
