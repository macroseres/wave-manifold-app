import React, { useMemo } from 'react'
import { ZCompactifiedLine as Line } from '../../../app/scene/ZCompactification'
import { waveColors } from '../../../entities/surfaceImplicit'
import { buildHysteresisCurveSegments, solveLeftHysteresisPoint, solveRightHysteresisPoint } from '../../../entities/hysteresis'

function HysteresisCurve({ params, view, resolution = 40, visible = true, solver, color }) {
  const segments = useMemo(() => {
    if (!visible) return []
    const samples = Math.max(240, Math.min(520, resolution * 6))
    return buildHysteresisCurveSegments(params, view, samples, solver)
  }, [params, view, resolution, visible, solver])

  if (!visible || segments.length === 0) return null

  return (
    <group>
      {segments.map((points, idx) => (
        <Line
          key={idx}
          points={points}
          color={color}
          lineWidth={1.35}
        />
      ))}
    </group>
  )
}

export function HysteresisLeftCurve({ params, view, resolution = 40, visible = true }) {
  return (
    <HysteresisCurve
      params={params}
      view={view}
      resolution={resolution}
      visible={visible}
      solver={solveLeftHysteresisPoint}
      color={waveColors.hysteresisLeft ?? '#64748b'}
    />
  )
}

export function HysteresisRightCurve({ params, view, resolution = 40, visible = true }) {
  return (
    <HysteresisCurve
      params={params}
      view={view}
      resolution={resolution}
      visible={visible}
      solver={solveRightHysteresisPoint}
      color={waveColors.hysteresisRight ?? '#111827'}
    />
  )
}

export default function HysteresisCurves({ params, view, resolution = 40, visible = true }) {
  return (
    <group>
      <HysteresisLeftCurve params={params} view={view} resolution={resolution} visible={visible} />
      <HysteresisRightCurve params={params} view={view} resolution={resolution} visible={visible} />
    </group>
  )
}
