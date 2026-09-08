import React from 'react'
import * as THREE from 'three'
import { useSurfaceGeometry } from '../hooks/useSurfaceGeometry'
import { ZCompactifiedMesh } from '../../app/scene/ZCompactification'

export default function SaturatedSurface({ params, view, resolution, opacity, wireframe, visible = true, direction = 'minus' }) {
  const geometry = useSurfaceGeometry('saturated', params, view, resolution, visible, direction)?.surface

  if (!geometry || geometry.attributes.position?.count === 0) return null

  return (
    <ZCompactifiedMesh geometry={geometry} renderOrder={1}>
      <meshStandardMaterial
        color={direction === 'plus' ? '#34d399' : '#f59e0b'}
        side={THREE.DoubleSide}
        transparent
        depthWrite={false}
        opacity={Math.min(0.5, opacity * 0.65)}
        wireframe={wireframe}
        roughness={0.45}
        metalness={0.0}
      />
    </ZCompactifiedMesh>
  )
}
