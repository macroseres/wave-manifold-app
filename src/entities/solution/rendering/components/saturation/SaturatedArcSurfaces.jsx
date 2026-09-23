import React, { useMemo } from 'react'
import * as THREE from 'three'
import { FORWARD_HUGONIOT, normalizeHugoniotDirection } from '../../../../hugoniot/directions.js'
import { buildGeometryForRarefactionSaturationSegment } from '../../../../../geometry/rarefactionSaturationGeometry.js'
import { toPointObjectSegments } from '../../solutionModeGeometry.js'
import { ZCompactifiedMesh } from '../../../../../app/scene/ZCompactification.jsx'

function buildBufferGeometry(part) {
  if (!part?.vertices?.length || !part?.indices?.length) return null
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(part.vertices, 3))
  geometry.setIndex(part.indices)
  geometry.computeVertexNormals()
  return geometry
}

export default function SaturatedArcSurfaces({
  segments,
  params,
  view,
  resolution,
  direction = FORWARD_HUGONIOT,
  visible = true,
  color = '#38bdf8',
  opacity = 0.18,
}) {
  const geometries = useMemo(() => {
    if (!visible || !params || !view) return []
    const pointSegments = toPointObjectSegments(segments)
    const normalizedDirection = normalizeHugoniotDirection(direction)
    return pointSegments
      .map((segment) => buildGeometryForRarefactionSaturationSegment(
        segment,
        params,
        view,
        view,
        normalizedDirection,
        resolution,
      ))
      .map(buildBufferGeometry)
      .filter(Boolean)
  }, [segments, params, view, resolution, direction, visible])

  if (!visible || !geometries.length) return null

  return (
    <group>
      {geometries.map((geometry, index) => (
        <ZCompactifiedMesh key={`sat-rnl-hminus-${index}`} geometry={geometry} renderOrder={5}>
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
            roughness={0.58}
            metalness={0.02}
          />
        </ZCompactifiedMesh>
      ))}
    </group>
  )
}
