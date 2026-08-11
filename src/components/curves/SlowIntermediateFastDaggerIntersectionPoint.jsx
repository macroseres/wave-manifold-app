import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import MathLabel from '../panel/MathLabel'
import { buildFastWaveSegments } from './FastWaveCurve'
import { sampleIntermediateSlowSurfacePoints } from '../surfaces/IntermediateSlowSurface'
import { reflectDaggerSegments } from '../../entities/shared/reflection'
import { computeRightStateFromWavePoint } from '../../entities/surfaceImplicit'
import { waveColors } from '../../config/waveColors'
import { coarsenPoints, normalizedPointDistance2, validWavePoint } from '../../geometry/pointUtils'

export function computeSlowIntermediateFastDaggerIntersection({
  slowEntry,
  fastEntry,
  slowNonLocalAnchor,
  fastNonLocalAnchor,
  params,
  view,
  resolution = 40,
}) {
  if (!slowEntry?.state || !slowEntry?.point || !fastEntry?.state || !fastEntry?.point) return null

  const surfacePoints = sampleIntermediateSlowSurfacePoints({
    fixedState: slowEntry.state,
    anchorPoint: slowEntry.point,
    nonLocalAnchor: slowNonLocalAnchor,
    params,
    view,
    resolution,
  })
  if (!surfacePoints.length) return null

  const fastBaseSegments = buildFastWaveSegments({
    fixedState: fastEntry.state,
    anchorPoint: fastEntry.point,
    nonLocalAnchor: fastNonLocalAnchor,
    params,
    view,
    resolution,
  })
  const fastDaggerPoints = reflectDaggerSegments(fastBaseSegments).flat().filter(validWavePoint)
  if (!fastDaggerPoints.length) return null

  const sampledSurface = coarsenPoints(surfacePoints, 5200)
  const sampledFast = coarsenPoints(fastDaggerPoints, 900)

  let best = null
  for (const p of sampledFast) {
    for (const q of sampledSurface) {
      const d2 = normalizedPointDistance2(p, q, view)
      if (!best || d2 < best.d2) best = { p, q, d2 }
    }
  }

  if (!best) return null

  const normalizedDistance = Math.sqrt(best.d2)
  const tolerance = 0.05
  const point = {
    t: 0.5 * (best.p.t + best.q.t),
    Y: 0.5 * (best.p.Y + best.q.Y),
    z: 0.5 * (best.p.z + best.q.z),
    normalizedDistance,
    label: '\\mathcal{W}_s \\cap W_f^{\\dagger}',
    endpointLabel: '\\mathcal{W}_s \\cap W_f^{\\dagger}',
  }
  const rightState = computeRightStateFromWavePoint(point.t, point.Y, point.z, params)
  if (rightState) {
    point.uPlus = rightState.uPlus
    point.vPlus = rightState.vPlus
  }

  return {
    ...point,
    coords: [point.t, point.Y, point.z],
    accepted: normalizedDistance <= tolerance,
  }
}

export default function SlowIntermediateFastDaggerIntersectionPoint({
  slowEntry,
  fastEntry,
  slowNonLocalAnchor,
  fastNonLocalAnchor,
  params,
  view,
  resolution = 40,
  visible = true,
  markerScale = [1, 1, 1],
  onInspectPoint,
}) {
  const point = useMemo(() => computeSlowIntermediateFastDaggerIntersection({
    slowEntry,
    fastEntry,
    slowNonLocalAnchor,
    fastNonLocalAnchor,
    params,
    view,
    resolution,
  }), [slowEntry, fastEntry, slowNonLocalAnchor, fastNonLocalAnchor, params, view, resolution])

  if (!visible || !point?.accepted) return null

  const color = waveColors.fastWaveDaggerIntersection ?? '#facc15'
  return (
    <group position={point.coords}>
      <mesh
        scale={markerScale}
        onPointerOver={(event) => {
          event.stopPropagation()
          onInspectPoint?.({ ...point, endpointLabel: point.endpointLabel ?? point.label, kind: 'interseção' })
        }}
        onPointerDown={(event) => {
          event.stopPropagation()
          onInspectPoint?.({ ...point, endpointLabel: point.endpointLabel ?? point.label, kind: 'interseção' })
        }}
        onContextMenu={(event) => {
          event.stopPropagation()
          onInspectPoint?.({ ...point, endpointLabel: point.endpointLabel ?? point.label, kind: 'interseção' })
        }}
      >
        <sphereGeometry args={[0.034, 24, 24]} />
        <meshStandardMaterial color={color} emissive={new THREE.Color(color)} emissiveIntensity={0.35} />
      </mesh>
      <Html distanceFactor={8} position={[0.08, 0.08, 0.08]}>
        <div className="curve-point-label"><MathLabel tex={"\\mathcal{W}_s \\cap W_f^{\\dagger}"} /></div>
      </Html>
    </group>
  )
}
