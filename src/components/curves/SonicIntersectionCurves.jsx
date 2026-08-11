import React, { useMemo } from 'react'
import { Line } from '@react-three/drei'
import {
  solveDoubleSonicSegments,
  solveInflectionSegments,
  waveColors,
} from '../../entities/surfaceImplicit'

function CurveGroup({ segments, color, lineWidth = 1.35, renderOrder = 6 }) {
  if (!segments?.length) return null
  return (
    <group>
      {segments.map((points, idx) => (
        <Line
          key={idx}
          points={points}
          color={color}
          lineWidth={lineWidth}
          renderOrder={renderOrder}
        />
      ))}
    </group>
  )
}

export function DoubleSonicCurve({ params, view, resolution = 40, visible = true }) {
  const segments = useMemo(() => visible ? solveDoubleSonicSegments(params, view, Math.max(240, Math.min(560, resolution * 7))) : [], [params, view, resolution, visible])
  if (!visible) return null
  return <CurveGroup segments={segments} color={waveColors.doubleSonic ?? '#f59e0b'} lineWidth={1.35} />
}

export function InflectionSlowCurve({ params, view, resolution = 40, visible = true }) {
  const segments = useMemo(() => visible ? solveInflectionSegments(params, view, Math.max(260, Math.min(580, resolution * 7)), 'slow') : [], [params, view, resolution, visible])
  if (!visible) return null
  return <CurveGroup segments={segments} color={waveColors.inflectionSlow ?? waveColors.inflection ?? '#06b6d4'} lineWidth={1.35} />
}

export function InflectionFastCurve({ params, view, resolution = 40, visible = true }) {
  const segments = useMemo(() => visible ? solveInflectionSegments(params, view, Math.max(260, Math.min(580, resolution * 7)), 'fast') : [], [params, view, resolution, visible])
  if (!visible) return null
  return <CurveGroup segments={segments} color={waveColors.inflectionFast ?? waveColors.inflection ?? '#06b6d4'} lineWidth={1.35} />
}
