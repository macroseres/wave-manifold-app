import React, { useMemo } from 'react'
import { computeRarefactionInflectionPoint } from '../../entities/inflection'
import { BACKWARD_HUGONIOT, FORWARD_HUGONIOT } from '../../entities/hugoniot/directions'
import { waveColors } from '../../config/waveColors'

export { computeRarefactionInflectionPoint }

export default function RarefactionInflectionPoint({
  fixedState,
  params,
  view,
  resolution = 40,
  visible = true,
  branch = 'slow',
  direction = branch === 'fast' ? BACKWARD_HUGONIOT : FORWARD_HUGONIOT,
  color = branch === 'fast' ? (waveColors.inflectionFast ?? '#c0c0c0') : (waveColors.inflectionSlow ?? '#c0c0c0'),
  radius = 0.034,
  markerScale = [1, 1, 1],
}) {
  const point = useMemo(() => computeRarefactionInflectionPoint({
    fixedState,
    params,
    view,
    resolution,
    branch,
    direction,
  }), [fixedState, params, view, resolution, branch, direction])

  if (!visible || !point?.coords) return null

  return (
    <mesh position={point.coords} scale={markerScale} renderOrder={14} frustumCulled={false}>
      <sphereGeometry args={[radius, 24, 18]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} depthTest={false} depthWrite={false} />
    </mesh>
  )
}
