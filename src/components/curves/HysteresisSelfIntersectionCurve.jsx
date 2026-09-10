import { waveColors } from '../../config/waveColors.js'
import React, { useMemo } from 'react'
import { ZCompactifiedLine } from '../../app/scene/ZCompactification'
import { buildHysteresisSelfIntersectionSegments } from '../../geometry/hysteresisSelfIntersection'

export default function HysteresisSelfIntersectionCurve({ params, view, visible = true }) {
  const segments = useMemo(() => visible ? buildHysteresisSelfIntersectionSegments(params, view) : [], [params, view, visible])
  return <group>{segments.map((points, index) => (
    <ZCompactifiedLine key={index} points={points} color={waveColors.hysteresisSelfIntersection} lineWidth={1.35}
      transparent opacity={1} depthWrite={false} renderOrder={20} />
  ))}</group>
}

