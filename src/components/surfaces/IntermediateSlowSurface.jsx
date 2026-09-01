import React, { useMemo } from 'react'
import * as THREE from 'three'
import { buildShockSegments } from '../curves/ShockCurve'
import { buildRarefactionArcSegments, trimRarefactionArcSegmentsToEndpoint } from '../curves/rarefactionArcUtils'
import { buildCompositeArcRestrictedSegments, solutionSpeedMode } from '../../entities/waves'
import {
  computeRightStateFromWavePoint,
  solveBackwardHugoniotPointForFixedRightState,
  waveColors,
} from '../../entities/surfaceImplicit'
import { HUGONIOT } from '../../config/numerics'
import { ZCompactifiedMesh } from '../../app/scene/ZCompactification'

function finite(value) {
  return Number.isFinite(value)
}

function validPoint(point) {
  return point && [point.t, point.Y, point.z].every(finite)
}

function withCoords(point) {
  return validPoint(point) ? { ...point, coords: [point.t, point.Y, point.z] } : null
}

function pointDistance(a, b) {
  return Math.hypot((b.t ?? 0) - (a.t ?? 0), (b.Y ?? 0) - (a.Y ?? 0), (b.z ?? 0) - (a.z ?? 0))
}

function sampleSegment(points, maxPoints = HUGONIOT.SATURATED_BASE_POINTS ?? 300) {
  if (!Array.isArray(points) || points.length < 2) return []
  const clean = points.filter(validPoint)
  if (clean.length < 2) return []
  if (clean.length <= maxPoints) return clean

  const s = [0]
  for (let i = 1; i < clean.length; i += 1) {
    s.push(s[i - 1] + Math.max(1e-12, pointDistance(clean[i - 1], clean[i])))
  }
  const total = s[s.length - 1]
  if (!finite(total) || total <= 1e-12) return clean
  const out = []
  let lo = 0
  for (let i = 0; i < maxPoints; i += 1) {
    const target = (i / Math.max(1, maxPoints - 1)) * total
    while (lo < s.length - 2 && s[lo + 1] < target) lo += 1
    const hi = Math.min(s.length - 1, lo + 1)
    const alpha = (target - s[lo]) / Math.max(1e-12, s[hi] - s[lo])
    const a = clean[lo]
    const b = clean[hi]
    out.push({
      t: a.t + alpha * (b.t - a.t),
      Y: a.Y + alpha * (b.Y - a.Y),
      z: a.z + alpha * (b.z - a.z),
      coords: [
        a.t + alpha * (b.t - a.t),
        a.Y + alpha * (b.Y - a.Y),
        a.z + alpha * (b.z - a.z),
      ],
    })
  }
  return out
}

export function collectSlowWaveSegments({ fixedState, anchorPoint, nonLocalAnchor, params, view, resolution }) {
  const rarefactionSpeedMode = solutionSpeedMode('slow', 'rarefaction')
  const samples = Math.max(520, Math.min(850, resolution * 12))
  const segments = []

  for (const segment of buildShockSegments(fixedState, anchorPoint, params, view, samples, {})) {
    if (segment.length >= 2) segments.push(segment.map(withCoords).filter(Boolean))
  }

  const composite = buildCompositeArcRestrictedSegments(fixedState, params, view, samples, resolution)
  const compositeStart = composite.segments?.[0]?.[0] ?? null
  const rarefactionSegments = trimRarefactionArcSegmentsToEndpoint(
    buildRarefactionArcSegments(anchorPoint, params, view, samples, rarefactionSpeedMode, { stopAtCoincidence: true }),
    compositeStart,
  )

  for (const segment of rarefactionSegments) {
    if (segment.length >= 2) segments.push(segment.map(withCoords).filter(Boolean))
  }

  for (const segment of composite.segments ?? []) {
    if (segment.length >= 2) segments.push(segment.map(withCoords).filter(Boolean))
  }

  if (validPoint(nonLocalAnchor)) {
    for (const segment of buildShockSegments(fixedState, nonLocalAnchor, params, view, samples, {
      expanded: true,
      useAnchorPoint: true,
      nonLocal: true,
    })) {
      if (segment.length >= 2) segments.push(segment.map(withCoords).filter(Boolean))
    }
  }

  return segments.filter((segment) => segment.length >= 2)
}

