import HysteresisSaturationSelfIntersectionCurve from '../../../components/objects/hysteresis/HysteresisSaturationSelfIntersectionCurve.jsx'


import CoincidenceCurve from '../../../components/objects/coincidence/CoincidenceCurve.jsx'
import { HysteresisLeftCurve, HysteresisRightCurve } from '../../../components/objects/hysteresis/HysteresisCurves.jsx'
import HugoniotCurve from '../../../components/objects/hugoniot/HugoniotCurve.jsx'
import RarefactionCurve from '../../../components/objects/rarefaction/RarefactionCurve.jsx'
import { CompositeSlowCurve, CompositeFastCurve } from '../../../components/objects/composite/CompositeCurves.jsx'
import SecondaryMinusBifurcationCurve from '../../../components/objects/bifurcation/SecondaryMinusBifurcationCurve.jsx'
import SecondaryPlusBifurcationCurve from '../../../components/objects/bifurcation/SecondaryPlusBifurcationCurve.jsx'
import DoubleSonicCurve from '../../../components/objects/doubleSonic/DoubleSonicCurve.jsx'
import { InflectionFastCurve, InflectionSlowCurve } from '../../../components/objects/inflection/InflectionCurves.jsx'
import { ExtensionCoincidenceMinusCurve, ExtensionCoincidencePlusCurve } from '../../../components/objects/coincidence/CoincidenceExtensionCurves.jsx'

const curveRegistry = {
  'hysteresis-self-intersection': HysteresisSaturationSelfIntersectionCurve,
  coincidence: CoincidenceCurve,
  'hysteresis-left': HysteresisLeftCurve,
  'hysteresis-right': HysteresisRightCurve,
  hugoniot: HugoniotCurve,
  rarefaction: RarefactionCurve,
  'composite-slow': CompositeSlowCurve,
  'composite-fast': CompositeFastCurve,
  'secondary-left-bifurcation': SecondaryMinusBifurcationCurve,
  'secondary-right-bifurcation': SecondaryPlusBifurcationCurve,
  'inflection-slow': InflectionSlowCurve,
  'inflection-fast': InflectionFastCurve,
  'double-sonic': DoubleSonicCurve,
  'extension-coincidence-minus': ExtensionCoincidenceMinusCurve,
  'extension-coincidence-plus': ExtensionCoincidencePlusCurve,
}

export default function WaveCurve({ type, ...props }) {
  const Curve = curveRegistry[type]
  if (!Curve) {
    console.warn(`WaveCurve: unknown type "${type}"`)
    return null
  }
  return <Curve {...props} />
}

