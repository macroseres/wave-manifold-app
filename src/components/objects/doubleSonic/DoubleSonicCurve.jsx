import React, { useMemo } from 'react'
import { solveDoubleSonicSegments, waveColors } from '../../../entities/surfaceImplicit'
import CurveSegments from '../shared/CurveSegments'

export default function DoubleSonicCurve({ params, view, visible = true }) {
  const segments = useMemo(() => visible ? solveDoubleSonicSegments(params, view, { compactifiedZ: true }) : [], [params, view, visible])
  if (!visible) return null
  return <CurveSegments segments={segments} color={waveColors.doubleSonic ?? '#f59e0b'} lineWidth={1.35} />
}
