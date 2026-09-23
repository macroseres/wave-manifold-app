import { useCallback, useEffect, useMemo, useRef } from 'react'

import WaveOverlayPanel from './app/panels/WaveOverlayPanel'
import { buildComputationView } from './utils/viewLimits'
import { CURVE_Z_MARGIN } from './config/numerics'
import { useWaveAppState } from './app/state/waveAppState'
import { useCharacteristicSelection } from './app/selection/useCharacteristicSelection'
import { useInspectionController } from './app/inspection/useInspectionController'
import WaveSceneViewport from './app/scene/WaveSceneViewport'

export default function App() {
  const [waveState, waveActions] = useWaveAppState()
  const {
    params,
    view,
    yScale,
    tauScale,
    zScale,
    resolution,
    opacity,
    showAxes,
    showCharacteristic,
    selectedByBranch,
    activeBranch,
    hoveredInspectionPoint,
    hoverTooltipPosition,
    activeView,
    zoomSignal,
    autoRotate3D,
    controlsEnabled,
    draggingCharacteristicPoint,
    frozenSelectedByBranch,
    dragPreviewByBranch,
    inspectionModeEnabled,
    solutionModeEnabled,
    inspectionProbesByBranch,
    inspectionCurveVisibility,
    solutionCurveVisibility,
    solutionArcSamplesByBranch,
  } = waveState

  const {
    setActiveBranch,
    setInspectedCurvePoint,
    setHoveredInspectionPoint,
    setHoverTooltipPosition,
    setControlsEnabled,
    setDraggingCharacteristicPoint,
    setFrozenSelectedByBranch,
    setDragPreviewByBranch,
    setSelectedByBranch,
    setInspectionProbesByBranch,
    setSolutionArcSamplesByBranch,
    setSolutionDiagnostics,
    zoomOut,
    zoomIn,
    clearSelection,
  } = waveActions

  const showWireframe = false
  const showHysteresis = waveState.showHysteresisLeft || waveState.showHysteresisRight
  const visibility = useMemo(() => ({
    showSonicRight: waveState.showSonicRight,
    showSonicLeft: waveState.showSonicLeft,
    showHopfPlus: waveState.showHopfPlus,
    showHopfMinus: waveState.showHopfMinus,
    showSaturated: waveState.showSaturated,
    showSaturatedPlus: waveState.showSaturatedPlus,
    showHysteresisSelfIntersection: waveState.showHysteresisSelfIntersection,
    showLeftHysteresisSelfIntersection: waveState.showLeftHysteresisSelfIntersection,
    showSaturatedCoincidence: waveState.showSaturatedCoincidence,
    showSaturatedCoincidencePlus: waveState.showSaturatedCoincidencePlus,
    showExtensionCoincidenceMinus: waveState.showExtensionCoincidenceMinus,
    showExtensionCoincidencePlus: waveState.showExtensionCoincidencePlus,
    showRarefactionSlow: waveState.showRarefactionSlow,
    showRarefactionFast: waveState.showRarefactionFast,
    showCompositeSlow: waveState.showCompositeSlow,
    showCompositeFast: waveState.showCompositeFast,
    showCompositeSaturatedSlow: waveState.showCompositeSaturatedSlow,
    showCompositeSaturatedFast: waveState.showCompositeSaturatedFast,
    showHugoniotMinus: waveState.showHugoniotMinus,
    showHugoniotPlus: waveState.showHugoniotPlus,
    showHysteresisLeft: waveState.showHysteresisLeft,
    showHysteresisRight: waveState.showHysteresisRight,
    showCoincidence: waveState.showCoincidence,
    showBifurcationLeft: waveState.showBifurcationLeft,
    showSaturatedLeftMinus: waveState.showSaturatedLeftMinus,
    showSaturatedLeftPlus: waveState.showSaturatedLeftPlus,
    showBifurcationRight: waveState.showBifurcationRight,
    showInflectionSlow: waveState.showInflectionSlow,
    showInflectionFast: waveState.showInflectionFast,
    showDoubleSonic: waveState.showDoubleSonic,
  }), [
    waveState.showBifurcationLeft,
    waveState.showSaturatedLeftMinus,
    waveState.showSaturatedLeftPlus,
    waveState.showBifurcationRight,
    waveState.showCoincidence,
    waveState.showCompositeFast,
    waveState.showCompositeSaturatedFast,
    waveState.showCompositeSaturatedSlow,
    waveState.showCompositeSlow,
    waveState.showDoubleSonic,
    waveState.showHugoniotMinus,
    waveState.showHugoniotPlus,
    waveState.showHysteresisLeft,
    waveState.showHysteresisRight,
    waveState.showInflectionFast,
    waveState.showInflectionSlow,
    waveState.showRarefactionFast,
    waveState.showRarefactionSlow,
    waveState.showSaturated,
    waveState.showSaturatedPlus,
    waveState.showHysteresisSelfIntersection,
    waveState.showLeftHysteresisSelfIntersection,
    waveState.showSaturatedCoincidence,
    waveState.showSaturatedCoincidencePlus,
    waveState.showExtensionCoincidenceMinus,
    waveState.showExtensionCoincidencePlus,
    waveState.showSonicLeft,
    waveState.showHopfPlus,
    waveState.showHopfMinus,
    waveState.showSonicRight,
  ])
  const orbitControlsRef = useRef(null)
  const orbitEndTimerRef = useRef(null)
  const isOrbiting3DRef = useRef(false)

  const hasSlowInitialState = Boolean(selectedByBranch?.slow)
  const hasFastInitialState = Boolean(selectedByBranch?.fast)
  const canEnableInspectionMode = hasSlowInitialState || hasFastInitialState
  const canEnableSolutionMode = hasSlowInitialState && hasFastInitialState

  const setInspectionModeEnabledBase = waveActions.setInspectionModeEnabled
  const setInspectionModeEnabled = useCallback((valueOrUpdater) => {
    setInspectionModeEnabledBase((current) => {
      const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(current) : valueOrUpdater
      if (next && !canEnableInspectionMode) return false
      return next
    })
  }, [canEnableInspectionMode, setInspectionModeEnabledBase])

  const setSolutionModeEnabled = useCallback((valueOrUpdater) => {
    const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(solutionModeEnabled) : valueOrUpdater
    if (next && !canEnableSolutionMode) return
    waveActions.setSolutionModeEnabled(Boolean(next))
  }, [canEnableSolutionMode, solutionModeEnabled, waveActions])

  const setOrbitControlsEnabled = useCallback((enabled) => {
    if (orbitControlsRef.current) orbitControlsRef.current.enabled = enabled
    setControlsEnabled((current) => (current === enabled ? current : enabled))
  }, [setControlsEnabled])

  useEffect(() => {
    if (!draggingCharacteristicPoint) return undefined
    const stopDragging = () => {
      setOrbitControlsEnabled(true)
      setDraggingCharacteristicPoint(false)
      setFrozenSelectedByBranch(null)
      setDragPreviewByBranch(null)
    }
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)
    return () => {
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
    }
  }, [draggingCharacteristicPoint, setDragPreviewByBranch, setDraggingCharacteristicPoint, setFrozenSelectedByBranch, setOrbitControlsEnabled])

  useEffect(() => {
    if (!canEnableInspectionMode && inspectionModeEnabled) setInspectionModeEnabledBase(false)
  }, [canEnableInspectionMode, inspectionModeEnabled, setInspectionModeEnabledBase])

  useEffect(() => {
    if (!canEnableSolutionMode && solutionModeEnabled) waveActions.setSolutionModeEnabled(false)
  }, [canEnableSolutionMode, solutionModeEnabled, waveActions])

  const calcView = useMemo(() => buildComputationView(view, CURVE_Z_MARGIN), [view])
  const sceneKey = useMemo(() => JSON.stringify({ params, view, calcView, resolution }), [params, view, calcView, resolution])

  const selection = useCharacteristicSelection({
    params,
    calcView,
    selectedByBranch,
    activeBranch,
    frozenSelectedByBranch,
    dragPreviewByBranch,
    draggingCharacteristicPoint,
    setSelectedByBranch,
    setActiveBranch,
    setInspectedCurvePoint,
    setDraggingCharacteristicPoint,
    setFrozenSelectedByBranch,
    setDragPreviewByBranch,
    setOrbitControlsEnabled,
    clearSelection,
  })

  const inspection = useInspectionController({
    params,
    inspectionModeEnabled,
    draggingCharacteristicPoint,
    inspectionCurveVisibility,
    showHugoniotMinus: waveState.showHugoniotMinus,
    showHugoniotPlus: waveState.showHugoniotPlus,
    showRarefactionSlow: waveState.showRarefactionSlow,
    showRarefactionFast: waveState.showRarefactionFast,
    showCompositeSlow: waveState.showCompositeSlow,
    showCompositeFast: waveState.showCompositeFast,
    showInflectionSlow: waveState.showInflectionSlow,
    showInflectionFast: waveState.showInflectionFast,
    setInspectionProbesByBranch,
    setActiveBranch,
    setInspectedCurvePoint,
    setHoveredInspectionPoint,
    setHoverTooltipPosition,
    isOrbiting3DRef,
  })

  const clearOrbitEndTimer = useCallback(() => {
    if (orbitEndTimerRef.current) {
      clearTimeout(orbitEndTimerRef.current)
      orbitEndTimerRef.current = null
    }
  }, [])

  useEffect(() => () => clearOrbitEndTimer(), [clearOrbitEndTimer])

  const beginOrbiting3D = useCallback(() => {
    clearOrbitEndTimer()
    setHoveredInspectionPoint(null)
    isOrbiting3DRef.current = true
  }, [clearOrbitEndTimer, setHoveredInspectionPoint])

  const finishOrbiting3D = useCallback(() => {
    clearOrbitEndTimer()
    orbitEndTimerRef.current = setTimeout(() => {
      orbitEndTimerRef.current = null
      isOrbiting3DRef.current = false
    }, 240)
  }, [clearOrbitEndTimer])

  const handleInspectionProbeDragChange = useCallback((dragging) => {
    setOrbitControlsEnabled(!dragging)
    setDraggingCharacteristicPoint(dragging)
    if (dragging) setHoveredInspectionPoint(null)
  }, [setDraggingCharacteristicPoint, setHoveredInspectionPoint, setOrbitControlsEnabled])

  const handleExportSnapshot = useCallback(() => {
    const canvas = document.querySelector('.scene-viewport canvas')
    if (!canvas) return

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const link = document.createElement('a')
    link.download = `wave-manifold-${timestamp}.png`

    try {
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Falha ao exportar imagem da variedade:', error)
    }
  }, [])

  const handleScenePointerMove = useCallback((event) => {
    inspection.scenePointerMove(event, hoveredInspectionPoint)
  }, [hoveredInspectionPoint, inspection])

  return (
    <>
      <WaveOverlayPanel
        state={waveState}
        calculationView={calcView}
        actions={waveActions}
        visibility={visibility}
        selection={selection}
        showHysteresis={showHysteresis}
        canEnableInspectionMode={canEnableInspectionMode}
        setInspectionModeEnabled={setInspectionModeEnabled}
        canEnableSolutionMode={canEnableSolutionMode}
        setSolutionModeEnabled={setSolutionModeEnabled}
        onExportSnapshot={handleExportSnapshot}
        onCreateInspectionProbe={inspection.createInspectionProbe}
        onMoveInspectionProbe={inspection.moveInspectionProbe}
      />

      <WaveSceneViewport
        activeView={activeView}
        zoomSignal={zoomSignal}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        view={view}
        calcView={calcView}
        sceneKey={sceneKey}
        params={params}
        resolution={resolution}
        opacity={opacity}
        yScale={yScale}
        tauScale={tauScale}
        zScale={zScale}
        showWireframe={showWireframe}
        controlsEnabled={controlsEnabled}
        orbitControlsRef={orbitControlsRef}
        autoRotate3D={autoRotate3D}
        setAutoRotate3D={waveActions.setAutoRotate3D}
        showAxes={showAxes}
        showCharacteristic={showCharacteristic}
        displayedSelectedByBranch={selection.displayedSelectedByBranch}
        curveEntries={selection.curveEntries}
        solutionModeEnabled={solutionModeEnabled}
        inspectionModeEnabled={inspectionModeEnabled}
        solutionCurveVisibility={solutionCurveVisibility}
        solutionArcSamplesByBranch={solutionArcSamplesByBranch}
        inspectionProbesByBranch={inspectionProbesByBranch}
        inspectionVisibleCurves={inspection.visibleCurves}
        basePointsByBranch={selection.displayedSelectedByBranch}
        draggingCharacteristicPoint={draggingCharacteristicPoint}
        hoverTooltipPosition={hoverTooltipPosition}
        hoveredInspectionPoint={hoveredInspectionPoint}
        visibility={visibility}
        onScenePointerMove={handleScenePointerMove}
        onScenePointerLeave={inspection.scenePointerLeave}
        onSelectCharacteristicPoint={selection.onSelectCharacteristicPoint}
        onCreateInspectionProbe={inspection.createInspectionProbe}
        onInspectPoint={inspection.inspectCurvePoint}
        onMoveSelectedPoint={selection.onMoveSelectedPoint}
        onMarkerDragChange={selection.onMarkerDragChange}
        onMarkerHoverChange={selection.onMarkerHoverChange}
        onHoverPoint={inspection.hoverInspectionPoint}
        onSolutionSnapSamples={setSolutionArcSamplesByBranch}
        onSolutionDiagnostics={setSolutionDiagnostics}
        onInspectionProbeDragChange={handleInspectionProbeDragChange}
        setInspectionProbesByBranch={setInspectionProbesByBranch}
        setOrbitControlsEnabled={setOrbitControlsEnabled}
        beginOrbiting3D={beginOrbiting3D}
        finishOrbiting3D={finishOrbiting3D}
      />
    </>
  )
}


