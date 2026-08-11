import React, { useMemo } from 'react'
import { Html, Line } from '@react-three/drei'
import MathLabel from '../../../../components/panel/MathLabel.jsx'
import { solutionColors } from '../solutionColors.js'
import HoverableSolutionPoint from './HoverableSolutionPoint.jsx'
import {
  coordsOf,
  normalizedDistanceLocal,
  buildChosenHPlusLeafSegments,
  buildChosenHMinusLeafSegments,
  dashDotDotSegments,
  chosenHPlusContainsSurfacePoint,
  chosenHMinusIsFromRarefaction,
} from '../solutionModeGeometry.js'

import SaturatedArcSurfaces from './saturation/SaturatedArcSurfaces.jsx'
import { CompositeSaturatedSlowSurface } from '../../../../components/surfaces/CompositeSaturatedSurface.jsx'
import { computeFastReflectionSlowSaturationIntersections } from '../../intersections/fastReflectionSlowSaturation.js'
export function SlowAdmissibleSaturations({ entry, params, view, resolution, visibility = {}, pipelineBranch = null }) {
  const branchVisibility = visibility?.slow ?? {}

  const segments = useMemo(() => {
    if (pipelineBranch) {
      return {
        hLocal: pipelineBranch.localShockArc?.segments ?? [],
        hNonlocal: [
          ...((pipelineBranch.firstChainNonlocalShockArc ?? pipelineBranch.nonlocalShockFromLocalCompositeArc)?.segments ?? []),
          ...((pipelineBranch.secondChainNonlocalShockArc ?? pipelineBranch.nonlocalShockFromNonlocalCompositeArc)?.segments ?? []),
          ...(pipelineBranch.nonlocalShockArc?.segments ?? []),
        ],
        rLocal: pipelineBranch.localRarefactionArc?.segments ?? [],
        nonlocalRarefactionReferencePoint: pipelineBranch.nonlocalRarefactionArc?.metadata?.hPlusCsPoint
          ?? pipelineBranch.nonlocalRarefactionArc?.metadata?.nonlocalRarefactionStartPoint
          ?? pipelineBranch.nonlocalRarefactionArc?.anchor
          ?? null,
        k: [
          ...(pipelineBranch.localCompositeArc?.segments ?? []),
          ...(pipelineBranch.nonlocalCompositeArc?.segments ?? []),
        ],
        activeSaturationArc: pipelineBranch.activeSaturationArc ?? null,
      }
    }
    return { hLocal: [], hNonlocal: [], rLocal: [], k: [], activeSaturationArc: null, nonlocalRarefactionReferencePoint: null }
  }, [pipelineBranch])

  if (!entry?.state || !entry?.seed) return null

  const activeSaturationArc = segments.activeSaturationArc ?? null
  const showLocalHugoniotSaturation = activeSaturationArc?.locality !== 'nonlocal' && branchVisibility.satHugoniotLocal !== false
  const showNonlocalHugoniotSaturation = activeSaturationArc?.locality === 'nonlocal' && branchVisibility.satHugoniotNonlocal !== false

  return (
    <group renderOrder={6}>
      <SaturatedArcSurfaces
        segments={segments.hLocal}
        params={params}
        view={view}
        resolution={resolution}
        visible={showLocalHugoniotSaturation}
        color={solutionColors.satSlowHLocal}
      />
      <SaturatedArcSurfaces
        segments={segments.hNonlocal}
        params={params}
        view={view}
        resolution={resolution}
        visible={showNonlocalHugoniotSaturation}
        color={solutionColors.satSlowHNonlocal}
      />
      <SaturatedArcSurfaces
        segments={segments.rLocal}
        params={params}
        view={view}
        resolution={resolution}
        visible={branchVisibility.satRarefactionLocal !== false}
        color={solutionColors.satSlowRLocal}
      />
      <CompositeSaturatedSlowSurface
        fixedState={segments.nonlocalRarefactionReferencePoint}
        params={params}
        view={view}
        resolution={resolution}
        visible={Boolean(segments.nonlocalRarefactionReferencePoint) && branchVisibility.satInvolvedRarefactionCurve === true}
        color={solutionColors.satSlowRNonlocal}
      />
      <SaturatedArcSurfaces
        segments={segments.k}
        params={params}
        view={view}
        resolution={resolution}
        visible={branchVisibility.satComposite !== false}
        color={solutionColors.satSlowK}
      />
    </group>
  )
}

