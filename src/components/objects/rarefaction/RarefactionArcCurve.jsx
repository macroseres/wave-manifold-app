import React, { useMemo } from 'react'
import * as THREE from 'three'
import { ZCompactifiedLine as Line } from '../../../app/scene/ZCompactification'
import OrientedArcMarkers from '../shared/OrientedArcMarkers'
import { waveColors } from '../../../config/waveColors'
import { buildRarefactionArcSegments, trimRarefactionArcSegmentsToEndpoint } from './rarefactionArcUtils'
import { reflectDaggerSegments } from '../../../entities/shared/reflection'
import { visualZToPhysical } from '../../../geometry/zCompactification'

function coordsOf(point) {
  if (Array.isArray(point)) return point
  if (Array.isArray(point?.coords)) return point.coords
  if ([point?.t, point?.Y, point?.z].every(Number.isFinite)) return [point.t, point.Y, point.z]
  return null
}

function branchFromT(t, fallbackBranch = null) {
  if (t < -1e-9) return 'fast'
  if (t > 1e-9) return 'slow'
  return fallbackBranch ?? 'slow'
}

function solutionProbePointFromLineEvent(event, fallbackBranch, attachedCurve) {
  const local = event.object.worldToLocal(event.point.clone())
  const t = local.x
  const Y = local.y
  const z = visualZToPhysical(local.z)
  return { t, Y, z, coords: [t, Y, z], branch: branchFromT(t, fallbackBranch), attachedCurve }
}

function pointOnCharacteristicSide(point, branchSide) {
  if (branchSide !== 'slow' && branchSide !== 'fast') return true
  const coords = coordsOf(point)
  if (!coords) return false
  return branchSide === 'fast' ? coords[0] <= 1e-8 : coords[0] >= -1e-8
}

function interpolateAtTZero(a, b) {
  const ca = coordsOf(a)
  const cb = coordsOf(b)
  if (!ca || !cb || Math.abs(ca[0] - cb[0]) <= 1e-12) return null
  const alpha = ca[0] / (ca[0] - cb[0])
  if (alpha < 0 || alpha > 1) return null
  const Y = ca[1] + alpha * (cb[1] - ca[1])
  const z = ca[2] + alpha * (cb[2] - ca[2])
  return { t: 0, Y, z, coords: [0, Y, z] }
}

function clipSegmentToCharacteristicSide(segment, branchSide) {
  if (!Array.isArray(segment) || segment.length < 2) return []
  const out = []
  for (let i = 0; i < segment.length; i += 1) {
    const point = segment[i]
    if (pointOnCharacteristicSide(point, branchSide)) {
      out.push(point)
      continue
    }
    const previous = out[out.length - 1]
    const boundary = previous ? interpolateAtTZero(previous, point) : null
    if (boundary) out.push(boundary)
    break
  }
  return out.length >= 2 ? out : []
}

function normalizedDistance3(a, b, view) {
  const ca = coordsOf(a)
  const cb = coordsOf(b)
  if (!ca || !cb) return Number.POSITIVE_INFINITY
  const tauScale = Math.max(1e-6, Math.abs((view?.tMax ?? 1) - (view?.tMin ?? 0)))
  const yScale = Math.max(1e-6, Math.abs((view?.yMax ?? 1) - (view?.yMin ?? 0)))
  const zScale = Math.max(1e-6, Math.abs((view?.zMax ?? 1) - (view?.zMin ?? 0)))
  return Math.hypot((ca[0] - cb[0]) / tauScale, (ca[1] - cb[1]) / yScale, (ca[2] - cb[2]) / zScale)
}

function scaledSegmentLength(segment, view) {
  if (!Array.isArray(segment) || segment.length < 2) return 0
  let total = 0
  for (let i = 1; i < segment.length; i += 1) total += normalizedDistance3(segment[i - 1], segment[i], view)
  return total
}

export default function RarefactionArcCurve({
  anchorPoint,
  params,
  view,
  resolution = 40,
  visible = true,
  color = waveColors.rarefactionArc,
  lineWidth = 1.35,
  markerScale = [1, 1, 1],
  endpointPoint = null,
  onInspectPoint,
  speedMode = 'increasing',
  label = 'arco rarefação lenta',
  stopAtCoincidence = false,
  reflectDagger = false,
  branchSide = null,
  keepSingleBranch = false,
  onCreateInspectionProbe = null,
  segmentsOverride = null,
  fallbackToGeneratedCurve = true,
}) {
  const endpoint = useMemo(() => {
    const point = endpointPoint
    if (!point) return null
    if (![point.t, point.Y, point.z].every(Number.isFinite)) return null
    return { ...point, coords: point.coords ?? [point.t, point.Y, point.z] }
  }, [endpointPoint])

  const segments = useMemo(() => {
    const overrideSegments = Array.isArray(segmentsOverride)
      ? segmentsOverride
          .map((segment) => (segment ?? []).map((point) => {
            const coords = coordsOf(point)
            return coords ? { t: coords[0], Y: coords[1], z: coords[2], coords } : null
          }).filter(Boolean))
          .filter((segment) => segment.length >= 2)
      : null
    const hasUsableOverride = Array.isArray(overrideSegments) && overrideSegments.length > 0
    if (hasUsableOverride) return reflectDagger ? reflectDaggerSegments(overrideSegments) : overrideSegments
    if (Array.isArray(segmentsOverride) && !fallbackToGeneratedCurve) return []

    const samples = Math.max(520, Math.min(900, resolution * 12))
    const rawSegments = buildRarefactionArcSegments(anchorPoint, params, view, samples, speedMode, { stopAtCoincidence })
    const unreflected = stopAtCoincidence && rawSegments.some((segment) => segment.some((point) => point?.isCoincidenceIntersection))
      ? rawSegments
      : trimRarefactionArcSegmentsToEndpoint(rawSegments, endpoint)
    const clipped = unreflected
      .map((segment) => clipSegmentToCharacteristicSide(segment, branchSide))
      .filter((segment) => segment.length >= 2)
    const selected = keepSingleBranch && !endpoint
      ? [...clipped].sort((a, b) => scaledSegmentLength(b, view) - scaledSegmentLength(a, view)).slice(0, 1)
      : clipped
    return reflectDagger ? reflectDaggerSegments(selected) : selected
  }, [anchorPoint, params, view, resolution, endpoint, speedMode, stopAtCoincidence, reflectDagger, branchSide, keepSingleBranch, segmentsOverride, fallbackToGeneratedCurve])

  if (!visible || !anchorPoint || segments.length === 0) return null

  const handleLineClick = onCreateInspectionProbe ? ((event) => {
    event.stopPropagation()
    event.nativeEvent?.stopImmediatePropagation?.()
    onCreateInspectionProbe(solutionProbePointFromLineEvent(event, branchSide, label))
  }) : undefined

  return (
    <group>
      {segments.map((points, idx) => (
        <React.Fragment key={`rarefaction-arc-oriented-${idx}`}>
          <Line
            points={points.map((point) => point.coords)}
            color={color}
            lineWidth={lineWidth}
            renderOrder={9}
            onClick={handleLineClick}
          />
          <OrientedArcMarkers
            points={points}
            color={color}
            markerScale={markerScale}
            label={label}
            onHoverEndpoint={onInspectPoint}
          />
        </React.Fragment>
      ))}

    </group>
  )
}
