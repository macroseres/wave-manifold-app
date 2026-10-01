import { useMemo } from 'react'
import { Html, Line } from '@react-three/drei'
import PortraitArrowHeads from './PortraitArrowHeads.jsx'
import RarefactionSingularityMarker from './RarefactionSingularityMarker.jsx'
import { usePhasePortrait } from '../../app/inspection/PhasePortraitContext.js'
import { useGlobalPortrait } from '../../hooks/useGlobalPortrait.js'
import { orientedCompositeEdge } from '../../entities/phasePortrait/compositePortrait.js'
import { waveColors } from '../../config/waveColors.js'
import { physicalPointToVisual, visualTauToPhysical, getTauDisplayMode, getTauDisplayBounds, infinitySingularityVisualTau } from '../../geometry/zCompactification.js'
import { nearRarefactionSingularity } from '../../entities/phasePortrait/rarefactionSingularities.js'

import { buildPortraitArrowPositions, orientedRarefactionFieldEdge } from '../../entities/phasePortrait/portraitArrows.js'

const EMPTY = []
const SEPARATRIX_STABLE_COLOR = '#a78bfa'
const SEPARATRIX_UNSTABLE_COLOR = '#84cc16'

function clipArrowBufferToTauBounds(positions) {
  const bounds = getTauDisplayBounds()
  if (!bounds || !positions?.length) return positions
  const kept = []
  // Each chevron is stored as two line segments: tip,left,tip,right = 12 floats.
  // Keep only heads whose complete geometry lies inside the displayed τ strip.
  for (let i = 0; i + 11 < positions.length; i += 12) {
    const taus = [positions[i], positions[i + 3], positions[i + 6], positions[i + 9]]
    if (taus.every(tau => tau >= bounds.min - 1e-7 && tau <= bounds.max + 1e-7)) {
      for (let j = 0; j < 12; j += 1) kept.push(positions[i + j])
    }
  }
  return new Float32Array(kept)
}
function coloredArrowBuffers(curves, markerScale, orient, allowed) {
  const groups = new Map()
  for (const curve of curves) {
    const color = curve.color ?? (curve.branch === 'slow' ? '#22d3ee' : '#fb7185')
    if (!groups.has(color)) groups.set(color, [])
    groups.get(color).push(curve)
  }
  return [...groups].map(([color, group]) => ({ color,
    positions: clipArrowBufferToTauBounds(buildPortraitArrowPositions(group, markerScale, orient, allowed)) }))
}


function LocalSingularModel({ label, zStar }) {
  return <div style={{ marginTop:8, padding:'7px 8px', border:'1px solid #243447', borderRadius:6, background:'rgba(8,20,34,.72)' }}>
    <div style={{ fontWeight:650 }}>{label}: z*={zStar.toFixed(4)}</div>
    <svg viewBox="0 0 260 82" width="100%" height="82" aria-label={`Modelo local em ${label}`}>
      <line x1="18" y1="41" x2="244" y2="41" stroke="#94a3b8" strokeWidth="1" />
      <line x1="130" y1="8" x2="130" y2="74" stroke="#94a3b8" strokeWidth="1" />
      <line x1="24" y1="41" x2="238" y2="41" stroke="#22d3ee" strokeWidth="4" opacity="0.9" />
      <line x1="130" y1="10" x2="130" y2="72" stroke="#fb7185" strokeWidth="4" opacity="0.9" />
      <text x="224" y="35" fill="#cbd5e1" fontSize="10">ξ=A(z)</text>
      <text x="136" y="15" fill="#cbd5e1" fontSize="10">v̄</text>
      <text x="18" y="57" fill="#67e8f9" fontSize="10">v̄=0</text>
      <text x="137" y="70" fill="#fda4af" fontSize="10">ξ=0</text>
    </svg>
    <div style={{ color:'#94a3b8' }}>Modelo transversal: <b>A(z)v̄=0</b>. Os fatores ū e Y são livres.</div>
  </div>
}

