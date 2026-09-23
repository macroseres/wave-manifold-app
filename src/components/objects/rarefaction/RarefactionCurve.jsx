import React, { Fragment, useMemo } from 'react'
import { Line as VisualLine } from '@react-three/drei'
import { ZCompactifiedLine as Line } from '../../../app/scene/ZCompactification'
import { physicalPointToVisual } from '../../../geometry/zCompactification'
import RarefactionSegmentsWorker from '../../../workers/rarefactionSegments.worker?worker'
import { smoothCurveCoords } from '../shared/smoothCurve'
import { useWorkerTask } from '../../../hooks/useWorkerTask'

const createRarefactionSegmentsWorker = () => new RarefactionSegmentsWorker()

function RarefactionCurve({
  fixedState,
  params,
  view,
  resolution = 40,
  visible = true,
  color = '#dc2626',
  lineWidth = 1.35,
  constrainZ = false,
  direction = undefined,
  compactifiedZ = false,
}) {
  const payload = useMemo(() => ({
    fixedState,
    params,
    view,
    resolution,
    constrainZ,
    direction,
    compactifiedZ,
  }), [fixedState, params, view, resolution, constrainZ, direction, compactifiedZ])

  const { data } = useWorkerTask(
    createRarefactionSegmentsWorker,
    payload,
    visible && Boolean(fixedState),
  )
  const smoothedSegments = useMemo(() => (
    (Array.isArray(data) ? data : [])
      .filter((segment) => segment.length >= 2)
      .map((segment) => smoothCurveCoords(
        compactifiedZ ? segment.map(physicalPointToVisual) : segment,
        {
        minPoints: compactifiedZ ? 720 : 72,
        samplesPerEdge: compactifiedZ ? 3 : 4,
        maxPoints: compactifiedZ ? Math.max(1800, resolution * 36) : Math.max(140, resolution * 5),
        maxRawPoints: compactifiedZ ? 9000 : 900,
      }))
  ), [data, resolution, compactifiedZ])

  if (!visible || !fixedState || !smoothedSegments.length) return null
  const RenderLine = compactifiedZ ? VisualLine : Line

  return (
    <Fragment>
      {smoothedSegments.map((points, index) => (
        <RenderLine
          key={`rarefaction-${index}`}
          points={points}
          color={color}
          lineWidth={lineWidth}
          renderOrder={6}
        />
      ))}
    </Fragment>
  )
}

export default React.memo(RarefactionCurve)
