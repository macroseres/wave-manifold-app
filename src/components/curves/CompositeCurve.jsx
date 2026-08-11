import React, { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { FORWARD_HUGONIOT, BACKWARD_HUGONIOT } from '../../entities/hugoniot/directions'
import { waveColors } from '../../config/waveColors'
import OrientedArcMarkers from './OrientedArcMarkers'
import CompositeSegmentsWorker from '../../workers/compositeSegments.worker?worker'
import { useWorkerTask } from '../hooks/useWorkerTask'
import { RAREFACTION, clampResolutionSamples } from '../../config/numerics'
import { reflectDaggerSegments } from '../../entities/shared/reflection'
import { buildDrawableCompositeSegments } from '../../geometry/compositeCurveGeometry'
import { computeCompositeSlowInflectionPoint } from './compositeInflectionUtils'

import {
  buildStopGeometry,
  filterCompositeBranchesThroughPoint,
  keepDrawableSegment,
  normalizeSegment,
  orientSegmentBySpeed,
  restrictCompositeFromRarefactionAnchor,
  slowCompositeSideReference,
  solutionProbePointFromLineEvent,
  splitSegmentBySpeed,
  trimSegmentCollectionToPoint,
} from '../../entities/composite/admissibleGeometry'

export { buildCompositeAdmissibleSegmentsForSolution } from '../../entities/composite/admissibleGeometry'

const createCompositeSegmentsWorker = () => new CompositeSegmentsWorker()

function CompositeCurveBase({
  fixedState,
  params,
  view,
  resolution = 40,
  visible = true,
  color = waveColors.composite ?? '#9333ea',
  lineWidth = 1.35,
  inflectionBranch = 'slow',
  direction = FORWARD_HUGONIOT,
  sonicTarget = 'left',
  admissibleOrientation = null,
  stopFixedState = null,
  showOrientationMarkers = false,
  showStartMarker = true,
  showEndMarker = true,
  markerBoundaryView = null,
  markerScale = [1, 1, 1],
  reflectDagger = false,
  onCreateInspectionProbe = null,
  branch = null,
  label = null,
  stopPoint = null,
  segmentsOverride = null,
}) {
  const payload = useMemo(() => ({
    fixedState,
    params,
    view,
    samples: clampResolutionSamples(resolution * RAREFACTION.SAMPLES_PER_RESOLUTION, RAREFACTION.MIN_SAMPLES, RAREFACTION.MAX_SAMPLES),
    resolution,
    inflectionBranch,
    direction,
    sonicTarget,
  }), [fixedState, params, view, resolution, inflectionBranch, direction, sonicTarget])

  const hasSegmentsOverride = Array.isArray(segmentsOverride) && segmentsOverride.some((segment) => normalizeSegment(segment).length >= 2)

  const { data } = useWorkerTask(
    createCompositeSegmentsWorker,
    payload,
    visible && Boolean(fixedState) && !hasSegmentsOverride,
  )

  const stopGeometry = useMemo(() => (
    visible && fixedState
      ? buildStopGeometry({ fixedState, stopFixedState, params, view, resolution, direction })
      : { hugoniotPoints: [], doubleSonicLines: [] }
  ), [visible, fixedState, stopFixedState, params, view, resolution, direction])

  const segments = useMemo(() => {
    if (hasSegmentsOverride) {
      const normalized = (segmentsOverride ?? []).map(normalizeSegment).filter((segment) => segment.length >= 2)
      const trimmed = stopPoint
        ? trimSegmentCollectionToPoint(normalized, stopPoint, view, { preserveTarget: true })
        : normalized
      const drawable = trimmed.filter((segment) => keepDrawableSegment(segment, view))
      return reflectDagger ? reflectDaggerSegments(drawable) : drawable
    }

    const rawSegments = (data?.segments ?? []).map(normalizeSegment).filter((segment) => segment.length >= 2)
    const branchPoint = inflectionBranch === 'slow'
      ? computeCompositeSlowInflectionPoint(fixedState, params, view, resolution)
      : null
    const branchSegments = filterCompositeBranchesThroughPoint(
      rawSegments,
      branchPoint,
      view,
      { tolerance: Math.max(0.025, 0.10 / Math.max(1, resolution)) },
    )
    const sideReference = slowCompositeSideReference({
      fixedState,
      params,
      view,
      resolution,
      inflectionBranch,
      admissibleOrientation,
    })

    // No modo SOLUÇÃO, a composta admissível não deve ser um recorte global.
    // Ela nasce na interseção da rarefação com a sônica R_±∩S^± e segue no
    // lado de velocidade admissível até encontrar a Hugoniot do estado clicado
    // ou a dupla sônica DS, o que ocorrer primeiro.
    const anchored = restrictCompositeFromRarefactionAnchor(
      branchSegments,
      data?.sonicAnchorPoints ?? (data?.sonicAnchorPoint ? [data.sonicAnchorPoint] : []),
      params,
      view,
      admissibleOrientation,
      stopGeometry,
      sideReference,
    )

    const source = anchored ?? branchSegments
    const oriented = source
      .flatMap((segment) => anchored ? [segment] : splitSegmentBySpeed(segment, params, admissibleOrientation))
      // Segmentos ancorados ja sao construidos com a semente R_pm cap S_pm como
      // primeiro ponto e com o lado escolhido pelo sinal da velocidade.
      // Nao devemos reorienta-los por comparacao entre extremos, porque o
      // snap final em H_pm/DS pode inverter visualmente o arco, especialmente
      // em A(K_+), que deve sair da rarefacao com velocidade aumentando.
      .map((segment) => anchored ? segment : orientSegmentBySpeed(segment, params, admissibleOrientation))
    const drawableSegments = trimSegmentCollectionToPoint(
      buildDrawableCompositeSegments(oriented),
      stopPoint,
      view,
      { preserveTarget: true },
    )
      .filter((segment) => keepDrawableSegment(segment, view))
    return reflectDagger ? reflectDaggerSegments(drawableSegments) : drawableSegments
  }, [data, fixedState, params, view, resolution, inflectionBranch, admissibleOrientation, stopGeometry, reflectDagger, stopPoint, segmentsOverride, hasSegmentsOverride])

  if (!visible || !fixedState || segments.length === 0) return null

  const compositeLabel = label ?? `A(K_${inflectionBranch === 'slow' ? '-' : '+'})`
  const handleLineClick = onCreateInspectionProbe ? ((event) => {
    event.stopPropagation()
    event.nativeEvent?.stopImmediatePropagation?.()
    onCreateInspectionProbe(solutionProbePointFromLineEvent(event, branch, compositeLabel))
  }) : undefined

  return (
    <group>
      {segments.map((points, index) => (
        <React.Fragment key={`composite-${inflectionBranch}-${index}`}>
          <Line
            points={points}
            color={color}
            lineWidth={lineWidth}
            renderOrder={showOrientationMarkers ? 16 : 8}
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
              label={compositeLabel}
              markerBoundaryView={markerBoundaryView}
              markerScale={markerScale}
              showStartMarker={showStartMarker}
              showEndMarker={showEndMarker}
            />
          )}
        </React.Fragment>
      ))}
    </group>
  )
}

function CompositeSlowCurveImpl(props) {
  return (
    <CompositeCurveBase
      {...props}
      inflectionBranch="slow"
      direction={FORWARD_HUGONIOT}
      sonicTarget="left"
      color={props.color ?? waveColors.compositeSlow ?? waveColors.composite ?? '#2563eb'}
    />
  )
}

function CompositeFastCurveImpl(props) {
  return (
    <CompositeCurveBase
      {...props}
      inflectionBranch="fast"
      direction={BACKWARD_HUGONIOT}
      sonicTarget="right"
      color={props.color ?? waveColors.compositeFast ?? waveColors.composite ?? '#a855f7'}
    />
  )
}

export const CompositeSlowCurve = React.memo(CompositeSlowCurveImpl)
export const CompositeFastCurve = React.memo(CompositeFastCurveImpl)

// Funções mantidas apenas como aliases de compatibilidade para chamadas antigas.
// A visualização atual usa CompositeSlowCurve e CompositeFastCurve.
export function CompositeSlowArcCurve(props) { return <CompositeSlowCurve {...props} /> }
export function CompositeFastArcCurve(props) { return <CompositeFastCurve {...props} /> }

export default React.memo(CompositeCurveBase)


