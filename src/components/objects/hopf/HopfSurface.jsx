import React from 'react'
import * as THREE from 'three'
import { useSurfaceGeometry } from '../../../hooks/useSurfaceGeometry'
import { ZCompactifiedMesh } from '../../../app/scene/ZCompactification'
import { waveColors } from '../../../config/waveColors'

export default function HopfSurface({ params, view, resolution, opacity, wireframe, visible = true, direction = 'plus' }) {
  const geometry = useSurfaceGeometry('hopf', params, view, resolution, visible, direction)?.surface
  if (!geometry || !geometry.attributes.position?.count) return null
  return (
    <ZCompactifiedMesh geometry={geometry} renderOrder={1}>
      <meshBasicMaterial
        color={direction === 'plus' ? waveColors.hopfPlus : waveColors.hopfMinus}
        side={THREE.DoubleSide}
        transparent
        depthWrite={false}
        opacity={Math.min(0.5, opacity * 0.65)}
        wireframe={wireframe}
      />
    </ZCompactifiedMesh>
  )
}
