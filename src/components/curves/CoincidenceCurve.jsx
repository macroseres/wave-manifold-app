import React, { useMemo } from 'react'
import { ZCompactifiedLine as Line } from '../../app/scene/ZCompactification'
import { buildCoincidenceCurveSegments } from '../../entities/coincidence'
import { waveColors } from '../../config/waveColors'

export default function CoincidenceCurve({ view, visible = true }) {
  const segments = useMemo(() => buildCoincidenceCurveSegments(view), [view])
  if (!visible || segments.length === 0) return null
  return (
    <group>
      {segments.map((points, idx) => (
        <Line
          key={`coincidence-${idx}`}
          points={points}
          color={waveColors.coincidence ?? '#525252'}
          lineWidth={1.35}
          renderOrder={8}
        />
      ))}
    </group>
  )
}
