import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { waveColors } from '../../config/waveColors'
import {
  CHARACTERISTIC_CLICK_DRAG_TOLERANCE_PX as CLICK_DRAG_TOLERANCE_PX,
  CHARACTERISTIC_DRAG_PLANE as DRAG_PLANE,
  CHARACTERISTIC_POINT_RADIUS as POINT_RADIUS,
  CHARACTERISTIC_SELECTED_RING_RADIUS as SELECTED_RING_RADIUS,
  CHARACTERISTIC_SELECTED_RING_TUBE as SELECTED_RING_TUBE,
  CHARACTERISTIC_ZERO_TAU_GAP_FACTOR as ZERO_TAU_GAP_FACTOR,
  characteristicMarkerColor as markerColorForPoint,
  makeCharacteristicPlaneGeometry as makeCharacteristicPlane,
} from '../../entities/characteristic'
import {
  VISUAL_Z_MAX,
  VISUAL_Z_MIN,
  physicalPointToVisual,
  physicalZToVisual,
  visualZToPhysical,
} from '../../geometry/zCompactification'

function CharacteristicSurface({
  view,
  opacity = 0.52,
  onSelectPoint,
  onCreateInspectionProbe,
  onInspectPoint,
  onMoveSelectedPoint,
  onMarkerDragChange,
  onMarkerHoverChange,
  selectedPoint = null,
  selectedPoints = null,
  markerScale = [1, 1, 1],
  interactive = true,
  inspectionMode = false,
  markerInteractive = true,
}) {
  const zeroTauGap = Math.max(1e-5, ZERO_TAU_GAP_FACTOR * Math.max(1, view.tMax - view.tMin))
  const fastGeometry = useMemo(() => (
    makeCharacteristicPlane(view.tMin, Math.min(-zeroTauGap, view.tMax), VISUAL_Z_MIN, VISUAL_Z_MAX)
  ), [view.tMin, view.tMax, zeroTauGap])
  const slowGeometry = useMemo(() => (
    makeCharacteristicPlane(Math.max(zeroTauGap, view.tMin), view.tMax, VISUAL_Z_MIN, VISUAL_Z_MAX)
  ), [view.tMin, view.tMax, zeroTauGap])

  const rootRef = useRef(null)
  const pointerDownRef = useRef(null)
  const markerDragRef = useRef(null)
  const lastDragPointRef = useRef(null)
  const markerRefs = useRef(new Map())
  const [hoveredMarkerBranch, setHoveredMarkerBranch] = useState(null)

  useEffect(() => () => {
    const frameId = markerDragRef.current?.frameId
    if (frameId) cancelAnimationFrame(frameId)
  }, [])

  const inspectAtEventPoint = (event) => {
    event.preventDefault?.()
    event.nativeEvent?.preventDefault?.()
    event.stopPropagation()
    if (!interactive || !onInspectPoint) return
    const local = event.object.worldToLocal(event.point.clone())
    local.z = visualZToPhysical(local.z)
    onInspectPoint({
      t: local.x,
      Y: 0,
      z: local.z,
      coords: [local.x, 0, local.z],
      curveType: 'Superfície característica',
      speedLabel: '\\lambda',
      status: 'inspection',
    })
  }

  const handlePointerDown = (branch) => (event) => {
    if (!interactive) return
    const native = event.nativeEvent ?? event
    const button = native.button ?? event.button
    const buttons = native.buttons ?? event.buttons
    if (button === 2 || buttons === 2) {
      pointerDownRef.current = null
      event.preventDefault?.()
      event.nativeEvent?.preventDefault?.()
      event.stopPropagation()
      return
    }
    if (button !== 0) {
      pointerDownRef.current = null
      return
    }
    // Não pare a propagação no clique esquerdo sobre a superfície.
    // Assim o OrbitControls continua recebendo pointerdown/move e o usuário
    // pode girar a cena mesmo quando o mouse está sobre a característica.
    // A seleção é decidida apenas no pointerup se não houve arrasto real.
    pointerDownRef.current = {
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
      object: event.object,
      branch,
    }
  }

  const handlePointerUp = (branch) => (event) => {
    if (!interactive) { pointerDownRef.current = null; return }
    const button = event.nativeEvent?.button ?? event.button
    if (button !== 0) {
      if (button === 2) event.stopPropagation()
      pointerDownRef.current = null
      return
    }
    if ((!onSelectPoint && !onCreateInspectionProbe) || !pointerDownRef.current) return

    const dx = event.nativeEvent.clientX - pointerDownRef.current.x
    const dy = event.nativeEvent.clientY - pointerDownRef.current.y
    const dragged = Math.hypot(dx, dy) > CLICK_DRAG_TOLERANCE_PX
    const sameObject = pointerDownRef.current.object === event.object
    const downBranch = pointerDownRef.current.branch
    pointerDownRef.current = null

    // Se houve arrasto, deixe o OrbitControls concluir normalmente.
    if (dragged || !sameObject || downBranch !== branch) return
    // Clique curto seleciona/cria ponto, mas NÃO bloqueia o pointerup.
    // Se bloquearmos a propagação aqui, o OrbitControls pode ficar preso
    // em estado de rotação após um clique simples sobre a característica.
    const local = event.object.worldToLocal(event.point.clone())
    local.z = visualZToPhysical(local.z)
    const nextPoint = { t: local.x, Y: 0, z: local.z, branch }
    if (inspectionMode) onCreateInspectionProbe?.(nextPoint)
    else onSelectPoint(nextPoint)
  }

  const handleContextMenu = (event) => {
    inspectAtEventPoint(event)
  }

  const clampToBranch = (branch, t, z) => {
    const tMin = branch === 'fast' ? view.tMin : Math.max(zeroTauGap, view.tMin)
    const tMax = branch === 'fast' ? Math.min(-zeroTauGap, view.tMax) : view.tMax
    return {
      t: Math.min(tMax, Math.max(tMin, t)),
      Y: 0,
      z,
      branch,
    }
  }

  const pointOnCharacteristicFromEvent = (event, branch, options = {}) => {
    if (!rootRef.current || !event.ray) return null
    const worldPoint = new THREE.Vector3()
    const hit = event.ray.intersectPlane(DRAG_PLANE, worldPoint)
    if (!hit) return null
    const local = rootRef.current.worldToLocal(worldPoint.clone())
    const t = local.x + (options.offsetT ?? 0)
    const z = visualZToPhysical(local.z) + (options.offsetZ ?? 0)
    return clampToBranch(branch, t, z)
  }

  const applyMarkerPosition = (point) => {
    if (!point?.branch) return
    const marker = markerRefs.current.get(point.branch)
    if (marker) marker.position.set(point.t, 0, physicalZToVisual(point.z))
  }

  const flushScheduledDrag = () => {
    if (!interactive) return
    const drag = markerDragRef.current
    if (!drag?.frameId) return
    cancelAnimationFrame(drag.frameId)
    drag.frameId = null
    applyMarkerPosition(lastDragPointRef.current)
  }

  const scheduleDragUpdate = (next) => {
    const drag = markerDragRef.current
    if (!drag) return
    lastDragPointRef.current = next
    if (drag.frameId) return
    drag.frameId = requestAnimationFrame(() => {
      drag.frameId = null
      applyMarkerPosition(lastDragPointRef.current)
    })
  }

  const handleMarkerPointerDown = (point) => (event) => {
    if (!interactive || !point?.branch || !onMoveSelectedPoint) return
    const native = event.nativeEvent ?? event
    if ((native.button ?? event.button) !== 0) return
    event.stopPropagation()
    event.nativeEvent?.stopImmediatePropagation?.()
    event.preventDefault?.()

    const branch = point.branch
    const pointerOnPlane = pointOnCharacteristicFromEvent(event, branch)
    markerDragRef.current = {
      branch,
      startX: native.clientX,
      startY: native.clientY,
      dragging: false,
      offsetT: pointerOnPlane ? point.t - pointerOnPlane.t : 0,
      offsetZ: pointerOnPlane ? point.z - pointerOnPlane.z : 0,
      frameId: null,
      notified: true,
    }
    onMarkerDragChange?.(true)
    lastDragPointRef.current = { ...point, Y: 0, branch }
    event.target?.setPointerCapture?.(event.pointerId)
  }

  const handleMarkerPointerMove = (point) => (event) => {
    const drag = markerDragRef.current
    const branch = drag?.branch
    if (!branch || branch !== point?.branch || !onMoveSelectedPoint) return

    const native = event.nativeEvent ?? event
    const dx = native.clientX - drag.startX
    const dy = native.clientY - drag.startY
    if (!drag.dragging && Math.hypot(dx, dy) <= CLICK_DRAG_TOLERANCE_PX) {
      event.stopPropagation()
      event.nativeEvent?.stopImmediatePropagation?.()
      event.preventDefault?.()
      return
    }

    drag.dragging = true
    if (!drag.notified) {
      drag.notified = true
      onMarkerDragChange?.(true)
    }
    event.stopPropagation()
    event.nativeEvent?.stopImmediatePropagation?.()
    event.preventDefault?.()
    const next = pointOnCharacteristicFromEvent(event, branch, {
      offsetT: drag.offsetT,
      offsetZ: drag.offsetZ,
    })
    if (next) scheduleDragUpdate(next)
  }

  const handleMarkerPointerUp = (event) => {
    const drag = markerDragRef.current
    if (!drag) return
    event.stopPropagation()
    event.nativeEvent?.stopImmediatePropagation?.()
    flushScheduledDrag()
    markerDragRef.current = null
    const finalPoint = lastDragPointRef.current
    lastDragPointRef.current = null
    if (drag.notified) onMarkerDragChange?.(false)
    if (drag.dragging && finalPoint) onMoveSelectedPoint?.(finalPoint, { dragging: false, final: true })
    event.target?.releasePointerCapture?.(event.pointerId)
  }


  return (
    <group ref={rootRef}>
      {fastGeometry && (
        <mesh
          geometry={fastGeometry}
          renderOrder={-1}
          onPointerDown={interactive ? handlePointerDown('fast') : undefined}
          onPointerUp={interactive ? handlePointerUp('fast') : undefined}
          onContextMenu={interactive ? handleContextMenu : undefined}
        >
          <meshStandardMaterial
            color={waveColors.characteristicFast}
            side={THREE.DoubleSide}
            transparent
            opacity={opacity}
            roughness={0.55}
            metalness={0.0}
          />
        </mesh>
      )}

      {slowGeometry && (
        <mesh
          geometry={slowGeometry}
          renderOrder={-1}
          onPointerDown={interactive ? handlePointerDown('slow') : undefined}
          onPointerUp={interactive ? handlePointerUp('slow') : undefined}
          onContextMenu={interactive ? handleContextMenu : undefined}
        >
          <meshStandardMaterial
            color={waveColors.characteristicSlow}
            side={THREE.DoubleSide}
            transparent
            opacity={opacity}
            roughness={0.55}
            metalness={0.0}
          />
        </mesh>
      )}

      {(selectedPoints ?? (selectedPoint ? [selectedPoint] : [])).map((point) => (
        <group
          key={`${point.branch ?? 'branch'}-selected-marker`}
          ref={(node) => {
            if (node && point.branch) markerRefs.current.set(point.branch, node)
            else if (point.branch) markerRefs.current.delete(point.branch)
          }}
          position={physicalPointToVisual([point.t, 0, point.z])}
          scale={markerScale}
          renderOrder={18}
          onPointerDown={markerInteractive ? handleMarkerPointerDown(point) : undefined}
          onPointerMove={markerInteractive ? handleMarkerPointerMove(point) : undefined}
          onPointerUp={markerInteractive ? handleMarkerPointerUp : undefined}
          onPointerCancel={markerInteractive ? handleMarkerPointerUp : undefined}
          onPointerOver={markerInteractive ? ((event) => {
            event.stopPropagation()
            event.nativeEvent?.stopImmediatePropagation?.()
            setHoveredMarkerBranch(point.branch)
            onMarkerHoverChange?.(true)
          }) : undefined}
          onPointerOut={markerInteractive ? ((event) => {
            event.stopPropagation()
            event.nativeEvent?.stopImmediatePropagation?.()
            setHoveredMarkerBranch((current) => (current === point.branch ? null : current))
            onMarkerHoverChange?.(false)
          }) : undefined}
        >
          <mesh>
            <sphereGeometry args={[hoveredMarkerBranch === point.branch || markerDragRef.current?.branch === point.branch ? POINT_RADIUS * 1.35 : POINT_RADIUS, 24, 24]} />
            <meshStandardMaterial
              color={markerColorForPoint(point)}
              emissive={new THREE.Color(markerColorForPoint(point))}
              emissiveIntensity={hoveredMarkerBranch === point.branch || markerDragRef.current?.branch === point.branch ? 0.85 : 0.35}
              roughness={0.35}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={19}>
            <torusGeometry args={[hoveredMarkerBranch === point.branch || markerDragRef.current?.branch === point.branch ? SELECTED_RING_RADIUS * 1.18 : SELECTED_RING_RADIUS, hoveredMarkerBranch === point.branch || markerDragRef.current?.branch === point.branch ? SELECTED_RING_TUBE * 1.45 : SELECTED_RING_TUBE, 12, 64]} />
            <meshStandardMaterial
              color="#f5c542"
              emissive="#f5c542"
              emissiveIntensity={hoveredMarkerBranch === point.branch || markerDragRef.current?.branch === point.branch ? 1.25 : 0.85}
              roughness={0.28}
              metalness={0.15}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default React.memo(CharacteristicSurface)
