import React, { useRef } from 'react'
import { useSurfaceGeometry } from '../../../hooks/useSurfaceGeometry'
import * as THREE from 'three'
import { ZCompactifiedMesh } from '../../../app/scene/ZCompactification'
import { visualZToPhysical } from '../../../geometry/zCompactification'
import { waveColors } from '../../../config/waveColors'
import {
  classifySonicPoint,
} from '../../../entities/sonic/surfaceModel'

const CLICK_DRAG_TOLERANCE_PX = 5
const SONIC_SURFACE_OPACITY = 0.32

export default function SonicMinusSurface({
  params,
  view,
  resolution,
  opacity,
  wireframe,
  onSelectPoint,
  onInspectPoint,
  interactive = true,
}) {
  const geometries = useSurfaceGeometry('sonic-left', params, view, resolution)

  const pointerDownRef = useRef(null)

  const inspectAtEventPoint = (event) => {
    event.preventDefault?.()
    event.nativeEvent?.preventDefault?.()
    event.stopPropagation()
    if (!interactive || !onInspectPoint) return
    const local = event.object.worldToLocal(event.point.clone())
    local.z = visualZToPhysical(local.z)
    const branchInfo = classifySonicPoint('left', { t: local.x, Y: local.y, z: local.z }, params)
    onInspectPoint({
      t: local.x,
      Y: local.y,
      z: local.z,
      coords: [local.x, local.y, local.z],
      curveType: branchInfo.label,
      branchLabelTex: branchInfo.tex,
      speedLabel: '\\lambda',
      status: 'inspection',
      sonicLeftBranchIndicator: branchInfo.indicator,
    })
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
    event.stopPropagation()
    pointerDownRef.current = {
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
      object: event.object,
    }
  }

  const handlePointerUp = (event) => {
    if (!interactive) { pointerDownRef.current = null; return }
    const button = event.nativeEvent?.button ?? event.button
    if (button !== 0) {
      if (button === 2) event.stopPropagation()
      pointerDownRef.current = null
      return
    }
    event.stopPropagation()
    if (!onSelectPoint || !pointerDownRef.current) return

    const dx = event.nativeEvent.clientX - pointerDownRef.current.x
    const dy = event.nativeEvent.clientY - pointerDownRef.current.y
    const dragged = Math.hypot(dx, dy) > CLICK_DRAG_TOLERANCE_PX
    const sameObject = pointerDownRef.current.object === event.object
    pointerDownRef.current = null

    if (dragged || !sameObject) return

    const local = event.object.worldToLocal(event.point.clone())
    local.z = visualZToPhysical(local.z)
    onSelectPoint({ t: local.x, Y: local.y, z: local.z })
  }

  const handleContextMenu = (event) => {
    event.preventDefault?.()
    event.nativeEvent?.preventDefault?.()
    event.stopPropagation()
  }

  if (!geometries) return null
  return (
    <group>
      <ZCompactifiedMesh
        geometry={geometries.fast}
        onPointerDown={interactive ? handlePointerDown : undefined}
        onPointerUp={interactive ? handlePointerUp : undefined}
        onContextMenu={interactive ? handleContextMenu : undefined}
      >
        <meshStandardMaterial
          color={waveColors.sonicLeftFast}
          emissive={waveColors.sonicLeftFast}
          emissiveIntensity={0.24}
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
        onContextMenu={interactive ? handleContextMenu : undefined}
      >
        <meshStandardMaterial
          color={waveColors.sonicLeftSlow}
          emissive={waveColors.sonicLeftSlow}
          emissiveIntensity={0.26}
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
