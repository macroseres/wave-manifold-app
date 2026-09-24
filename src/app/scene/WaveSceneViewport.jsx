import { memo, useMemo, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

import Axes from '../../components/scene/Axes'
import InspectionProbes from '../../components/scene/InspectionProbes'
import RarefactionPhasePortrait from '../../components/scene/RarefactionPhasePortrait.jsx'
import SolutionModeCurves from '../../components/scene/SolutionModeCurves'
import ImplicitSurface from '../../entities/shared/render/ImplicitSurface'
import WaveCurve from '../../entities/shared/render/WaveCurve'
import SceneHoverTooltip from '../diagnostics/SceneHoverTooltip'
import { AutoRotateGroup, CameraZoomController } from './CameraControllers'
import { waveColors } from '../../config/waveColors'

const WEBGL_PERFORMANCE_OPTIONS = {
  preserveDrawingBuffer: false,
  powerPreference: 'high-performance',
  antialias: true,
  stencil: false,
}

function SelectedRarefactionCurves({ curveEntries, params, calcView, resolution, visibility }) {
  return curveEntries.map((entry) => (
    <WaveCurve type="rarefaction"
      key={`rarefaction-selected-${entry.branch}-${entry.seed.t}-${entry.seed.z}`}
      fixedState={entry.seed}
      params={params}
      view={calcView}
      resolution={resolution}
      visible={Boolean(entry.selectedState ?? entry.state) && (entry.branch === 'slow' ? visibility.showRarefactionSlow : visibility.showRarefactionFast)}
      color={entry.branch === 'slow' ? waveColors.rarefactionSlow : waveColors.rarefactionFast}
      lineWidth={entry.lineWidth}
      constrainZ={true}
      direction={entry.direction}
      compactifiedZ={true}
    />
  ))
}

function SelectedCompositeSurfaces({ curveEntries, params, calcView, resolution, opacity, showWireframe, visibility }) {
  return (
    <>
      {curveEntries.map((entry) => (
        <ImplicitSurface type="composite-saturated-slow"
          key={`composite-saturated-slow-${entry.branch}-${entry.seed.t}-${entry.seed.z}`}
          fixedState={entry.seed}
          params={params}
          view={calcView}
          resolution={resolution}
          opacity={opacity}
          wireframe={showWireframe}
          visible={Boolean(entry.selectedState ?? entry.state ?? entry.seed) && entry.branch === 'slow' && visibility.showCompositeSaturatedSlow}
          color={waveColors.compositeSaturatedSlow}
        />
      ))}
      {curveEntries.map((entry) => (
        <ImplicitSurface type="composite-saturated-fast"
          key={`composite-saturated-fast-${entry.branch}-${entry.seed.t}-${entry.seed.z}`}
          fixedState={entry.seed}
          params={params}
          view={calcView}
          resolution={resolution}
          opacity={opacity}
          wireframe={showWireframe}
          visible={Boolean(entry.selectedState ?? entry.state ?? entry.seed) && entry.branch === 'fast' && visibility.showCompositeSaturatedFast}
          color={waveColors.compositeSaturatedFast}
        />
      ))}
    </>
  )
}

function SelectedCompositeCurves({ curveEntries, params, calcView, resolution, visibility }) {
  return (
    <>
      {curveEntries.map((entry) => (
        <WaveCurve type="composite-slow"
          key={`composite-slow-${entry.branch}-${entry.seed.t}-${entry.seed.z}`}
          fixedState={entry.seed}
          params={params}
          view={calcView}
          resolution={resolution}
          visible={Boolean(entry.state) && entry.branch === 'slow' && visibility.showCompositeSlow}
          color={waveColors.compositeSlow ?? waveColors.composite}
          lineWidth={1.35}
        />
      ))}
      {curveEntries.map((entry) => (
        <WaveCurve type="composite-fast"
          key={`composite-fast-${entry.branch}-${entry.seed.t}-${entry.seed.z}`}
          fixedState={entry.seed}
          params={params}
          view={calcView}
          resolution={resolution}
          visible={Boolean(entry.state) && entry.branch === 'fast' && visibility.showCompositeFast}
          color={waveColors.compositeFast ?? waveColors.composite}
          lineWidth={1.35}
        />
      ))}
    </>
  )
}

function SelectedHugoniotCurves({ curveEntries, params, calcView, resolution, markerScale, inspectionModeEnabled, visibility, onInspectPoint, onHoverPoint }) {
  return curveEntries.map((entry) => (
    <WaveCurve type="hugoniot"
      key={`hugoniot-selected-${entry.branch}-${entry.point.t}-${entry.point.z}`}
      fixedState={entry.state}
      direction={entry.direction}
      color={entry.branch === 'slow' ? waveColors.hugoniotMinus : waveColors.hugoniotPlus}
      params={params}
      view={calcView}
      resolution={resolution}
      visible={Boolean(entry.state) && (entry.branch === 'slow' ? visibility.showHugoniotMinus : visibility.showHugoniotPlus)}
      showInspectionPoints={false}
      intersectionGroups={null}
      markerScale={markerScale}
      onInspectPoint={onInspectPoint}
      onHoverPoint={inspectionModeEnabled ? onHoverPoint : null}
      interactive={true}
      compactifiedZ={true}
    />
  ))
}

function WaveSceneViewport({
  activeView,
  zoomSignal,
  zoomIn,
  zoomOut,
  view,
  calcView,
  sceneKey,
  params,
  resolution,
  opacity,
  yScale,
  tauScale,
  zScale,
  showWireframe,
  controlsEnabled,
  orbitControlsRef,
  autoRotate3D,
  setAutoRotate3D,
  showAxes,
  showCharacteristic,
  displayedSelectedByBranch,
  curveEntries,
  solutionModeEnabled,
  inspectionModeEnabled,
  solutionCurveVisibility,
  solutionArcSamplesByBranch,
  inspectionProbesByBranch,
  inspectionVisibleCurves,
  basePointsByBranch,
  draggingCharacteristicPoint,
  hoverTooltipPosition,
  hoveredInspectionPoint,
  visibility,
  onScenePointerMove,
  onScenePointerLeave,
  onSelectCharacteristicPoint,
  onCreateInspectionProbe,
  onInspectPoint,
  onMoveSelectedPoint,
  onMarkerDragChange,
  onMarkerHoverChange,
  onHoverPoint,
  onSolutionSnapSamples,
  onSolutionDiagnostics,
  onInspectionProbeDragChange,
  setInspectionProbesByBranch,
  setOrbitControlsEnabled,
  beginOrbiting3D,
  finishOrbiting3D,
}) {
  const markerScale = useMemo(() => [1 / tauScale, 1 / yScale, 1 / zScale], [tauScale, yScale, zScale])
  const [navigationMode, setNavigationMode] = useState('rotate')
  const setCameraView = (direction) => {
    const controls = orbitControlsRef.current
    if (!controls) return
    const camera = controls.object
    const distance = direction === 'reset' ? Math.sqrt(75) : camera.position.distanceTo(controls.target)
    controls.target.set(0, 0, 0)
    camera.up.set(0, 1, 0)
    const vector = direction === 'front' ? [0, 0, 1] : direction === 'side' ? [1, 0, 0] : direction === 'top' ? [0, 1, 0] : [1, 1, 1]
    if (direction === 'top') camera.up.set(0, 0, -1)
    camera.position.set(...vector).normalize().multiplyScalar(distance)
    camera.lookAt(controls.target)
    controls.update()
  }
  const sceneScale = useMemo(() => [tauScale, yScale, zScale], [tauScale, yScale, zScale])
  const selectedCharacteristicPoints = useMemo(
    () => Object.values(displayedSelectedByBranch).filter(Boolean),
    [displayedSelectedByBranch],
  )

  return (
    <div className={`scene-viewport ${activeView === '3d' ? 'active' : 'inactive'}`} onPointerMove={onScenePointerMove} onPointerLeave={onScenePointerLeave}>
      <div className="scene-navigation-controls" role="toolbar" aria-label="Navegação da variedade de ondas">
        <button type="button" aria-pressed={navigationMode === 'rotate'} onClick={() => setNavigationMode('rotate')} title="Arraste para girar; clique para selecionar pontos">Girar / selecionar</button>
        <button type="button" aria-pressed={navigationMode === 'pan'} onClick={() => setNavigationMode('pan')} title="Arraste para deslocar a vista">Mover vista</button>
        <button type="button" aria-label="Afastar visualização 3D" title="Afastar" onClick={zoomOut}>−</button>
        <button type="button" aria-label="Aproximar visualização 3D" title="Aproximar" onClick={zoomIn}>+</button>
        <button type="button" onClick={() => setCameraView('front')}>Frente</button>
        <button type="button" onClick={() => setCameraView('side')}>Lado</button>
        <button type="button" onClick={() => setCameraView('top')}>Topo</button>
        <button type="button" aria-pressed={autoRotate3D} onClick={() => setAutoRotate3D(!autoRotate3D)}>Rotação</button>
        <button type="button" onClick={() => setCameraView('reset')}>Restaurar vista</button>
      </div>

      <Canvas
        style={{ width: '100%', height: '100%' }}
        onContextMenu={(event) => event.preventDefault()}
        camera={{ position: [5, 5, 5], fov: 50 }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        gl={WEBGL_PERFORMANCE_OPTIONS}
      >
        <CameraZoomController zoomSignal={zoomSignal} controlsRef={orbitControlsRef} />
        <color attach="background" args={['#010B15']} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 6, 8]} intensity={1.0} />
        <directionalLight position={[-4, -5, -6]} intensity={0.35} />

        <AutoRotateGroup autoRotate={activeView === '3d' && autoRotate3D} scale={sceneScale}>
          <RarefactionPhasePortrait view={calcView} resolution={resolution} markerScale={markerScale} />
          {showAxes && <Axes view={view} />}

          {showCharacteristic && (
            <ImplicitSurface type="characteristic"
              view={view}
              opacity={opacity}
              onSelectPoint={onSelectCharacteristicPoint}
              onCreateInspectionProbe={onCreateInspectionProbe}
              onInspectPoint={onInspectPoint}
              onMoveSelectedPoint={onMoveSelectedPoint}
              onMarkerDragChange={onMarkerDragChange}
              onMarkerHoverChange={onMarkerHoverChange}
              selectedPoints={selectedCharacteristicPoints}
              markerScale={markerScale}
              interactive={navigationMode !== 'pan' && (!solutionModeEnabled || inspectionModeEnabled)}
              inspectionMode={inspectionModeEnabled}
              markerInteractive={navigationMode !== 'pan' && !inspectionModeEnabled && !solutionModeEnabled}
            />
          )}

          <SolutionModeCurves
            enabled={solutionModeEnabled}
            entries={curveEntries}
            params={params}
            view={calcView}
            resolution={resolution}
            visibility={solutionCurveVisibility}
            markerScale={markerScale}
            onHoverPoint={onHoverPoint}
            onCreateInspectionProbe={inspectionModeEnabled ? onCreateInspectionProbe : null}
            onSolutionSnapSamples={onSolutionSnapSamples}
            onSolutionDiagnostics={onSolutionDiagnostics}
          />

          <InspectionProbes
            enabled={inspectionModeEnabled}
            pointsByBranch={inspectionProbesByBranch}
            basePointsByBranch={basePointsByBranch}
            setPointsByBranch={setInspectionProbesByBranch}
            params={params}
            view={calcView}
            resolution={resolution}
            markerScale={markerScale}
            sceneScale={sceneScale}
            onDragChange={onInspectionProbeDragChange}
            onHoverPoint={onHoverPoint}
            visibleCurves={inspectionVisibleCurves}
            solutionArcSamplesByBranch={solutionModeEnabled ? solutionArcSamplesByBranch : null}
            freezeComputation={draggingCharacteristicPoint}
            hoverDisabled={draggingCharacteristicPoint}
          />

          {visibility.showSonicRight && (
            <ImplicitSurface type="sonic-right"
              key={sceneKey}
              params={params}
              view={view}
              resolution={resolution}
              opacity={opacity}
              wireframe={showWireframe}
              onInspectPoint={onInspectPoint}
              onHoverPoint={inspectionModeEnabled ? onHoverPoint : null}
              interactive={true}
            />
          )}

          {visibility.showSonicLeft && (
            <ImplicitSurface type="sonic-left"
              key={`${sceneKey}-left`}
              params={params}
              view={view}
              resolution={resolution}
              opacity={opacity}
              wireframe={showWireframe}
              onInspectPoint={onInspectPoint}
              onHoverPoint={inspectionModeEnabled ? onHoverPoint : null}
              interactive={true}
            />
          )}

          <ImplicitSurface type="hopf"
            params={params} view={view} resolution={resolution}
            opacity={opacity} wireframe={showWireframe}
            direction="plus" visible={visibility.showHopfPlus}
          />
          <ImplicitSurface type="hopf"
            params={params} view={view} resolution={resolution}
            opacity={opacity} wireframe={showWireframe}
            direction="minus" visible={visibility.showHopfMinus}
          />
          <ImplicitSurface type="saturated"
            key={`${sceneKey}-saturated`}
            params={params}
            view={view}
            resolution={resolution}
            opacity={opacity}
            wireframe={showWireframe}
            visible={visibility.showSaturated}
          />

          <ImplicitSurface type="saturated"
            key={`${sceneKey}-saturated-plus`}
            params={params}
            view={view}
            resolution={resolution}
            opacity={opacity}
            wireframe={showWireframe}
            direction="plus"
            visible={visibility.showSaturatedPlus}
          />
          <ImplicitSurface type="saturated-coincidence"
            key={`${sceneKey}-saturated-coincidence`}
            params={params}
            view={view}
            resolution={resolution}
            opacity={opacity}
            wireframe={showWireframe}
            visible={visibility.showSaturatedCoincidence}
          />

          <ImplicitSurface type="saturated-coincidence"
            key={`${sceneKey}-saturated-coincidence-plus`}
            params={params}
            view={view}
            resolution={resolution}
            opacity={opacity}
            wireframe={showWireframe}
            direction="plus"
            visible={visibility.showSaturatedCoincidencePlus}
          />

          <WaveCurve type="hysteresis-left" params={params} view={calcView} resolution={resolution} visible={visibility.showHysteresisLeft} />
          <WaveCurve type="hysteresis-right" params={params} view={calcView} resolution={resolution} visible={visibility.showHysteresisRight} />
          <WaveCurve type="coincidence" view={view} visible={visibility.showCoincidence} />
          <WaveCurve type="secondary-left-bifurcation" params={params} view={calcView} resolution={resolution} visible={visibility.showBifurcationLeft} />
          <WaveCurve type="secondary-right-bifurcation" params={params} view={calcView} resolution={resolution} visible={visibility.showBifurcationRight} />
          <ImplicitSurface type="saturated" source="left" direction="minus"
            params={params} view={view} resolution={resolution}
            opacity={opacity} wireframe={showWireframe}
            visible={visibility.showSaturatedLeftMinus}
          />
          <ImplicitSurface type="saturated" source="left" direction="plus"
            params={params} view={view} resolution={resolution}
            opacity={opacity} wireframe={showWireframe}
            visible={visibility.showSaturatedLeftPlus}
          />
          <WaveCurve type="inflection-slow" params={params} view={calcView} resolution={resolution} visible={visibility.showInflectionSlow} />
          <WaveCurve type="inflection-fast" params={params} view={calcView} resolution={resolution} visible={visibility.showInflectionFast} />
          <WaveCurve type="double-sonic" params={params} view={calcView} resolution={resolution} visible={visibility.showDoubleSonic} />
          <WaveCurve type="hysteresis-self-intersection" params={params} view={calcView} visible={visibility.showHysteresisSelfIntersection} />
          <WaveCurve type="hysteresis-self-intersection" source="left" direction="plus" params={params} view={calcView} visible={visibility.showLeftHysteresisSelfIntersection} />
          <WaveCurve type="extension-coincidence-minus" params={params} view={calcView} visible={visibility.showExtensionCoincidenceMinus} />
          <WaveCurve type="extension-coincidence-plus" params={params} view={calcView} visible={visibility.showExtensionCoincidencePlus} />

          <SelectedRarefactionCurves curveEntries={curveEntries} params={params} calcView={calcView} resolution={resolution} visibility={visibility} />
          <SelectedCompositeSurfaces curveEntries={curveEntries} params={params} calcView={calcView} resolution={resolution} opacity={opacity} showWireframe={showWireframe} visibility={visibility} />
          <SelectedCompositeCurves curveEntries={curveEntries} params={params} calcView={calcView} resolution={resolution} visibility={visibility} />
          <SelectedHugoniotCurves
            curveEntries={curveEntries}
            params={params}
            calcView={calcView}
            resolution={resolution}
            markerScale={markerScale}
            inspectionModeEnabled={inspectionModeEnabled}
            visibility={visibility}
            onInspectPoint={onInspectPoint}
            onHoverPoint={onHoverPoint}
          />
        </AutoRotateGroup>

        <OrbitControls
          ref={orbitControlsRef}
          enabled={controlsEnabled}
          target={[0, 0, 0]}
          enableDamping={true}
          dampingFactor={0.16}
          enablePan={true}
          mouseButtons={{ LEFT: navigationMode === 'pan' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: null }}
          onStart={() => {
            if (draggingCharacteristicPoint) {
              setOrbitControlsEnabled(false)
              return
            }
            beginOrbiting3D()
          }}
          onEnd={finishOrbiting3D}
        />
      </Canvas>

      <SceneHoverTooltip point={hoveredInspectionPoint} position={hoverTooltipPosition} params={params} />
    </div>
  )
}

export default memo(WaveSceneViewport)



