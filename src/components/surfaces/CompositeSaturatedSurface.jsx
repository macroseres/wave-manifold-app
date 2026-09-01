import React, { useMemo } from 'react'
import * as THREE from 'three'
import { FORWARD_HUGONIOT, BACKWARD_HUGONIOT } from '../../entities/hugoniot/directions'
import { waveColors } from '../../config/waveColors'
import { buildCompositeSaturatedSurfaceGeometry } from '../../geometry/compositeSaturatedSurfaceGeometry'
import { ZCompactifiedMesh } from '../../app/scene/ZCompactification'

function CompositeSaturatedSurfaceBase({
  fixedState,
  params,
  view,
  resolution,
  opacity = 0.75,
  wireframe = false,
  visible = true,
  direction = FORWARD_HUGONIOT,
  color = '#60a5fa',
}) {
  const geometry = useMemo(() => {
    if (!visible || !fixedState) return null
    return buildCompositeSaturatedSurfaceGeometry({ fixedState, params, view, resolution, direction })
  }, [fixedState, params, view, resolution, direction, visible])

  if (!visible || !fixedState || !geometry || geometry.attributes.position?.count === 0) return null

  return (
    <ZCompactifiedMesh geometry={geometry} renderOrder={2}>
      <meshStandardMaterial
        color={color}
        side={THREE.DoubleSide}
        transparent
        opacity={Math.min(0.28, Math.max(0.06, opacity * 0.22))}
        wireframe={wireframe}
        roughness={0.7}
        metalness={0.0}
        depthWrite={false}
      />
    </ZCompactifiedMesh>
  )
}

export function CompositeSaturatedSlowSurface(props) {
  return (
    <CompositeSaturatedSurfaceBase
      {...props}
      direction={FORWARD_HUGONIOT}
      color={props.color ?? waveColors.compositeSaturatedSlow ?? '#60a5fa'}
    />
  )
}

export function CompositeSaturatedFastSurface(props) {
  return (
    <CompositeSaturatedSurfaceBase
      {...props}
      direction={BACKWARD_HUGONIOT}
      color={props.color ?? waveColors.compositeSaturatedFast ?? '#f472b6'}
    />
  )
}

export default CompositeSaturatedSurfaceBase
