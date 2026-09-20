import React from 'react'
import HopfSurface from '../../../components/surfaces/HopfSurface.jsx'

import CharacteristicSurface from '../../../components/surfaces/CharacteristicSurface.jsx'
import SonicRightSurface from '../../../components/surfaces/SonicRightSurface.jsx'
import SonicLeftSurface from '../../../components/surfaces/SonicLeftSurface.jsx'
import SaturatedSurface from '../../../components/surfaces/SaturatedSurface.jsx'
import SaturatedCoincidenceSurface from '../../../components/surfaces/SaturatedCoincidenceSurface.jsx'
import { CompositeSaturatedSlowSurface, CompositeSaturatedFastSurface } from '../../../components/surfaces/CompositeSaturatedSurface.jsx'

const surfaceRegistry = {
  hopf: HopfSurface,
  characteristic: CharacteristicSurface,
  'sonic-right': SonicRightSurface,
  'sonic-left': SonicLeftSurface,
  saturated: SaturatedSurface,
  'saturated-coincidence': SaturatedCoincidenceSurface,
  'composite-saturated-slow': CompositeSaturatedSlowSurface,
  'composite-saturated-fast': CompositeSaturatedFastSurface,
}

export default function ImplicitSurface({ type, ...props }) {
  const Surface = surfaceRegistry[type]
  if (!Surface) {
    console.warn(`ImplicitSurface: unknown type "${type}"`)
    return null
  }
  return <Surface {...props} />
}
