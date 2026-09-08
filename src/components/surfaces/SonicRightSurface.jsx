import React, { useRef } from 'react'
import { useSurfaceGeometry } from '../hooks/useSurfaceGeometry'
import * as THREE from 'three'
import { ZCompactifiedMesh } from '../../app/scene/ZCompactification'
import { visualZToPhysical } from '../../geometry/zCompactification'
import { waveColors } from '../../config/waveColors'
import {
  classifySonicPoint,
} from '../../entities/sonic/surfaceModel'

const CLICK_DRAG_TOLERANCE_PX = 5
const SONIC_SURFACE_OPACITY = 0.33

export default function SonicRightSurface({
  params,
  view,
  resolution,
  opacity,
  wireframe,
  onInspectPoint,
  onHoverPoint,
  interactive = true,
}) {
  const geometries = useSurfaceGeometry('sonic-right', params, view, resolution)
  const pointerDownRef = useRef(null)

  const decoratedPointFromEvent = (event, status = 'inspection') => {
    const local = event.object.worldToLocal(event.point.clone())
    local.z = visualZToPhysical(local.z)
    const branchInfo = classifySonicPoint('right', { t: local.x, Y: local.y, z: local.z }, params)
    return {
      t: local.x,
      Y: local.y,
      z: local.z,
      coords: [local.x, local.y, local.z],
      curveType: branchInfo.label,
      branchLabelTex: branchInfo.tex,
      speedLabel: '\\lambda',
      status,
      sonicRightBranchIndicator: branchInfo.indicator,
    }
  }

  const inspectAtEventPoint = (event) => {
    event.preventDefault?.()
    event.nativeEvent?.preventDefault?.()
    event.stopPropagation()
    if (!interactive || !onInspectPoint) return
    onInspectPoint(decoratedPointFromEvent(event))
  }

  const handlePointerDown = (event) => {
    if (!interactive) return
    const native = event.nativeEvent ?? event
    const button = native.button ?? event.button
    const buttons = native.buttons ?? event.buttons
    if (button === 2 || buttons === 2) {
      pointerDownRef.current = null
      inspectAtEventPoint(event)
      return
    }
    if (button !== 0) {
      pointerDownRef.current = null
      return
    }
    pointerDownRef.current = {
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
      object: event.object,
    }
  }

  const handlePointerUp = (event) => {
    if (!interactive) {
      pointerDownRef.current = null
      return
    }
    const button = event.nativeEvent?.button ?? event.button
    if (button !== 0) {
      if (button === 2) event.stopPropagation()
      pointerDownRef.current = null
      return
    }
    pointerDownRef.current = null
  }

  const handlePointerMove = (event) => {
    if (!interactive || !onHoverPoint) return
    if (pointerDownRef.current) {
      const dx = event.nativeEvent.clientX - pointerDownRef.current.x
      const dy = event.nativeEvent.clientY - pointerDownRef.current.y
      if (Math.hypot(dx, dy) > CLICK_DRAG_TOLERANCE_PX) return
    }
    onHoverPoint(decoratedPointFromEvent(event, 'hover'))
  }

  const handlePointerOut = () => {
    onHoverPoint?.(null)
  }

  if (!geometries) return null
  return (
    <group>
      <ZCompactifiedMesh
        geometry={geometries.fast}
        onPointerDown={interactive ? handlePointerDown : undefined}
        onPointerUp={interactive ? handlePointerUp : undefined}
        onPointerMove={interactive ? handlePointerMove : undefined}
        onPointerOut={interactive ? handlePointerOut : undefined}
        onContextMenu={interactive ? inspectAtEventPoint : undefined}
      >
        <meshStandardMaterial
          color={waveColors.sonicRightFast}
          emissive={waveColors.sonicRightFast}
          emissiveIntensity={0.22}
          side={THREE.DoubleSide}
          transparent
          opacity={Math.min(SONIC_SURFACE_OPACITY, opacity)}
          wireframe={wireframe}
          roughness={0.74}
          metalness={0.0}
          depthWrite={false}
          polygonOffset={true}
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </ZCompactifiedMesh>
      <ZCompactifiedMesh
        geometry={geometries.slow}
        onPointerDown={interactive ? handlePointerDown : undefined}
        onPointerUp={interactive ? handlePointerUp : undefined}
        onPointerMove={interactive ? handlePointerMove : undefined}
        onPointerOut={interactive ? handlePointerOut : undefined}
        onContextMenu={interactive ? inspectAtEventPoint : undefined}
      >
        <meshStandardMaterial
          color={waveColors.sonicRightSlow}
          emissive={waveColors.sonicRightSlow}
          emissiveIntensity={0.23}
          side={THREE.DoubleSide}
          transparent
          opacity={Math.min(SONIC_SURFACE_OPACITY, opacity)}
          wireframe={wireframe}
          roughness={0.74}
          metalness={0.0}
          depthWrite={false}
          polygonOffset={true}
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </ZCompactifiedMesh>
    </group>
  )
}