function DegenerateB1C0Chart({ params }) {
  const b2 = Number(params?.b2 ?? 0)
  const disc = Math.sqrt(b2 * b2 + 4)
  const zp = (b2 + disc) / 2
  const zm = (b2 - disc) / 2
  return <Html fullscreen style={{ pointerEvents: 'none' }}>
    <div style={{ position:'absolute', right:22, top:92, width:350, background:'rgba(2,12,24,.94)', border:'1px solid #334155', borderRadius:8, padding:'10px 11px', color:'#e2e8f0', fontSize:11, lineHeight:1.4 }}>
      <div style={{ fontWeight:700, marginBottom:5 }}>b₁=c=0 · estrato singular</div>
      <div>Na carta principal <b>(τ,Y,z)</b>, o ramo regular exibido é <b>Y=0</b>, com ū=A(z)τ e v̄=0.</div>
      <div style={{ color:'#94a3b8', marginTop:5 }}>A(z)=1+b₂z−z². Nos zeros z=z±, τ deixa de parametrizar ū. Mais importante: a variedade característica não é suave nesses conjuntos; portanto não existe uma carta regular que simplesmente complete (τ,Y,z).</div>
      <div style={{ marginTop:6 }}><b>z₋={zm.toFixed(4)}</b> &nbsp;·&nbsp; <b>z₊={zp.toFixed(4)}</b></div>
      <div style={{ color:'#cbd5e1', marginTop:5 }}>Como A'(z±)≠0, usando ξ=A(z), a equação local é <b>ξ v̄=0</b>: dois ramos 3D cruzam-se ao longo de {`{ξ=0, v̄=0}`}, com ū e Y livres.</div>
      <LocalSingularModel label="z₋" zStar={zm} />
      <LocalSingularModel label="z₊" zStar={zp} />
    </div>
  </Html>
}

