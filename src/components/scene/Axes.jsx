import React from 'react'
import { Html, Line as VisualLine } from '@react-three/drei'
import { ZCompactifiedLine as Line } from '../../app/scene/ZCompactification'
import { displayCoordinates } from '../../ui/display'
import { VISUAL_Z_MAX, VISUAL_Z_MIN } from '../../geometry/zCompactification'

export default function Axes({ view }) {
  const { yMin, yMax, tMin, tMax } = view
  const axisColor = '#ffffff'

  return (
    <group>
      <Line points={[[tMin, 0, 0], [tMax, 0, 0]]} color={axisColor} lineWidth={1.35} />
      <Line points={[[0, yMin, 0], [0, yMax, 0]]} color={axisColor} lineWidth={1.35} />
      <VisualLine points={[[0, 0, VISUAL_Z_MIN], [0, 0, VISUAL_Z_MAX]]} color={axisColor} lineWidth={1.35} />

      <Html position={[tMax + 0.25, 0, 0]} center>
        <div style={{ color: axisColor, fontWeight: 'bold', fontSize: 16 }}>{displayCoordinates.tau}</div>
      </Html>

      <Html position={[0, yMax + 0.25, 0]} center>
        <div style={{ color: axisColor, fontWeight: 'bold', fontSize: 16 }}>Y</div>
      </Html>

      <Html position={[0, 0, VISUAL_Z_MAX + 0.12]} center>
        <div style={{ color: axisColor, fontWeight: 'bold', fontSize: 16 }}>ẑ</div>
      </Html>

    </group>
  )
}
