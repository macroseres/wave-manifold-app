import React, { Fragment, useMemo } from 'react'
import { Line } from '@react-three/drei'
import RarefactionSegmentsWorker from '../../workers/rarefactionSegments.worker?worker'
import { smoothCurveCoords } from './smoothCurve'
import { useWorkerTask } from '../hooks/useWorkerTask'

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
}) {
  const payload = useMemo(() => ({
    fixedState,
    params,
    view,
    resolution,
    constrainZ,
    direction,
  }), [fixedState, params, view, resolution, constrainZ, direction])

  const { data } = useWorkerTask(
    createRarefactionSegmentsWorker,
    payload,
    visible && Boolean(fixedState),
  )
  const smoothedSegments = useMemo(() => (
    (Array.isArray(data) ? data : [])
      .filter((segment) => segment.length >= 2)
      .map((segment) => smoothCurveCoords(segment, {
        minPoints: 72,
        samplesPerEdge: 4,
        maxPoints: Math.max(140, resolution * 5),
      }))
  ), [data, resolution])

  if (!visible || !fixedState || !smoothedSegments.length) return null

  return (
    <Fragment>
      {smoothedSegments.map((points, index) => (
        <Line
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
