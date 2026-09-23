import React, { useMemo } from 'react'
import { ZCompactifiedLine as Line } from '../../../app/scene/ZCompactification'
import { waveColors } from '../../../config/waveColors'
import { buildSonicSeparatorSegments } from '../../../entities/sonic/surfaceModel'

function CoincidenceExtensionCurve({ side, params, view, visible = true }) {
  const segments = useMemo(() => (
    visible
      ? buildSonicSeparatorSegments(side, params, view, { compactifiedZ: true })
      : []
  ), [side, params, view, visible])
  if (!visible || !segments.length) return null

  const color = side === 'left'
    ? waveColors.extensionCoincidenceMinus
    : waveColors.extensionCoincidencePlus
  return (
    <group>
      {segments.map((points, index) => (
        <Line
          key={`extension-${side}-${index}`}
          points={points}
          color={color}
          lineWidth={1.35}
          transparent
          opacity={0.96}
          depthTest
          depthWrite={false}
          renderOrder={16}
        />
      ))}
    </group>
  )
}

export function ExtensionCoincidenceMinusCurve(props) {
  return <CoincidenceExtensionCurve {...props} side="left" />
}

export function ExtensionCoincidencePlusCurve(props) {
  return <CoincidenceExtensionCurve {...props} side="right" />
}
