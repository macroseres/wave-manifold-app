import { useMemo } from 'react'
import { Html, Line } from '@react-three/drei'
import RarefactionSingularityMarker from './RarefactionSingularityMarker.jsx'
import { usePhasePortrait } from '../../app/inspection/PhasePortraitContext.js'
import { useGlobalPortrait } from '../../hooks/useGlobalPortrait.js'
import { orientedCompositeEdge } from '../../entities/phasePortrait/compositePortrait.js'
import { waveColors } from '../../config/waveColors.js'
import { physicalPointToVisual } from '../../geometry/zCompactification.js'
import { nearRarefactionSingularity } from '../../entities/phasePortrait/rarefactionSingularities.js'

const EMPTY = []

function PortraitLines({ curves, params, composite = false }) {
  const positions = useMemo(() => {
    const vertices = []
    for (const { points } of curves) {
      const step = Math.max(1, Math.floor(points.length / 3))
      for (let i = step; i < points.length - 1; i += step) {
        const edge = composite ? orientedCompositeEdge(points[i], points[i + 1], params) : [points[i], points[i + 1]]
        if (!edge) continue
        const [p, q] = edge.map(p => physicalPointToVisual(p.coords))
        const d = q.map((x, j) => x - p[j]), norm = Math.hypot(...d)
        if (norm < 1e-10) continue
        const side = Math.hypot(d[0], d[2]) > 1e-10 ? [d[2], 0, -d[0]] : [1, 0, 0]
        const sideNorm = Math.hypot(...side)
        for (const sign of [-1, 1]) vertices.push(...p, ...p.map((x, j) => x - 0.045 * d[j] / norm + sign * 0.02 * side[j] / sideNorm))
      }
    }
    return new Float32Array(vertices)
  }, [curves, params, composite])
  return <group>
    {curves.map((curve, i) => <Line key={curve.id ?? i} points={curve.points.map(p => physicalPointToVisual(p.coords))}
      color={curve.color} lineWidth={composite ? 1.6 : 2} />)}
    <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><lineBasicMaterial color="#f8fafc" /></lineSegments>
  </group>
}

// Only split for display; retain full component arrays and their metadata.
function visibleParts(points, view) {
  const parts = []
  let part = []
  for (const p of points) {
    if (p.t >= view.tMin && p.t <= view.tMax && p.Y >= view.yMin && p.Y <= view.yMax) part.push(p)
    else { if (part.length > 1) parts.push(part); part = [] }
  }
  if (part.length > 1) parts.push(part)
  return parts
}

