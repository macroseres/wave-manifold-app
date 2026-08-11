import React, { useMemo } from 'react'
import * as THREE from 'three'
import { buildSaturatedGeometry } from '../../geometry/saturatedSurfaceGeometry'

export default function SaturatedSurface({ params, view, resolution, opacity, wireframe, visible = true }) {
  const geometry = useMemo(() => {
    if (!visible) return null
    return buildSaturatedGeometry(params, view, resolution)
  }, [params, view, resolution, visible])

  if (!geometry || geometry.attributes.position?.count === 0) return null

  return (
    <mesh geometry={geometry} renderOrder={1}>
      <meshStandardMaterial
        color="#f59e0b"
        side={THREE.DoubleSide}
        transparent
        opacity={Math.min(0.5, opacity * 0.65)}
        wireframe={wireframe}
        roughness={0.45}
        metalness={0.0}
      />
    </mesh>
  )
}
