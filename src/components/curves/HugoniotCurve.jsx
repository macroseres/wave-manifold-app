import { waveColors } from '../../config/waveColors.js'
import React, { useMemo } from 'react'
import * as THREE from 'three'
import { FORWARD_HUGONIOT, BACKWARD_HUGONIOT, normalizeHugoniotDirection } from '../../entities/hugoniot/directions'
import { ZCompactifiedLine as Line } from '../../app/scene/ZCompactification'
import { physicalPointToVisual } from '../../geometry/zCompactification'

import { buildHugoniotCurveData, flattenVisibleHugoniotIntersections } from '../../entities/hugoniot/curveData'

const POINT_RADIUS = 0.034

function PointMarker({ point, radius, color, markerScale, onInspectPoint, onHoverPoint, emissiveIntensity = 0.25, interactive = true }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <mesh
      position={physicalPointToVisual([point.t, point.Y, point.z])}
      scale={markerScale}
      onPointerDown={interactive ? ((event) => {
        const button = event.nativeEvent?.button ?? event.button
        if (button === 2) event.stopPropagation()
      }) : undefined}
      onPointerUp={interactive ? ((event) => {
        const button = event.nativeEvent?.button ?? event.button
        if (button === 2) event.stopPropagation()
      }) : undefined}
      onContextMenu={interactive ? ((event) => {
        event.preventDefault?.()
        event.nativeEvent?.preventDefault?.()
        event.stopPropagation()
        onInspectPoint?.(point)
      }) : undefined}
      onPointerOver={interactive ? ((event) => {
        event.stopPropagation()
        setHovered(true)
        onHoverPoint?.(point)
      }) : undefined}
      onPointerOut={interactive ? ((event) => {
        event.stopPropagation()
        setHovered(false)
        onHoverPoint?.(null)
      }) : undefined}
    >
      <sphereGeometry args={[hovered ? radius * 1.22 : radius, 24, 24]} />
      <meshStandardMaterial
        color={color}
        emissive={new THREE.Color(color)}
        emissiveIntensity={hovered ? Math.max(1.05, emissiveIntensity) : emissiveIntensity}
        roughness={0.35}
      />
      {hovered ? (
        <mesh renderOrder={24}>
          <octahedronGeometry args={[radius * 2.25, 0]} />
          <meshStandardMaterial
            color="#22d3ee"
            emissive="#22d3ee"
            emissiveIntensity={1.1}
            roughness={0.22}
            transparent
            opacity={0.34}
            wireframe
          />
        </mesh>
      ) : null}
    </mesh>
  )
}

function HugoniotCurve({
  fixedState,
  params,
  view,
  resolution = 40,
  visible = true,
  showInspectionPoints = false,
  intersectionGroups = null,
  markerScale = [1, 1, 1],
  onInspectPoint,
  onHoverPoint,
  direction = FORWARD_HUGONIOT,
  color = null,
  interactive = true,
  compactifiedZ = false,
}) {
  const { segments, markers } = useMemo(() => {
    if (!visible || !fixedState) return { segments: [], markers: [] }
    const samples = Math.max(260, Math.min(560, resolution * 7))
    return buildHugoniotCurveData(fixedState, params, view, samples, direction, { compactifiedZ })
  }, [fixedState, params, view, resolution, direction, visible, compactifiedZ])

  const visibleIntersections = useMemo(() => {
    return flattenVisibleHugoniotIntersections(intersectionGroups)
  }, [intersectionGroups])

  if (!visible || !fixedState || (segments.length === 0 && visibleIntersections.length === 0)) return null

  const curveColor = color ?? (normalizeHugoniotDirection(direction) === BACKWARD_HUGONIOT ? waveColors.hugoniotPlus : waveColors.hugoniotMinus)

  return (
    <group>
      {segments.map((points, idx) => (
        <Line
          key={`hugoniot-${idx}`}
          points={points.map((point) => point.coords)}
          color={curveColor}
          lineWidth={1.35}
          renderOrder={7}
          transparent={false}
          opacity={1}
        />
      ))}

      {visibleIntersections.map((point, idx) => (
        <PointMarker
          key={`intersection-${point.intersectionLabel}-${point.z}-${idx}`}
          point={point}
          radius={POINT_RADIUS}
          color={point.markerColor}
          markerScale={markerScale}
          onInspectPoint={onInspectPoint}
          onHoverPoint={onHoverPoint}
          emissiveIntensity={point.isClicked ? 1.0 : point.kind?.startsWith('S_L') ? 0.75 : 0.45}
          interactive={interactive}
        />
      ))}

      {showInspectionPoints && markers.map((point, idx) => (
        <PointMarker
          key={`inspection-${point.z}-${idx}`}
          point={point}
          radius={POINT_RADIUS}
          color="#2563eb"
          markerScale={markerScale}
          onInspectPoint={onInspectPoint}
          onHoverPoint={onHoverPoint}
          interactive={interactive}
        />
      ))}
    </group>
  )
}

export default React.memo(HugoniotCurve)

