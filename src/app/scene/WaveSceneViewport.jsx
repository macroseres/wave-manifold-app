import React, { memo, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

import Axes from '../../components/scene/Axes'
import InspectionProbes from '../../components/scene/InspectionProbes'
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
      compactifiedZ={entry.branch === 'slow'}
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
      compactifiedZ={entry.branch === 'slow'}
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
  tScale,
  zScale,
  showWireframe,
  controlsEnabled,
  orbitControlsRef,
  autoRotate3D,
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
  const markerScale = useMemo(() => [1 / tScale, 1 / yScale, 1 / zScale], [tScale, yScale, zScale])
  const sceneScale = useMemo(() => [tScale, yScale, zScale], [tScale, yScale, zScale])
  const selectedCharacteristicPoints = useMemo(
    () => Object.values(displayedSelectedByBranch).filter(Boolean),
    [displayedSelectedByBranch],
  )

  return (
    <div className={`scene-viewport ${activeView === '3d' ? 'active' : 'inactive'}`} onPointerMove={onScenePointerMove} onPointerLeave={onScenePointerLeave}>
      <div className="scene-zoom-controls" aria-label="Controles de zoom da visualização 3D">
        <button type="button" aria-label="Afastar visualização 3D" title="Afastar" onClick={zoomOut}>−</button>
        <button type="button" aria-label="Aproximar visualização 3D" title="Aproximar" onClick={zoomIn}>+</button>
      </div>

      <Canvas
        style={{ width: '100%', height: '100%' }}
        onContextMenu={(event) => event.preventDefault()}
        camera={{ position: [5, 5, 5], fov: 50 }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        gl={WEBGL_PERFORMANCE_OPTIONS}
      >
        <CameraZoomController zoomSignal={zoomSignal} />
        <color attach="background" args={['#010B15']} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 6, 8]} intensity={1.0} />
        <directionalLight position={[-4, -5, -6]} intensity={0.35} />

        <AutoRotateGroup autoRotate={activeView === '3d' && autoRotate3D} scale={sceneScale}>
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
              interactive={!solutionModeEnabled || inspectionModeEnabled}
              inspectionMode={inspectionModeEnabled}
              markerInteractive={!inspectionModeEnabled && !solutionModeEnabled}
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

          <ImplicitSurface type="saturated"
            key={`${sceneKey}-saturated`}
            params={params}
            view={view}
            resolution={resolution}
            opacity={opacity}
            wireframe={showWireframe}
            visible={visibility.showSaturated}
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

          <WaveCurve type="hysteresis-left" params={params} view={calcView} resolution={resolution} visible={visibility.showHysteresisLeft} />
          <WaveCurve type="hysteresis-right" params={params} view={calcView} resolution={resolution} visible={visibility.showHysteresisRight} />
          <WaveCurve type="coincidence" view={view} visible={visibility.showCoincidence} />
          <WaveCurve type="secondary-right-bifurcation" params={params} view={calcView} resolution={resolution} visible={visibility.showBifurcationRight} />
          <WaveCurve type="inflection-slow" params={params} view={calcView} resolution={resolution} visible={visibility.showInflectionSlow} />
          <WaveCurve type="inflection-fast" params={params} view={calcView} resolution={resolution} visible={visibility.showInflectionFast} />
          <WaveCurve type="double-sonic" params={params} view={calcView} resolution={resolution} visible={visibility.showDoubleSonic} />

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
          enablePan={false}
          mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: null }}
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
