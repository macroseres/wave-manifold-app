import React from 'react'
import * as THREE from 'three'

const SOLUTION_POINT_RADIUS = 0.034
const SOLUTION_RING_RADIUS = 0.075
const SOLUTION_RING_TUBE = 0.007

export default function HoverableSolutionPoint({
  point,
  position,
  color,
  markerScale,
  renderOrder,
  onHoverPoint,
  onCreateInspectionProbe = null,
  hoverLabel,
  children = null,
}) {
  const [hovered, setHovered] = React.useState(false)
  const hoverColor = '#22d3ee'
  return (
    <group position={position} scale={markerScale}>
      <mesh
        renderOrder={renderOrder}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
          onHoverPoint?.({ ...point, hoverLabel })
        }}
        onPointerOut={(event) => {
          event.stopPropagation()
          setHovered(false)
          onHoverPoint?.(null)
        }}
        onClick={(event) => {
          if (!onCreateInspectionProbe) return
          event.stopPropagation()
          event.nativeEvent?.stopImmediatePropagation?.()
          onCreateInspectionProbe({
            ...point,
            branch: point?.branch ?? (point?.t < -1e-9 ? 'fast' : 'slow'),
            attachedCurve: point?.attachedCurve ?? point?.label ?? hoverLabel,
          })
        }}
      >
        <sphereGeometry args={[hovered ? SOLUTION_POINT_RADIUS * 1.35 : SOLUTION_POINT_RADIUS, 24, 24]} />
        <meshStandardMaterial
          color={hovered ? hoverColor : color}
          emissive={new THREE.Color(hovered ? hoverColor : color)}
          emissiveIntensity={hovered ? 1.05 : 0.55}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      {hovered ? (
        <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={renderOrder + 1}>
          <torusGeometry args={[SOLUTION_RING_RADIUS * 1.18, SOLUTION_RING_TUBE * 1.45, 12, 64]} />
          <meshStandardMaterial
            color={hoverColor}
            emissive={hoverColor}
            emissiveIntensity={1.15}
            transparent
            opacity={0.72}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      ) : null}
      {children}
    </group>
  )
}
