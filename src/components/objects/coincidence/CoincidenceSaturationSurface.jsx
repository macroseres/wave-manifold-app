import React from 'react'
import * as THREE from 'three'
import { waveColors } from '../../../config/waveColors'
import { useSurfaceGeometry } from '../../../hooks/useSurfaceGeometry'
import { ZCompactifiedMesh } from '../../../app/scene/ZCompactification'

export default function CoincidenceSaturationSurface({
  params,
  view,
  resolution,
  opacity,
  wireframe,
  visible = true,
  direction = 'minus',
}) {
  const geometry = useSurfaceGeometry('saturated-coincidence', params, view, resolution, visible, direction)?.surface

  if (!geometry || geometry.attributes.position?.count === 0) return null

  return (
    <ZCompactifiedMesh geometry={geometry} renderOrder={2}>
      <meshStandardMaterial
        color={direction === 'plus' ? waveColors.saturatedCoincidencePlus : waveColors.saturatedCoincidence}
        side={THREE.DoubleSide}
        transparent
        opacity={Math.min(0.62, opacity * 0.72)}
        depthWrite={false}
        wireframe={wireframe}
        roughness={0.45}
        metalness={0.0}
      />
    </ZCompactifiedMesh>
  )
}
