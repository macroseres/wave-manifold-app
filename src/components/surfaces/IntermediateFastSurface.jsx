import React, { useMemo } from 'react'
import * as THREE from 'three'
import { buildShockSegments } from '../curves/ShockCurve'
import { buildRarefactionArcSegments } from '../curves/rarefactionArcUtils'
import { buildCompositeArcRestrictedSegments } from '../curves/CompositeCurve'
import { solutionSpeedMode } from '../../entities/waves'
import {
  computeLeftStateFromWavePoint,
  solveHugoniotPointForFixedState,
  waveColors,
} from '../../entities/surfaceImplicit'

function finite(value) {
  return Number.isFinite(value)
}

function validPoint(point) {
  return point && [point.t, point.Y, point.z].every(finite)
}

function withCoords(point) {
  return validPoint(point) ? { ...point, coords: point.coords ?? [point.t, point.Y, point.z] } : null
}

function sampleSegment(points, maxPoints = 180) {
  if (!Array.isArray(points) || points.length < 2) return []
  if (points.length <= maxPoints) return points.map(withCoords).filter(Boolean)
  const out = []
  const last = points.length - 1
  for (let i = 0; i < maxPoints; i += 1) {
    const point = withCoords(points[Math.round((i * last) / Math.max(1, maxPoints - 1))])
    if (point) out.push(point)
  }
  return out
}

export function collectFastWaveSegments({ fixedState, anchorPoint, nonLocalAnchor, params, view, resolution }) {
  const hugoniotSpeedMode = solutionSpeedMode('fast', 'hugoniot')
  const rarefactionSpeedMode = solutionSpeedMode('fast', 'rarefaction')
  const compositeSpeedMode = solutionSpeedMode('fast', 'composite')
  const samples = Math.max(520, Math.min(850, resolution * 12))
  const segments = []

  for (const segment of buildShockSegments(fixedState, anchorPoint, params, view, samples, {
    hugoniotDirection: 'backward',
    speedMode: hugoniotSpeedMode,
    sonicTarget: 'right',
  })) {
    const clean = segment.map(withCoords).filter(Boolean)
    if (clean.length >= 2) segments.push(clean)
  }

  for (const segment of buildRarefactionArcSegments(anchorPoint, params, view, samples, rarefactionSpeedMode)) {
    const clean = segment.map(withCoords).filter(Boolean)
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
    const clean = segment.map(withCoords).filter(Boolean)
    if (clean.length >= 2) segments.push(clean)
  }

  if (validPoint(nonLocalAnchor)) {
    for (const segment of buildShockSegments(fixedState, nonLocalAnchor, params, view, samples, {
      expanded: true,
      useAnchorPoint: true,
      nonLocal: true,
      hugoniotDirection: 'backward',
      speedMode: hugoniotSpeedMode,
      sonicTarget: 'right',
    })) {
      const clean = segment.map(withCoords).filter(Boolean)
      if (clean.length >= 2) segments.push(clean)
    }
  }

  return segments.filter((segment) => segment.length >= 2)
}

export function buildSaturatedStripByHMinus(basePoints, params, view, zSamples = 34) {
  const base = sampleSegment(basePoints, 180)
  if (base.length < 2) return null

  const zSpan = Math.max(1, view.zMax - view.zMin)
  const zMin = view.zMin - 0.35 * zSpan
  const zMax = view.zMax + 0.35 * zSpan
  const zValues = Array.from({ length: zSamples }, (_, j) => zMin + (j * (zMax - zMin)) / Math.max(1, zSamples - 1))

  const positions = []
  const valid = []

  for (const point of base) {
    const leftState = computeLeftStateFromWavePoint(point.t, point.Y, point.z, params)
    const rowValid = []
    for (const z of zValues) {
      const p = leftState ? solveHugoniotPointForFixedState(z, leftState, params) : null
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

export default function IntermediateFastSurface({
  fixedState,
  anchorPoint,
  nonLocalAnchor,
  params,
  view,
  resolution = 40,
  visible = true,
  opacity = 0.24,
  color = waveColors.intermediateFast ?? '#f8fafc',
}) {
  const geometries = useMemo(() => {
    if (!fixedState || !validPoint(anchorPoint)) return []
    const segments = collectFastWaveSegments({ fixedState, anchorPoint, nonLocalAnchor, params, view, resolution })
    return segments
      .map((segment) => buildSaturatedStripByHMinus(segment, params, view, Math.max(48, Math.min(88, Math.round(resolution * 1.1)))))
      .filter(Boolean)
  }, [fixedState, anchorPoint, nonLocalAnchor, params, view, resolution])

  if (!visible || !geometries.length) return null

  return (
    <group>
      {geometries.map((geometry, index) => (
        <mesh key={`intermediate-fast-surface-${index}`} geometry={geometry} renderOrder={4}>
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
            roughness={0.55}
            metalness={0.05}
          />
        </mesh>
      ))}
    </group>
  )
}
