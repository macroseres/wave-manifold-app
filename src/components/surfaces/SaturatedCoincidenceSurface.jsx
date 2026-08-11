import React, { useMemo } from 'react'
import * as THREE from 'three'
import { waveColors } from '../../config/waveColors'
import { buildSaturatedCoincidenceGeometry } from '../../geometry/saturatedCoincidenceSurfaceGeometry'

export default function SaturatedCoincidenceSurface({
  params,
  view,
  resolution,
  opacity,
  wireframe,
  visible = true,
}) {
  const geometry = useMemo(() => {
    if (!visible) return null
    return buildSaturatedCoincidenceGeometry(params, view, resolution)
  }, [params, view, resolution, visible])

  if (!geometry || geometry.attributes.position?.count === 0) return null

  return (
    <mesh geometry={geometry} renderOrder={2}>
      <meshStandardMaterial
        color={waveColors.saturatedCoincidence}
        side={THREE.DoubleSide}
        transparent
        opacity={Math.min(0.62, opacity * 0.72)}
        depthWrite={false}
        wireframe={wireframe}
        roughness={0.45}
        metalness={0.0}
      />
    </mesh>
  )
}
