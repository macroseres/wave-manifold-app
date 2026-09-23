import { waveColors } from '../../../config/waveColors.js'
import React, { useMemo } from 'react'
import { ZCompactifiedLine } from '../../../app/scene/ZCompactification'
import { buildHysteresisSelfIntersectionSegments } from '../../../geometry/hysteresisSelfIntersection'

export default function HysteresisSaturationSelfIntersectionCurve({ params, view, visible = true, source = 'right', direction = 'minus' }) {
  const segments = useMemo(() => visible ? buildHysteresisSelfIntersectionSegments(params, view, source, direction) : [], [params, view, visible, source, direction])
  return <group>{segments.map((points, index) => (
    <ZCompactifiedLine key={index} points={points} color={source === 'left' ? waveColors.leftHysteresisSelfIntersection : waveColors.hysteresisSelfIntersection} lineWidth={1.35}
      transparent opacity={1} depthWrite={false} renderOrder={20} />
  ))}</group>
}

