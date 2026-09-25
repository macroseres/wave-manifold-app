import { useCallback, useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { Vector3 } from 'three'
import {
  CHARACTERISTIC_POINT_RADIUS,
  CHARACTERISTIC_SELECTED_RING_RADIUS,
  CHARACTERISTIC_SELECTED_RING_TUBE,
} from '../../entities/characteristic/planeGeometry.js'

export default function RarefactionSingularityMarker({ position, markerScale, inspection, type, z, infinity = false, details, family }) {
  const [hovered, setHovered] = useState(false)
  const tooltipRef = useRef(null)
  const projectedPosition = useRef(new Vector3())
  const positionTooltip = useCallback((object, camera, size) => {
    const point = projectedPosition.current.setFromMatrixPosition(object.matrixWorld).project(camera)
    const width = tooltipRef.current?.offsetWidth ?? 190
    const height = tooltipRef.current?.offsetHeight ?? 54
    const margin = 8
    const gap = 20
    // Prefer the left of the marker, clamping the whole label inside the canvas.
    const left = Math.max(margin, Math.min((point.x + 1) * size.width / 2 - width - gap, size.width - width - margin))
    const top = Math.max(margin, Math.min((1 - point.y) * size.height / 2 - height / 2, size.height - height - margin))
    return [left, top]
  }, [])
  const highlighted = inspection && hovered
  const color = infinity ? '#c4b5fd' : '#fde68a'
  const label = type ? type[0].toUpperCase() + type.slice(1) : 'Degenerada'
  return <group position={position}>
    <group scale={markerScale.map(value => value * 0.78)}
      onPointerOver={inspection ? event => { event.stopPropagation(); setHovered(true) } : undefined}
      onPointerOut={inspection ? () => setHovered(false) : undefined}>
      <mesh>
        <sphereGeometry args={[CHARACTERISTIC_POINT_RADIUS, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={highlighted ? 0.85 : 0.35} roughness={0.35} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={19}>
        <torusGeometry args={[CHARACTERISTIC_SELECTED_RING_RADIUS, CHARACTERISTIC_SELECTED_RING_TUBE, 12, 64]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={highlighted ? 1.25 : 0.85} roughness={0.28} metalness={0.15} />
      </mesh>
    </group>
    {highlighted && <Html calculatePosition={positionTooltip} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
      <div ref={tooltipRef} className="rarefaction-singularity-tooltip" role="tooltip"
        style={{ borderColor: color }}>
        {family && <><strong>{family}</strong><br /></>}
        {infinity ? `∞ · ${label}` : `${label} · z=${z.toPrecision(3)}`}
        {infinity && <><br /><small>−∞ ≡ +∞ · mesmo ponto</small></>}
        {details && <><br /><small>Carta {details.chart} · λ = {details.eigenvalues.map(x => x.toPrecision(3)).join(', ')}{details.imaginaryPart > 0 ? ` ± ${details.imaginaryPart.toPrecision(3)}i` : ''}</small>
          <br /><small>J = {details.matrix.map(row => `[${row.map(x => x.toPrecision(3)).join(', ')}]`).join(' ')}</small></>}
      </div>
    </Html>}
  </group>
}