export function FastReflectionSlowSaturationIntersectionPoint({
  slowEntry,
  fastEntry,
  params,
  view,
  resolution,
  markerScale = [1, 1, 1],
  visibility = {},
  onHoverPoint = null,
  onCreateInspectionProbe = null,
  visible = true,
  solutionPipeline = null,
}) {
  const branchVisibility = visibility?.slow ?? {}
  const chosenHPlusVisible = branchVisibility.chosenHPlusIntersection !== false
  const chosenHMinusVisible = branchVisibility.chosenHMinusRarefaction !== false
  const shouldComputeChosen = visible && (chosenHPlusVisible || chosenHMinusVisible)
  const points = useMemo(() => {
    if (!shouldComputeChosen) return []
    return computeFastReflectionSlowSaturationIntersections({
      slowEntry,
      fastEntry,
      params,
      view,
      resolution,
      includeChosenHMinus: chosenHMinusVisible,
      solutionPipeline,
    })
  }, [shouldComputeChosen, slowEntry, fastEntry, params, view, resolution, chosenHMinusVisible, solutionPipeline])

  const visiblePoints = useMemo(() => (shouldComputeChosen ? points : []), [shouldComputeChosen, points])

  const chosenHPlusLeaves = useMemo(() => {
    if (!chosenHPlusVisible) return []
    return visiblePoints
      .filter((point) => chosenHPlusContainsSurfacePoint(point, params, view))
      .map((point) => ({
        key: `${point.fastKind}-${point.slowKind}-${point.t}-${point.z}`,
        segments: buildChosenHPlusLeafSegments(point.chosenRightState, params, view, resolution),
      }))
      .filter((leaf) => leaf.segments.length > 0)
  }, [chosenHPlusVisible, visiblePoints, params, view, resolution])

  const chosenHMinusLeaves = useMemo(() => {
    if (!chosenHMinusVisible) return []
    return visiblePoints
      .filter(chosenHMinusIsFromRarefaction)
      .map((point) => ({
        key: `${point.fastKind}-${point.slowKind}-${point.t}-${point.z}`,
        segments: dashDotDotSegments(
          buildChosenHMinusLeafSegments(point.chosenLeftState, params, view, resolution),
          view,
        ),
      }))
      .filter((leaf) => leaf.segments.length > 0)
  }, [chosenHMinusVisible, visiblePoints, params, view, resolution])

  if (!shouldComputeChosen || !visiblePoints.length) return null

  const color = '#facc15'
  const slowColor = '#38bdf8'
  const chosenHPlusColor = '#fef08a'
  const chosenHMinusColor = '#93c5fd'

  return (
    <group>
      {chosenHPlusVisible && chosenHPlusLeaves.map((leaf) => (
        <React.Fragment key={`chosen-h-plus-${leaf.key}`}>
          {leaf.segments.map((segment, index) => (
            <Line
              key={`chosen-h-plus-${leaf.key}-${index}`}
              points={segment}
              color={chosenHPlusColor}
              lineWidth={1.35}
              renderOrder={19}
              transparent
              opacity={0.88}
              dashed
              dashSize={0.16}
              gapSize={0.08}
            />
          ))}
        </React.Fragment>
      ))}
      {chosenHMinusVisible && chosenHMinusLeaves.map((leaf) => (
        <React.Fragment key={`chosen-h-minus-${leaf.key}`}>
          {leaf.segments.map((segment, index) => (
            <Line
              key={`chosen-h-minus-${leaf.key}-${index}`}
              points={segment}
              color={chosenHMinusColor}
              lineWidth={1.35}
              renderOrder={18}
              transparent
              opacity={0.84}
            />
          ))}
        </React.Fragment>
      ))}
      {visiblePoints.map((point) => {
        const fastCoords = coordsOf(point.fastIntersectionPoint) ?? point.coords
        const showSlowMarker = normalizedDistanceLocal(point.fastIntersectionPoint, point, view) > 0.006
        const hMinusRarefactionCoords = coordsOf(point.chosenLeftGeneratorPoint)
        const showHMinusRarefactionMarker = chosenHMinusVisible && chosenHMinusIsFromRarefaction(point) && hMinusRarefactionCoords
        const hMinusRarefactionLabel = 'H_-^* \\cap \\mathcal R_-'
        return (
          <React.Fragment key={`${point.fastKind}-${point.slowKind}-${point.t}-${point.z}`}>
            {chosenHPlusVisible ? (
              <HoverableSolutionPoint
              point={{ ...point.fastIntersectionPoint, label: point.label, endpointLabel: point.label, fastKind: point.fastKind, slowKind: point.slowKind }}
                position={fastCoords}
                color={color}
                markerScale={markerScale}
              renderOrder={22}
              onHoverPoint={onHoverPoint}
              onCreateInspectionProbe={onCreateInspectionProbe}
              hoverLabel="interseção reflexo rápido e saturada"
            >
              <Html distanceFactor={8} position={[0.08, 0.08, 0.08]}>
                <div className="curve-point-label"><MathLabel tex={point.label} /></div>
              </Html>
              </HoverableSolutionPoint>
            ) : null}
            {chosenHPlusVisible && showSlowMarker ? (
              <HoverableSolutionPoint
                point={point}
                position={point.coords}
                color={slowColor}
                markerScale={markerScale}
                renderOrder={21}
                onHoverPoint={onHoverPoint}
                onCreateInspectionProbe={onCreateInspectionProbe}
                hoverLabel="ponto no arco lento da H_+ escolhida"
              />
            ) : null}
            {showHMinusRarefactionMarker ? (
              <HoverableSolutionPoint
                point={{
                  ...point.chosenLeftGeneratorPoint,
                  label: hMinusRarefactionLabel,
                  endpointLabel: hMinusRarefactionLabel,
                  fastKind: point.fastKind,
                  slowKind: point.slowKind,
                }}
                position={hMinusRarefactionCoords}
                color={chosenHMinusColor}
                markerScale={markerScale}
                renderOrder={22}
                onHoverPoint={onHoverPoint}
                onCreateInspectionProbe={onCreateInspectionProbe}
                hoverLabel="interseção da H_- escolhida com a rarefação lenta"
              >
                <Html distanceFactor={8} position={[0.08, 0.08, 0.08]}>
                  <div className="curve-point-label"><MathLabel tex={hMinusRarefactionLabel} /></div>
                </Html>
              </HoverableSolutionPoint>
            ) : null}
          </React.Fragment>
        )
      })}
    </group>
  )
}

