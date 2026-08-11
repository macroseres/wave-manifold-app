import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import OrientedArcMarkers from './OrientedArcMarkers'
import { waveColors } from '../../entities/surfaceImplicit'
import { buildShockSegments, validShockPoint } from '../../entities/hugoniot/shockSegments'

export { buildShockSegments }

export default function ShockCurve({
  fixedState,
  anchorPoint,
  params,
  view,
  resolution = 40,
  visible = true,
  color = waveColors.shock,
  lineWidth = 1.35,
  nonLocal = false,
  markerScale = [1, 1, 1],
  onInspectPoint,
  direction = 'forward',
  speedMode = 'decreasing',
  sonicTarget = 'right',
  label = null,
  zMargin = null,
}) {
  const segments = useMemo(() => {
    const samples = Math.max(520, Math.min(900, resolution * 12))
    return buildShockSegments(fixedState, anchorPoint, params, view, samples, {
      expanded: nonLocal,
      useAnchorPoint: nonLocal,
      nonLocal,
      hugoniotDirection: direction,
      speedMode,
      sonicTarget,
      zMargin,
    })
  }, [fixedState, anchorPoint, params, view, resolution, nonLocal, direction, speedMode, sonicTarget, zMargin])

  if (!visible || !fixedState || !anchorPoint || segments.length === 0) return null

  const nonLocalEndpoint = nonLocal
    ? segments
      .map((segment) => segment[segment.length - 1])
      .find((point) => validShockPoint(point))
    : null

  return (
    <group>
      {segments.map((points, idx) => (
        <React.Fragment key={`shock-oriented-${idx}`}>
          <Line
            points={points.map((point) => point.coords)}
            color={color}
            lineWidth={lineWidth}
            dashed
            dashSize={0.035}
            gapSize={0.025}
            renderOrder={9}
          />
          <OrientedArcMarkers
            points={points}
            color={color}
            markerScale={markerScale}
            label={label ?? (nonLocal ? 'arco choque lento não local' : 'arco choque lento local')}
            onHoverEndpoint={onInspectPoint}
          />
        </React.Fragment>
      ))}
      {nonLocalEndpoint ? (
        <mesh
          position={[nonLocalEndpoint.t, nonLocalEndpoint.Y, nonLocalEndpoint.z]}
          scale={markerScale}
          renderOrder={12}
          onContextMenu={(event) => {
            event.preventDefault?.()
            event.nativeEvent?.preventDefault?.()
            event.stopPropagation()
            onInspectPoint?.({
              ...nonLocalEndpoint,
              markerColor: waveColors.sonicRight,
              texLabel: '\\mathcal{S}^+',
            })
          }}
        >
          <sphereGeometry args={[0.04, 24, 24]} />
          <meshStandardMaterial
            color={waveColors.sonicRight}
            emissive={new THREE.Color(waveColors.sonicRight)}
            emissiveIntensity={0.75}
            roughness={0.35}
          />
        </mesh>
      ) : null}
    </group>
  )
}
