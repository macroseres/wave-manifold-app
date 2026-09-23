import { useMemo } from 'react'
import { solveInflectionSegments, waveColors } from '../../../entities/surfaceImplicit'
import CurveSegments from '../shared/CurveSegments'

export function InflectionSlowCurve({ params, view, resolution = 40, visible = true }) {
  const segments = useMemo(() => visible ? solveInflectionSegments(params, view, Math.max(260, Math.min(580, resolution * 7)), 'slow', { compactifiedZ: true }) : [], [params, view, resolution, visible])
  if (!visible) return null
  return <CurveSegments segments={segments} color={waveColors.inflectionSlow ?? waveColors.inflection ?? '#06b6d4'} lineWidth={1.35} />
}

export function InflectionFastCurve({ params, view, resolution = 40, visible = true }) {
  const segments = useMemo(() => visible ? solveInflectionSegments(params, view, Math.max(260, Math.min(580, resolution * 7)), 'fast', { compactifiedZ: true }) : [], [params, view, resolution, visible])
  if (!visible) return null
  return <CurveSegments segments={segments} color={waveColors.inflectionFast ?? waveColors.inflection ?? '#06b6d4'} lineWidth={1.35} />
}
