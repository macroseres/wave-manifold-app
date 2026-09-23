import React, { useMemo } from 'react'
import { ZCompactifiedLine as Line } from '../../../app/scene/ZCompactification'
import { buildSecondaryLeftBifurcationSegments } from '../../../entities/bifurcation'
import { waveColors } from '../../../config/waveColors'

export default function SecondaryMinusBifurcationCurve({ params, view, resolution = 40, visible = true }) {
  const segments = useMemo(
    () => visible ? buildSecondaryLeftBifurcationSegments(params, view, Math.max(220, Math.min(520, resolution * 6)), { compactifiedZ: true }) : [],
    [params, view, resolution, visible],
  )

  if (!visible || segments.length === 0) return null

  return (
    <group>
      {segments.map((points, idx) => (
        <Line
          key={`secondary-left-bifurcation-${idx}`}
          points={points}
          color={waveColors.bifurcationLeft ?? '#7c3aed'}
          lineWidth={1.35}
          renderOrder={7}
        />
      ))}
    </group>
  )
}

