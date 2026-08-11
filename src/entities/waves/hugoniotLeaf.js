import { BACKWARD_HUGONIOT, normalizeHugoniotDirection } from '../hugoniot/directions.js'
import { waveSpeed } from '../surfaceImplicit/index.js'
import { evaluateHugoniotLeafPoint } from './hugoniotBifoliation.js'
import { makeWaveCurve, makeWaveLeaf } from '../shared/types/mathTypes.js'
import { sampleParametricCurveAdaptive } from '../continuation/adaptiveParametricSampler.js'
import { annotateSpeedsAndAdmissibility, orientSegmentsBySpeed, orientationFromDirection, splitSegmentsAtLargeJumps } from './orientation.js'
import { HUGONIOT } from '../../config/numerics.js'

function directionName(direction) {
  return normalizeHugoniotDirection(direction) === BACKWARD_HUGONIOT ? 'plus' : 'minus'
}

export function buildHugoniotLeaf({ fixedState, params, view, samples = 500, direction, zExtensionMargin = 0 }) {
  const waveDirection = directionName(direction)
  const orientation = orientationFromDirection({ family: 'hugoniot', direction: waveDirection })
  const name = waveDirection === 'plus' ? 'H_+' : 'H_-'

  if (!fixedState) {
    const curve = makeWaveCurve({ name, family: 'hugoniot', direction: waveDirection, orientation })
    return makeWaveLeaf({ name, family: 'hugoniot', direction: waveDirection, orientation, curve })
  }

  // A janela recebida já é o domínio padronizado de desenho/cálculo.
  // No App.jsx ela é calcView = view com margem de 20% em z.
  const zSpan = Math.max(1, view.zMax - view.zMin)
  const zMin = view.zMin - zExtensionMargin * zSpan
  const zMax = view.zMax + zExtensionMargin * zSpan
  const targetSamples = Math.max(64, samples)
  const speedFn = (point) => waveSpeed(point.t, point.z, params)

  const rawPoints = sampleParametricCurveAdaptive({
    zMin,
    zMax,
    initialSamples: Math.min(260, Math.max(64, Math.floor(targetSamples / (HUGONIOT.ADAPTIVE_INITIAL_DIVISOR ?? 3.2)))),
    maxDepth: HUGONIOT.ADAPTIVE_MAX_DEPTH ?? 10,
    tolerance: HUGONIOT.ADAPTIVE_TOLERANCE ?? 0.0045,
    speedTolerance: HUGONIOT.ADAPTIVE_SPEED_TOLERANCE ?? 0.006,
    maxPoints: Math.max(
      HUGONIOT.ADAPTIVE_MAX_POINTS_MIN ?? 1800,
      Math.min(HUGONIOT.ADAPTIVE_MAX_POINTS_MAX ?? 7200, (HUGONIOT.ADAPTIVE_MAX_POINTS_FACTOR ?? 7) * targetSamples),
    ),
    scales: {
      t: Math.max(1, view.tMax - view.tMin),
      Y: Math.max(1, view.yMax - view.yMin),
      z: Math.max(1, zMax - zMin),
    },
    speedFn,
    evaluate: (z) => evaluateHugoniotLeafPoint({ z, fixedState, params, direction }),
  })

  const validRawPoints = rawPoints.filter(Boolean)
  const markerStep = Math.max(6, Math.floor(validRawPoints.length / 90))
  const markers = validRawPoints.filter((_, i) => i % markerStep === 0)
  const dz = (zMax - zMin) / Math.max(targetSamples - 1, 1)

  const jumpTMax = 0.35 * Math.max(1, view.tMax - view.tMin)
  const jumpYMax = 0.35 * Math.max(1, view.yMax - view.yMin)
  const segments = splitSegmentsAtLargeJumps(rawPoints, {
    maxJumpT: jumpTMax,
    maxJumpY: jumpYMax,
    maxJumpZ: 4 * Math.abs(dz),
  })

  const orientedSegments = orientSegmentsBySpeed(segments, speedFn, orientation)
  const { speeds, admissible } = annotateSpeedsAndAdmissibility(
    orientedSegments,
    speedFn,
    orientation,
  )

  const curve = makeWaveCurve({
    name,
    family: 'hugoniot',
    direction: waveDirection,
    segments: orientedSegments,
    speeds,
    admissible,
    orientation,
    metadata: {
      markers,
      fixedState,
      originalDirection: direction,
      sampler: 'adaptive-parametric-z',
      sampledPointCount: validRawPoints.length,
    },
  })

  return makeWaveLeaf({
    name,
    family: 'hugoniot',
    direction: waveDirection,
    orientation,
    basePoint: fixedState,
    curve,
    metadata: {
      fixedState,
      markers,
      sampler: 'adaptive-parametric-z',
      sampledPointCount: validRawPoints.length,
    },
  })
}
