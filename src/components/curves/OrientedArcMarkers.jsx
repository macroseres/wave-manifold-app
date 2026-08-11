import React, { useState } from 'react'
import * as THREE from 'three'

function finite(value) {
  return Number.isFinite(value)
}

function coordsOf(point) {
  if (Array.isArray(point)) return point
  if (!point) return null
  if (Array.isArray(point.coords)) return point.coords
  return [point.t, point.Y ?? 0, point.z]
}

function validCoords(coords) {
  return Array.isArray(coords) && coords.length >= 3 && coords.slice(0, 3).every(finite)
}

function endpointData(points) {
  if (!Array.isArray(points) || points.length < 2) return null
  const first = points[0]
  const last = points[points.length - 1]
  const start = coordsOf(first)
  const end = coordsOf(last)
  if (!validCoords(start) || !validCoords(end)) return null

  return { start, end, first, last }
}


function endpointAtZBoundary(coords, boundaryView) {
  if (!boundaryView || !validCoords(coords)) return false
  const zMin = boundaryView.zMin
  const zMax = boundaryView.zMax
  if (!finite(zMin) || !finite(zMax)) return false
  const span = Math.max(1e-6, Math.abs(zMax - zMin))
  const eps = span * 0.006
  return Math.abs(coords[2] - zMin) <= eps || Math.abs(coords[2] - zMax) <= eps
}

function endpointPayload(point, coords, role, label) {
  const base = point && !Array.isArray(point) ? point : {}
  return {
    ...base,
    t: finite(base.t) ? base.t : coords[0],
    Y: finite(base.Y) ? base.Y : coords[1],
    z: finite(base.z) ? base.z : coords[2],
    coords,
    endpointRole: role,
    endpointLabel: label,
  }
}

const DEFAULT_POINT_RADIUS = 0.034
const HOVER_RING_RADIUS = DEFAULT_POINT_RADIUS * 1.72
const HOVER_RING_TUBE = DEFAULT_POINT_RADIUS * 0.12

function EndpointSphere({ position, color, markerScale, radius, renderOrder, onPointerOver }) {
  const [hovered, setHovered] = useState(false)

  return (
    <group
      position={position}
      scale={markerScale}
      renderOrder={renderOrder}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(true)
        onPointerOver?.()
      }}
      onPointerOut={(event) => {
        event.stopPropagation()
        setHovered(false)
      }}
    >
      <mesh>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={new THREE.Color(color)}
          emissiveIntensity={0.35}
          roughness={0.35}
        />
      </mesh>

      {hovered && (
        <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={renderOrder + 1}>
          <torusGeometry args={[HOVER_RING_RADIUS, HOVER_RING_TUBE, 12, 64]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.9}
            roughness={0.28}
            metalness={0.15}
          />
        </mesh>
      )}
    </group>
  )
}

export default function OrientedArcMarkers({
  points,
  color,
  markerScale = [1, 1, 1],
  radius = DEFAULT_POINT_RADIUS,
  startRadius,
  endRadius,
  renderOrder = 13,
  onHoverEndpoint,
  label = 'arco',
  markerBoundaryView = null,
  showStartMarker = true,
  showEndMarker = true,
}) {
  const data = endpointData(points)
  if (!data) return null

  const r0 = startRadius ?? radius
  const r1 = endRadius ?? radius
  const showStart = showStartMarker !== false && !endpointAtZBoundary(data.start, markerBoundaryView)
  const showEnd = showEndMarker !== false && !endpointAtZBoundary(data.end, markerBoundaryView)

  return (
    <group>
      {showStart ? (
        <EndpointSphere
          position={data.start}
        color={color}
        markerScale={markerScale}
        radius={r0}
        renderOrder={renderOrder}
        label={`${label}: ponto inicial`}
          onPointerOver={() => onHoverEndpoint?.(endpointPayload(data.first, data.start, 'start', `${label}: ponto inicial`))}
        />
      ) : null}
      {showEnd ? (
        <EndpointSphere
          position={data.end}
        color={color}
        markerScale={markerScale}
        radius={r1}
        renderOrder={renderOrder}
        label={`${label}: ponto final`}
          onPointerOver={() => onHoverEndpoint?.(endpointPayload(data.last, data.end, 'end', `${label}: ponto final`))}
        />
      ) : null}
    </group>
  )
}
