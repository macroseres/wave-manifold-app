import React, { useState } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { HOVER_RING_RADIUS, HOVER_RING_TUBE, MARKER_HOVER_RING_COLOR, POINT_RADIUS } from './constants.js'
import { coordsOf, hoverColor } from './coordinates.js'

export function drawSegments(segments, color, keyPrefix, lineWidth = 1.35, dashed = false) {
  return (segments ?? []).map((segment, index) => {
    const points = (segment ?? []).map(coordsOf).filter(Boolean)
    if (points.length < 2) return null
    return (
      <Line
        key={`${keyPrefix}-${index}`}
        points={points}
        color={color}
        lineWidth={lineWidth}
        renderOrder={10}
        dashed={dashed}
        dashSize={0.055}
        gapSize={0.035}
      />
    )
  })
}

function InspectionIntersectionMarker({ marker, coords, color, markerScale, onHoverPoint, branch, hoverDisabled = false }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <group
      position={coords}
      scale={markerScale}
      renderOrder={24}
      onPointerOver={(event) => {
        event.stopPropagation()
        if (hoverDisabled) return
        setIsHovered(true)
        onHoverPoint?.({
          ...marker,
          t: coords[0],
          Y: coords[1],
          z: coords[2],
          branch,
          hoverLabel: marker.hoverLabel ?? `interseção ${branch ?? ''}`,
        })
      }}
      onPointerOut={(event) => {
        event.stopPropagation()
        setIsHovered(false)
        if (!hoverDisabled) onHoverPoint?.(null)
      }}
    >
      <mesh scale={isHovered ? 1.42 : 1}>
        <sphereGeometry args={[POINT_RADIUS * 0.9, 24, 24]} />
        <meshStandardMaterial
          color={isHovered ? hoverColor(color) : color}
          emissive={isHovered ? hoverColor(color) : new THREE.Color(color)}
          emissiveIntensity={isHovered ? 1.05 : 0.7}
          roughness={0.32}
        />
      </mesh>
      {isHovered ? (
        <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={25}>
          <torusGeometry args={[HOVER_RING_RADIUS, HOVER_RING_TUBE, 12, 64]} />
          <meshStandardMaterial
            color={MARKER_HOVER_RING_COLOR}
            emissive={MARKER_HOVER_RING_COLOR}
            emissiveIntensity={1.05}
            transparent
            opacity={0.88}
            depthTest={false}
          />
        </mesh>
      ) : null}
    </group>
  )
}

export function drawIntersectionMarkers(markers, color, keyPrefix, markerScale = [1, 1, 1], onHoverPoint = null, branch = null, hoverDisabled = false) {
  return (markers ?? []).map((marker, index) => {
    const coords = coordsOf(marker)
    if (!coords) return null
    return (
      <InspectionIntersectionMarker
        key={`${keyPrefix}-${marker.key ?? index}`}
        marker={marker}
        coords={coords}
        color={color}
        markerScale={markerScale}
        onHoverPoint={onHoverPoint}
        branch={branch}
        hoverDisabled={hoverDisabled}
      />
    )
  })
}
