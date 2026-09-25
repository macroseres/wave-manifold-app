import { useMemo } from 'react'
import { Html, Line } from '@react-three/drei'
import PortraitArrowHeads from './PortraitArrowHeads.jsx'
import RarefactionSingularityMarker from './RarefactionSingularityMarker.jsx'
import { usePhasePortrait } from '../../app/inspection/PhasePortraitContext.js'
import { useGlobalPortrait } from '../../hooks/useGlobalPortrait.js'
import { orientedCompositeEdge } from '../../entities/phasePortrait/compositePortrait.js'
import { waveColors } from '../../config/waveColors.js'
import { physicalPointToVisual } from '../../geometry/zCompactification.js'
import { nearRarefactionSingularity } from '../../entities/phasePortrait/rarefactionSingularities.js'

import { buildPortraitArrowPositions, orientedRarefactionFieldEdge } from '../../entities/phasePortrait/portraitArrows.js'

const EMPTY = []
function coloredArrowBuffers(curves, markerScale, orient, allowed) {
  const groups = new Map()
  for (const curve of curves) {
    const color = curve.color ?? (curve.branch === 'slow' ? '#22d3ee' : '#fb7185')
    if (!groups.has(color)) groups.set(color, [])
    groups.get(color).push(curve)
  }
  return [...groups].map(([color, group]) => ({ color,
    positions: buildPortraitArrowPositions(group, markerScale, orient, allowed) }))
}

function PortraitLines({ curves, params, markerScale, composite = false }) {
  const positions = useMemo(() => coloredArrowBuffers(curves, markerScale,
    (a, b) => composite ? orientedCompositeEdge(a, b, params) : orientedRarefactionFieldEdge(a, b, params)),
  [curves, params, markerScale, composite])
  return <group>
    {curves.map((curve, i) => <Line key={curve.id ?? i} points={curve.points.map(p => physicalPointToVisual(p.coords))}
      color={curve.color} lineWidth={composite ? 1.6 : 2} />)}
    {positions.map(arrow => <PortraitArrowHeads key={arrow.color} {...arrow} markerScale={markerScale} />)}
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
  const compositeSeparatrices = useMemo(() => (data?.compositeSpecial?.separatrices ?? []).flatMap(curve => visibleParts(curve.points, view)
    .map((points, i) => ({ id: `${curve.id}-${i}`, points, color: curve.stability === 'stable' ? '#60a5fa' : '#fbbf24' }))), [data, view])
  const compositeAxes = useMemo(() => (data?.compositeSpecial?.eigenDirections ?? []).flatMap(axis => visibleParts(axis.points, view)), [data, view])
  const arrows = useMemo(() => coloredArrowBuffers(curves, markerScale,
    (a, b) => orientedRarefactionFieldEdge(a, b, params),
    point => !nearRarefactionSingularity(point, singularities, view)),
  [curves, markerScale, params, singularities, view])
  if (!active) return null
  return <group>
    {(loading || error) && <Html position={[0, 0, 0]} style={{ pointerEvents: 'none', whiteSpace: 'nowrap', color: '#e2e8f0' }}>{error ?? 'Calculando retrato…'}</Html>}
    {phase.enabled && phase.rarefactionOptions.singularities && view.tMin <= 0 && view.tMax >= 0 && infinity?.visualPositions.map((position, index) => <RarefactionSingularityMarker
      key={`${infinity.id}-${index}-${phase.inspectionModeEnabled}`} position={position} markerScale={markerScale}
      inspection={phase.inspectionModeEnabled} type={infinity.type} details={infinity} infinity />)}
    {phase.enabled && phase.rarefactionOptions.singularities && view.tMin <= 0 && view.tMax >= 0 && singularities.map(s => <RarefactionSingularityMarker
      key={`${s.z}-${phase.inspectionModeEnabled}`} position={physicalPointToVisual(s.coords)} markerScale={markerScale}
      inspection={phase.inspectionModeEnabled} type={s.type} z={s.z} details={s} />)}
    {phase.enabled && curves.map((curve, i) => <Line key={i} points={curve.points} color={curve.branch === 'slow' ? '#22d3ee' : '#fb7185'} lineWidth={1.5} renderOrder={16} />)}
    {phase.enabled && arrows.map(arrow => <PortraitArrowHeads key={arrow.color} {...arrow} markerScale={markerScale} />)}
    {phase.compositeEnabled && <PortraitLines curves={composites} params={params} markerScale={markerScale} composite />}
    {phase.compositeEnabled && phase.compositeOptions.singularities && data?.compositeSpecial?.singularities
      .filter(s => s.t >= view.tMin && s.t <= view.tMax && s.Y >= view.yMin && s.Y <= view.yMax)
      .flatMap(s => (s.visualPositions ?? [physicalPointToVisual(s.coords)]).map((position, i) => <RarefactionSingularityMarker
        key={`${s.id}-${i}`} position={position} markerScale={markerScale} inspection={phase.inspectionModeEnabled}
        family="Composta K₋ · S⁻" type={s.type} z={s.z} details={s} infinity={s.chart === 'infinity'} />))}
    {phase.compositeEnabled && phase.compositeOptions.separatrices && <PortraitLines curves={compositeSeparatrices} params={params} markerScale={markerScale} composite />}
    {phase.compositeEnabled && phase.compositeOptions.eigenDirections && compositeAxes.map((points, i) =>
      <Line key={`K-axis-${i}`} points={points.map(p => physicalPointToVisual(p.coords))} color="#f8fafc" dashed dashSize={0.015} gapSize={0.012} lineWidth={2} />)}
    {phase.compositeEnabled && data?.compositeSpecial?.unsupported && <Html position={[0, 0, 0]} style={{ color: '#fbbf24', pointerEvents: 'none' }}>Diagnóstico de singularidades indisponível neste parâmetro degenerado.</Html>}
    {phase.enabled && phase.rarefactionOptions.separatrices && <PortraitLines curves={separatrices} params={params} markerScale={markerScale} />}
    {phase.enabled && phase.rarefactionOptions.eigenDirections && data?.special.eigenDirections.map((axis, i) => axis.points.length > 1 &&
      <Line key={i} points={axis.points.map(p => physicalPointToVisual(p.coords))} color="#f8fafc" dashed dashSize={0.015} gapSize={0.012} lineWidth={2} />)}
    {phase.references.inflection && data?.special.inflections.filter(p => p.t >= view.tMin && p.t <= view.tMax).map((p, i) =>
      <mesh key={i} position={physicalPointToVisual(p.coords)} scale={markerScale.map(s => s * 0.45)}>
        <sphereGeometry args={[0.04, 12, 12]} /><meshBasicMaterial color={waveColors.inflection} />
      </mesh>)}
  </group>
}
