import React from 'react'
import { Html, Line } from '@react-three/drei'
import { displayCoordinates } from '../../ui/display'

export default function Axes({ view }) {
  const { yMin, yMax, tMin, tMax, zMin, zMax } = view
  const axisColor = '#ffffff'

  return (
    <group>
      <Line points={[[tMin, 0, 0], [tMax, 0, 0]]} color={axisColor} lineWidth={1.35} />
      <Line points={[[0, yMin, 0], [0, yMax, 0]]} color={axisColor} lineWidth={1.35} />
      <Line points={[[0, 0, zMin], [0, 0, zMax]]} color={axisColor} lineWidth={1.35} />

      <Html position={[tMax + 0.25, 0, 0]} center>
        <div style={{ color: axisColor, fontWeight: 'bold', fontSize: 16 }}>{displayCoordinates.tau}</div>
      </Html>

      <Html position={[0, yMax + 0.25, 0]} center>
        <div style={{ color: axisColor, fontWeight: 'bold', fontSize: 16 }}>Y</div>
      </Html>

      <Html position={[0, 0, zMax + 0.25]} center>
        <div style={{ color: axisColor, fontWeight: 'bold', fontSize: 16 }}>z</div>
      </Html>
    </group>
  )
}
