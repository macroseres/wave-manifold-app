import React, { Fragment, useMemo } from 'react'
import { Line } from '@react-three/drei'
import OrientedArcMarkers from './OrientedArcMarkers'
import { FORWARD_HUGONIOT } from '../../entities/hugoniot/directions'
import { reflectDaggerSegments } from '../../entities/shared/reflection'
import {
  buildAdmissibleArcSegmentsForSolution,
  coordsOf,
  solutionProbePointFromLineEvent,
} from '../../entities/solution/admissibleArc/segments'

export default function AdmissibleArcCurve({
  family,
  fixedState,
  params,
  view,
  resolution = 40,
  direction = FORWARD_HUGONIOT,
  color = '#f8fafc',
  lineWidth = 1.35,
  visible = true,
  constrainZ = false,
  anchorPoint = null,
  showOrientationMarkers = true,
  showStartMarker = true,
  showEndMarker = true,
  markerBoundaryView = null,
  markerScale = [1, 1, 1],
  admissibleOrientation = null,
  reflectDagger = false,
  clipToTauZView = false,
  segmentsOverride = null,
  onCreateInspectionProbe = null,
  branch = null,
  arcLabel = null,
}) {
  const segments = useMemo(() => {
    if (!visible || !fixedState) return []
    const overrideSegments = Array.isArray(segmentsOverride)
      ? segmentsOverride
          .map((segment) => (segment ?? []).map(coordsOf).filter(Boolean))
          .filter((segment) => segment.length >= 2)
      : null
    const drawable = overrideSegments ?? buildAdmissibleArcSegmentsForSolution({
      family,
      fixedState,
      params,
      view,
      resolution,
      direction,
      constrainZ,
      anchorPoint,
      admissibleOrientation,
      clipToTauZView,
      markerBoundaryView,
    })
    return reflectDagger ? reflectDaggerSegments(drawable) : drawable
  }, [family, fixedState, params, view, resolution, direction, visible, constrainZ, anchorPoint, admissibleOrientation, reflectDagger, clipToTauZView, markerBoundaryView, segmentsOverride])

  if (!visible || !fixedState || segments.length === 0) return null

  const handleLineClick = onCreateInspectionProbe ? ((event) => {
    event.stopPropagation()
    event.nativeEvent?.stopImmediatePropagation?.()
    onCreateInspectionProbe(solutionProbePointFromLineEvent(
      event,
      branch,
      arcLabel ?? `A(${family})`,
    ))
  }) : undefined

  return (
    <Fragment>
      {segments.map((points, index) => (
        <Fragment key={`admissible-${family}-${index}`}>
          <Line
            points={points}
            color={color}
            lineWidth={lineWidth}
            renderOrder={16}
            onClick={handleLineClick}
          />
          {showOrientationMarkers && (
            <OrientedArcMarkers
              points={points}
              color={color}
              radius={0.034}
              startRadius={0.034}
              endRadius={0.034}
              renderOrder={17}
              label={`A(${family})`}
              markerBoundaryView={markerBoundaryView}
              markerScale={markerScale}
              showStartMarker={showStartMarker}
              showEndMarker={showEndMarker}
            />
          )}
        </Fragment>
      ))}
    </Fragment>
  )
}