function PortraitLines({ curves, params, markerScale, composite = false }) {
  const positions = useMemo(() => coloredArrowBuffers(curves, markerScale,
    (a, b) => composite ? orientedCompositeEdge(a, b, params) : orientedRarefactionFieldEdge(a, b, params)),
  [curves, params, markerScale, composite])
  return <group>
    {curves.flatMap((curve, i) => clipVisualPolyline(curve.points.map(p => physicalPointToVisual(p.coords)))
      .map((points, j) => <Line key={`${curve.id ?? i}-${j}`} points={points}
        color={curve.color} lineWidth={composite ? 1.6 : 2} />))}
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

function clipVisualPolyline(points) {
  const bounds = getTauDisplayBounds()
  if (!bounds) return points.length > 1 ? [points] : []
  const { min: tMin, max: tMax } = bounds
  const parts = []
  let part = []
  const pushPart = () => { if (part.length > 1) parts.push(part); part = [] }
  const inside = p => p[0] >= tMin && p[0] <= tMax

  for (let i = 0; i < points.length; i += 1) {
    const p = points[i]
    if (i === 0) {
      if (inside(p)) part.push(p)
      continue
    }
    const a = points[i - 1]
    const b = p
    const aIn = inside(a), bIn = inside(b)
    const cuts = []
    for (const bound of [tMin, tMax]) {
      const da = a[0] - bound, db = b[0] - bound
      if (da * db < 0 && Math.abs(b[0] - a[0]) > 1e-12) {
        const u = (bound - a[0]) / (b[0] - a[0])
        cuts.push([u, [bound, a[1] + u * (b[1] - a[1]), a[2] + u * (b[2] - a[2])]])
      }
    }
    cuts.sort((x, y) => x[0] - y[0])
    if (aIn && bIn) {
      if (!part.length) part.push(a)
      part.push(b)
    } else if (aIn && !bIn) {
      if (!part.length) part.push(a)
      if (cuts.length) part.push(cuts[0][1])
      pushPart()
    } else if (!aIn && bIn) {
      if (cuts.length) part.push(cuts[cuts.length - 1][1])
      part.push(b)
    } else if (cuts.length === 2) {
      part = [cuts[0][1], cuts[1][1]]
      pushPart()
    }
  }
  pushPart()
  return parts
}

export default function RarefactionPhasePortrait({ view, resolution, markerScale = [1, 1, 1] }) {
  const phase = usePhasePortrait()
  const active = phase?.activeView === '3d' && (phase.enabled || phase.compositeEnabled)
  const params = phase?.params
  const structuralB1C0 = Math.abs(params?.b1 ?? 1) < 1e-10 && Math.abs(params?.c ?? 0) < 1e-10
  const tauDisplayMode = getTauDisplayMode()
  // The drawing window is expressed in the selected display τ coordinate.
  // The rarefaction integrator, however, still evolves in the original physical τ.
  // In normalized/centered modes a fixed display rectangle corresponds to a
  // z-dependent physical-τ interval.  Build a computational window large enough
  // to cover the inverse image of the whole displayed rectangle; clipping is
  // applied only after transforming the resulting integral curves back to display.
  const portraitView = useMemo(() => {
    if (tauDisplayMode === 'current') return view
    const zMin = Number.isFinite(view.zMin) ? view.zMin : -12
    const zMax = Number.isFinite(view.zMax) ? view.zMax : 12
    let physicalMin = Infinity, physicalMax = -Infinity
    const samples = 161
    for (let i = 0; i < samples; i += 1) {
      const z = zMin + (zMax - zMin) * i / (samples - 1)
      for (const displayTau of [view.tMin, view.tMax]) {
        const physicalTau = visualTauToPhysical(displayTau, z)
        if (Number.isFinite(physicalTau)) {
          physicalMin = Math.min(physicalMin, physicalTau)
          physicalMax = Math.max(physicalMax, physicalTau)
        }
      }
    }
    if (!Number.isFinite(physicalMin) || !Number.isFinite(physicalMax) || physicalMax <= physicalMin) return view
    const margin = Math.max(0.05, 0.04 * (physicalMax - physicalMin))
    return { ...view, tMin: physicalMin - margin, tMax: physicalMax + margin }
  }, [view, tauDisplayMode])
  const { data, loading, error } = useGlobalPortrait(params, portraitView, resolution, phase?.compositeEnabled, active)
  const singularities = data?.special.singularities ?? EMPTY
  const infinity = data?.special.infinity
  const infinityTau = infinitySingularityVisualTau()
  const centeredInfinitySaddle = tauDisplayMode === 'centered' && infinity?.type === 'sela'
  // In the centered τ* chart, τ*=-T+O(Z), so the eigendirection tangent
  // to Z=0 no longer collapses.  The compactified rectangle is a cut
  // fundamental domain: zHat=-1 and zHat=+1 are two copies of the same
  // projective infinity.  Draw the tangent stable/unstable branches on both
  // copies instead of inventing a finite-z orbit for Z=0.
  const tangentInfinityDirection = centeredInfinitySaddle
    ? infinity?.eigenDirections?.find(direction => Math.abs(direction.vector?.[1] ?? 1) < 1e-10)
    : null
  const tangentInfinityStability = (tangentInfinityDirection?.value ?? 1) < 0 ? 'stable' : 'unstable'
  const tangentInfinityColor = tangentInfinityStability === 'stable' ? SEPARATRIX_STABLE_COLOR : SEPARATRIX_UNSTABLE_COLOR
  const infinityBoundarySeparatrices = centeredInfinitySaddle ? [-1, 1].flatMap(zHat => [
    { id: `inf-boundary-neg-${zHat}`, points: [[view.tMin, 0, zHat], [infinityTau, 0, zHat]] },
    { id: `inf-boundary-pos-${zHat}`, points: [[infinityTau, 0, zHat], [view.tMax, 0, zHat]] },
  ]) : []
  const curves = useMemo(() => {
    // physicalPointToVisual reads the configured display mode globally. Reading
    // tauDisplayMode here makes that rendering dependency explicit to React.
    const leaves = tauDisplayMode ? (data?.leaves ?? []) : []
    return leaves.flatMap(curve =>
      curve.displayParts.flatMap(({ branch, segment }) => clipVisualPolyline(segment.map(p => physicalPointToVisual(p.coords)))
        .map((points, partIndex) => ({ branch, physical: segment, adaptedB1Zero: Boolean(curve.adaptedB1Zero),
          adaptedB1ZeroCZero: Boolean(curve.adaptedB1ZeroCZero), id: `${curve.id ?? branch}-${partIndex}`, points }))))
  }, [data, tauDisplayMode])
  const composites = useMemo(() => (data?.components ?? []).flatMap(component => visibleParts(component.points, view)
    .map((points, i) => ({ id: `${component.componentId}-${i}`, points, color: waveColors.compositeSlow }))), [data, view])
  const separatrices = useMemo(() => (data?.special.separatrices ?? []).flatMap(curve => visibleParts(curve.points, view)
    .map(points => ({ points, color: curve.stability === 'stable' ? SEPARATRIX_STABLE_COLOR : SEPARATRIX_UNSTABLE_COLOR }))), [data, view])
  const compositeSeparatrices = useMemo(() => (data?.compositeSpecial?.separatrices ?? []).flatMap(curve => visibleParts(curve.points, view)
    .map((points, i) => ({ id: `${curve.id}-${i}`, points, color: curve.stability === 'stable' ? SEPARATRIX_STABLE_COLOR : SEPARATRIX_UNSTABLE_COLOR }))), [data, view])
  const compositeAxes = useMemo(() => (data?.compositeSpecial?.eigenDirections ?? []).flatMap(axis => visibleParts(axis.points, view)), [data, view])
  const arrows = useMemo(() => Math.abs(params?.b1 ?? 1) < 1e-10 ? [] : coloredArrowBuffers(curves, markerScale,
    (a, b) => orientedRarefactionFieldEdge(a, b, params),
    point => !nearRarefactionSingularity(point, singularities, view)),
  [curves, markerScale, params, singularities, view])
  if (!active) return null
  return <group>
    {(loading || error) && <Html position={[0, 0, 0]} style={{ pointerEvents: 'none', whiteSpace: 'nowrap', color: '#e2e8f0' }}>{error ?? 'Calculando retrato…'}</Html>}
    {phase.enabled && Math.abs(params?.b1 ?? 1) < 1e-10 && Math.abs(params?.c ?? 0) >= 1e-10 && <Html position={[view.tMin, 0, -0.92]} style={{ pointerEvents: 'none', whiteSpace: 'nowrap', color: '#e2e8f0', background: 'rgba(2,12,24,.78)', padding: '5px 8px', borderRadius: '6px', fontSize: '12px' }}>Carta adaptada: (Θ,Z)=(u,1/z) · Z=0 é regular</Html>}
    {phase.enabled && structuralB1C0 && <DegenerateB1C0Chart params={params} />}
    {phase.enabled && phase.rarefactionOptions.singularities && view.tMin <= infinityTau && view.tMax >= infinityTau && infinity?.visualPositions.map((position, index) => <RarefactionSingularityMarker
      key={`${infinity.id}-${index}-${phase.inspectionModeEnabled}`} position={[infinityTau, position[1], position[2]]} markerScale={markerScale}
      inspection={phase.inspectionModeEnabled} type={infinity.type} details={infinity} infinity
      onInspect={phase.openInfinityChart} />)}
    {phase.enabled && phase.rarefactionOptions.singularities && view.tMin <= 0 && view.tMax >= 0 && singularities.map(s => <RarefactionSingularityMarker
      key={`${s.z}-${phase.inspectionModeEnabled}`} position={physicalPointToVisual(s.coords)} markerScale={markerScale}
      inspection={phase.inspectionModeEnabled} type={s.type} z={s.z} details={s} />)}
    {phase.enabled && !structuralB1C0 && curves.map((curve, i) => <Line key={i} points={curve.points} color={curve.branch === 'slow' ? '#22d3ee' : '#fb7185'} lineWidth={1.5} renderOrder={16} />)}
    {phase.enabled && !structuralB1C0 && data?.special?.intersections?.map((line, i) => <Line key={`deg-int-${i}`} points={line.points.map(p => physicalPointToVisual(p.coords))} color="#f8fafc" dashed dashSize={0.018} gapSize={0.012} lineWidth={2} renderOrder={17} />)}
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
    {phase.enabled && phase.rarefactionOptions.separatrices && centeredInfinitySaddle && infinityBoundarySeparatrices.map(curve =>
      <Line key={curve.id} points={curve.points} color={tangentInfinityColor} lineWidth={2.4} renderOrder={19} />)}
    {phase.enabled && phase.rarefactionOptions.eigenDirections && centeredInfinitySaddle && [-1, 1].map(zHat =>
      <Line key={`inf-axis-${zHat}`} points={[[view.tMin,0,zHat],[view.tMax,0,zHat]]} color="#f8fafc" dashed dashSize={0.015} gapSize={0.012} lineWidth={2} />)}
    {phase.enabled && centeredInfinitySaddle && (phase.rarefactionOptions.separatrices || phase.rarefactionOptions.eigenDirections) &&
      <Html position={[infinityTau, 0, 0.985]} center style={{ pointerEvents:'none', whiteSpace:'nowrap', color:'#cbd5e1', background:'rgba(2,12,24,.78)', border:'1px solid #334155', borderRadius:5, padding:'3px 6px', fontSize:10 }}>
        ẑ=−1 ≡ ẑ=+1 · mesmo infinito projetivo
      </Html>}
    {phase.enabled && phase.rarefactionOptions.eigenDirections && data?.special.eigenDirections.map((axis, i) => axis.points.length > 1 &&
      <Line key={i} points={axis.points.map(p => physicalPointToVisual(p.coords))} color="#f8fafc" dashed dashSize={0.015} gapSize={0.012} lineWidth={2} />)}
    {phase.references.inflection && data?.special.inflections.filter(p => p.t >= view.tMin && p.t <= view.tMax).map((p, i) =>
      <mesh key={i} position={physicalPointToVisual(p.coords)} scale={markerScale.map(s => s * 0.45)}>
        <sphereGeometry args={[0.04, 12, 12]} /><meshBasicMaterial color={waveColors.inflection} />
      </mesh>)}
  </group>
}