export default function RarefactionPhasePortrait({ view, resolution, markerScale = [1, 1, 1] }) {
  const phase = usePhasePortrait()
  const active = phase?.activeView === '3d' && (phase.enabled || phase.compositeEnabled)
  const params = phase?.params
  const { data, loading, error } = useGlobalPortrait(params, view, resolution, phase?.compositeEnabled, active)
  const singularities = data?.special.singularities ?? EMPTY
  const infinity = data?.special.infinity
  const curves = useMemo(() => (data?.leaves ?? []).flatMap(curve =>
    curve.displayParts.map(({ branch, segment }) => ({ branch, physical: segment,
      points: segment.map(p => physicalPointToVisual(p.coords)) }))), [data])
  const composites = useMemo(() => (data?.components ?? []).flatMap(component => visibleParts(component.points, view)
    .map((points, i) => ({ id: `${component.componentId}-${i}`, points, color: waveColors.compositeSlow }))), [data, view])
  const separatrices = useMemo(() => (data?.special.separatrices ?? []).flatMap(curve => visibleParts(curve.points, view)
    .map(points => ({ points, color: curve.stability === 'stable' ? '#60a5fa' : '#fbbf24' }))), [data, view])
  // Two arrowheads per segment, aggregated into a single line-segment buffer.
  const arrows = useMemo(() => {
    const vertices = []
    for (const { points, physical } of curves) for (const fraction of [0.35, 0.7]) {
      const i = Math.floor((points.length - 1) * fraction)
      if (!physical[i] || !physical[i + 1]) continue
      if (nearRarefactionSingularity(physical[i], singularities, view)
        || nearRarefactionSingularity(physical[i + 1], singularities, view)) continue
      // Preserve the orientation of the continuous integral curve itself.
      // Crossing the coincidence changes only the rendered family/color; it
      // must not reverse the arrow direction.
      // The portrait is a single vector field on all of C.  The slow/fast
      // label is only a color mask, so it must never decide arrow direction.
      // Use one global orientation for the integral foliation: increasing
      // physical z.  This remains unchanged when a curve crosses coincidence.
      const a = physical[i]
      const b = physical[i + 1]
      const [from, to] = b.z >= a.z ? [a, b] : [b, a]
      const p = physicalPointToVisual(from.coords)
      const q = physicalPointToVisual(to.coords)
      const dx = q[0] - p[0], dz = q[2] - p[2], norm = Math.hypot(dx, dz)
      if (norm < 1e-10) continue
      const size = 0.045
      for (const sign of [-1, 1]) vertices.push(...p,
        p[0] - size * dx / norm + sign * size * 0.45 * dz / norm, p[1],
        p[2] - size * dz / norm - sign * size * 0.45 * dx / norm)
    }
    return new Float32Array(vertices)
  }, [curves, singularities, view])
  if (!active) return null
  return <group>
    {(loading || error) && <Html position={[0, 0, 0]} style={{ pointerEvents: 'none', whiteSpace: 'nowrap', color: '#e2e8f0' }}>{error ?? 'Calculando retrato…'}</Html>}
    {phase.rarefactionOptions.singularities && view.tMin <= 0 && view.tMax >= 0 && infinity?.visualPositions.map((position, index) => <RarefactionSingularityMarker
      key={`${infinity.id}-${index}-${phase.inspectionModeEnabled}`} position={position} markerScale={markerScale}
      inspection={phase.inspectionModeEnabled} type={infinity.type} details={infinity} infinity />)}
    {phase.rarefactionOptions.singularities && view.tMin <= 0 && view.tMax >= 0 && singularities.map(s => <RarefactionSingularityMarker
      key={`${s.z}-${phase.inspectionModeEnabled}`} position={physicalPointToVisual(s.coords)} markerScale={markerScale}
      inspection={phase.inspectionModeEnabled} type={s.type} z={s.z} details={s} />)}
    {phase.enabled && curves.map((curve, i) => <Line key={i} points={curve.points} color={curve.branch === 'slow' ? '#22d3ee' : '#fb7185'} lineWidth={1.5} renderOrder={16} />)}
    {phase.enabled && <lineSegments>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[arrows, 3]} /></bufferGeometry>
      <lineBasicMaterial color="#e2e8f0" />
    </lineSegments>}
    {phase.compositeEnabled && <PortraitLines curves={composites} params={params} composite />}
    {phase.rarefactionOptions.separatrices && <PortraitLines curves={separatrices} params={params} />}
    {phase.rarefactionOptions.eigenDirections && data?.special.eigenDirections.map((axis, i) => axis.points.length > 1 &&
      <Line key={i} points={axis.points.map(p => physicalPointToVisual(p.coords))} color="#f8fafc" dashed dashSize={0.015} gapSize={0.012} lineWidth={2} />)}
    {phase.references.inflection && data?.special.inflections.filter(p => p.t >= view.tMin && p.t <= view.tMax).map((p, i) =>
      <mesh key={i} position={physicalPointToVisual(p.coords)} scale={markerScale.map(s => s * 0.45)}>
        <sphereGeometry args={[0.04, 12, 12]} /><meshBasicMaterial color={waveColors.inflection} />
      </mesh>)}
  </group>
}
