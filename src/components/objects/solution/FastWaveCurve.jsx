import React, { useMemo } from 'react'
import { ZCompactifiedLine as Line } from '../../../app/scene/ZCompactification'
import OrientedArcMarkers from '../shared/OrientedArcMarkers'
import { buildShockSegments } from '../hugoniot/ShockCurve'
import { buildRarefactionArcSegments } from '../rarefaction/rarefactionArcUtils'
import { buildCompositeArcRestrictedSegments, solutionSpeedMode } from '../../../entities/waves'
import { waveColors } from '../../../config/waveColors'
import { reflectDaggerSegments } from '../../../entities/shared/reflection'
import { cleanSegment, validWavePoint } from '../../../geometry/pointUtils'

export function buildFastWaveSegments({ fixedState, anchorPoint, nonLocalAnchor, params, view, resolution }) {
  const hugoniotSpeedMode = solutionSpeedMode('fast', 'hugoniot')
  const rarefactionSpeedMode = solutionSpeedMode('fast', 'rarefaction')
  const compositeSpeedMode = solutionSpeedMode('fast', 'composite')
  const samples = Math.max(520, Math.min(900, resolution * 12))
  const segments = []

  for (const segment of buildShockSegments(fixedState, anchorPoint, params, view, samples, {
    hugoniotDirection: 'backward',
    speedMode: hugoniotSpeedMode,
    sonicTarget: 'right',
  })) {
    const clean = cleanSegment(segment)
    if (clean.length >= 2) segments.push(clean)
  }

  for (const segment of buildRarefactionArcSegments(anchorPoint, params, view, samples, rarefactionSpeedMode)) {
    const clean = cleanSegment(segment)
    if (clean.length >= 2) segments.push(clean)
  }

  const composite = buildCompositeArcRestrictedSegments(fixedState, params, view, samples, resolution, {
    inflectionBranch: 'fast',
    direction: 'backward',
    sonicTarget: 'right',
    rarefactionSpeedMode,
    compositeSpeedMode,
  })
  for (const segment of composite.segments ?? []) {
    const clean = cleanSegment(segment)
    if (clean.length >= 2) segments.push(clean)
  }

  if (validWavePoint(nonLocalAnchor)) {
    for (const segment of buildShockSegments(fixedState, nonLocalAnchor, params, view, samples, {
      expanded: true,
      useAnchorPoint: true,
      nonLocal: true,
      hugoniotDirection: 'backward',
      speedMode: hugoniotSpeedMode,
      sonicTarget: 'right',
    })) {
      const clean = cleanSegment(segment)
      if (clean.length >= 2) segments.push(clean)
    }
  }

  return segments
}

export default function FastWaveCurve({
  fixedState,
  anchorPoint,
  nonLocalAnchor,
  params,
  view,
  resolution = 40,
  visible = true,
  color = waveColors.fastWave ?? '#ffffff',
  lineWidth = 1.35,
  markerScale = [1, 1, 1],
  onInspectPoint,
  reflected = false,
}) {
  const segments = useMemo(() => {
    const baseSegments = buildFastWaveSegments({ fixedState, anchorPoint, nonLocalAnchor, params, view, resolution })
    return reflected ? reflectDaggerSegments(baseSegments) : baseSegments
  }, [fixedState, anchorPoint, nonLocalAnchor, params, view, resolution, reflected])

  if (!visible || !fixedState || !anchorPoint || !segments.length) return null

  return (
    <group>
      {segments.map((points, index) => (
        <React.Fragment key={`fast-wave-${index}`}>
          <Line
            points={points.map((point) => point.coords)}
            color={color}
            lineWidth={lineWidth}
            renderOrder={10}
          />
          <OrientedArcMarkers
            points={points}
            color={color}
            markerScale={markerScale}
            label={reflected ? "\\text{onda rápida refletida } W_f^{\\dagger}" : "\\text{onda de choque rápida } W_f"}
            onHoverEndpoint={onInspectPoint}
          />
        </React.Fragment>
      ))}
    </group>
  )
}