export function buildSaturatedStrip(basePoints, params, view, zSamples = 34) {
  const base = sampleSegment(basePoints, HUGONIOT.SATURATED_BASE_POINTS ?? 300)
  if (base.length < 2) return null

  const zSpan = Math.max(1, view.zMax - view.zMin)
  const zMin = view.zMin - 0.35 * zSpan
  const zMax = view.zMax + 0.35 * zSpan
  const zValues = Array.from({ length: zSamples }, (_, j) => zMin + (j * (zMax - zMin)) / Math.max(1, zSamples - 1))

  const positions = []
  const valid = []

  for (const point of base) {
    const rightState = computeRightStateFromWavePoint(point.t, point.Y, point.z, params)
    const rowValid = []
    for (const z of zValues) {
      const p = rightState ? solveBackwardHugoniotPointForFixedRightState(z, rightState, params) : null
      if (validPoint(p)) {
        positions.push(p.t, p.Y, p.z)
        rowValid.push(true)
      } else {
        positions.push(0, 0, 0)
        rowValid.push(false)
      }
    }
    valid.push(rowValid)
  }

  const cols = zSamples
  const indices = []
  for (let i = 0; i < base.length - 1; i += 1) {
    for (let j = 0; j < cols - 1; j += 1) {
      if (!(valid[i][j] && valid[i + 1][j] && valid[i][j + 1] && valid[i + 1][j + 1])) continue
      const a = i * cols + j
      const b = (i + 1) * cols + j
      const c = i * cols + j + 1
      const d = (i + 1) * cols + j + 1
      indices.push(a, b, c, c, b, d)
    }
  }

  if (!indices.length) return null

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export default function IntermediateSlowSurface({
  fixedState,
  anchorPoint,
  nonLocalAnchor,
  params,
  view,
  resolution = 40,
  visible = true,
  opacity = 0.75,
  color = waveColors.intermediateSlow ?? '#38bdf8',
}) {
  const geometries = useMemo(() => {
    if (!fixedState || !validPoint(anchorPoint)) return []
    const segments = collectSlowWaveSegments({ fixedState, anchorPoint, nonLocalAnchor, params, view, resolution })
    return segments
      .map((segment) => buildSaturatedStrip(segment, params, view, Math.max(48, Math.min(88, Math.round(resolution * 1.1)))))
      .filter(Boolean)
  }, [fixedState, anchorPoint, nonLocalAnchor, params, view, resolution])

  if (!visible || !geometries.length) return null

  return (
    <group>
      {geometries.map((geometry, index) => (
        <ZCompactifiedMesh key={`intermediate-slow-surface-${index}`} geometry={geometry} renderOrder={4}>
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
            roughness={0.55}
            metalness={0.05}
          />
        </ZCompactifiedMesh>
      ))}
    </group>
  )
}

export function sampleIntermediateSlowSurfacePoints({
  fixedState,
  anchorPoint,
  nonLocalAnchor,
  params,
  view,
  resolution = 40,
}) {
  if (!fixedState || !validPoint(anchorPoint)) return []

  const segments = collectSlowWaveSegments({ fixedState, anchorPoint, nonLocalAnchor, params, view, resolution })
  const zSamples = Math.max(46, Math.min(76, Math.round(resolution * 1.05)))
  const zSpan = Math.max(1, view.zMax - view.zMin)
  const zMin = view.zMin - 0.35 * zSpan
  const zMax = view.zMax + 0.35 * zSpan
  const zValues = Array.from({ length: zSamples }, (_, j) => zMin + (j * (zMax - zMin)) / Math.max(1, zSamples - 1))
  const points = []

  for (const segment of segments) {
    const base = sampleSegment(segment, 150)
    for (const point of base) {
      const rightState = computeRightStateFromWavePoint(point.t, point.Y, point.z, params)
      if (!rightState) continue
      for (const z of zValues) {
        const p = solveBackwardHugoniotPointForFixedRightState(z, rightState, params)
        if (validPoint(p)) points.push(withCoords(p))
      }
    }
  }

  return points
}
