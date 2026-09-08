import HysteresisSelfIntersectionCurve from '../../../components/curves/HysteresisSelfIntersectionCurve.jsx'
import React from 'react'

import CoincidenceCurve from '../../../components/curves/CoincidenceCurve.jsx'
import { HysteresisLeftCurve, HysteresisRightCurve } from '../../../components/curves/HysteresisCurve.jsx'
import HugoniotCurve from '../../../components/curves/HugoniotCurve.jsx'
import RarefactionCurve from '../../../components/curves/RarefactionCurve.jsx'
import { CompositeSlowCurve, CompositeFastCurve } from '../../../components/curves/CompositeCurve.jsx'
import SecondaryRightBifurcationCurve from '../../../components/curves/SecondaryRightBifurcationCurve.jsx'
import { DoubleSonicCurve, InflectionFastCurve, InflectionSlowCurve } from '../../../components/curves/SonicIntersectionCurves.jsx'
import { ExtensionCoincidenceMinusCurve, ExtensionCoincidencePlusCurve } from '../../../components/curves/SonicExtensionCurve.jsx'

const curveRegistry = {
  'hysteresis-self-intersection': HysteresisSelfIntersectionCurve,
  coincidence: CoincidenceCurve,
  'hysteresis-left': HysteresisLeftCurve,
  'hysteresis-right': HysteresisRightCurve,
  hugoniot: HugoniotCurve,
  rarefaction: RarefactionCurve,
  'composite-slow': CompositeSlowCurve,
  'composite-fast': CompositeFastCurve,
  'secondary-right-bifurcation': SecondaryRightBifurcationCurve,
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

