import React from 'react'
import VisualizationControlsPanel from './VisualizationControlsPanel'
import RightInfoPanel from './RightInfoPanel'
import OverlayTopBar from './OverlayTopBar'
import OverlaySettingsPanel from './OverlaySettingsPanel'
import { AboutCard, HelpCard } from './FloatingInfoCards'
import OverlayStage from './OverlayStage'
import DocumentationViewer from './DocumentationViewer'
import useOverlayPanelController from './useOverlayPanelController'

export default function OverlayPanel(props) {
  const {
    params,
    view,
    calculationView,
    yScale,
    setYScale,
    tScale,
    setTScale,
    zScale,
    setZScale,
    resolution,
    setResolution,
    opacity,
    setOpacity,
    resetParams,
    selectedEntries = [],
    activeView = '3d',
    setActiveView,
    inspectionModeEnabled = false,
    inspectionProbesByBranch = { slow: null, fast: null },
    inspectionCurveVisibility = null,
    onMoveInspectionProbe,
    setInspectionModeEnabled,
    canEnableInspectionMode = false,
    solutionModeEnabled = false,
    setSolutionModeEnabled,
    canEnableSolutionMode = false,
    showInflectionMinusProjection,
    showInflectionPlusProjection,
    showCoincidence,
    showHysPlusMinusProjection,
    showCoincidenceMinusProjection,
    showRarefactionSlowMinusProjection,
    showRarefactionFastMinusProjection,
    showCompositeSlowMinusProjection,
    showCompositeFastMinusProjection,
    showCoincidencePlusProjection,
    showRarefactionSlowPlusProjection,
    showRarefactionFastPlusProjection,
    showCompositeSlowPlusProjection,
    showCompositeFastPlusProjection,
    showHysMinusMinusProjection,
    showHysPlusPlusProjection,
    showHugoniotMinusPlusProjection,
    showHugoniotPlusPlusProjection,
    showHugoniotMinusMinusProjection,
    showHugoniotPlusMinusProjection,
    showHysMinusPlusProjection,
    showHugoniotMinus,
    showDoubleSonicMinusProjection,
    showHysteresisSelfIntersectionMinusProjection,
    showDoubleSonicPlusProjection,
    showHysteresisSelfIntersectionPlusProjection,
    showExtensionMinusMinusProjection,
    showExtensionPlusMinusProjection,
    showExtensionMinusPlusProjection,
    showExtensionPlusPlusProjection,
    showExtensionCoincidencePlus,
    solutionDiagnostics = [],
    onSelectCharacteristicPoint,
    onExportSnapshot,
  } = props

  const controller = useOverlayPanelController(props)

  return (
    <div className="overlay-panel">
      <OverlayTopBar
        activeView={activeView}
        setActiveView={setActiveView}
        activeViewLabel={controller.activeViewLabel}
        activeModeLabel={controller.activeModeLabel}
        activeModeClass={controller.activeModeClass}
        canEnableInspectionMode={canEnableInspectionMode}
        inspectionModeEnabled={inspectionModeEnabled}
        setInspectionModeEnabled={setInspectionModeEnabled}
        canEnableSolutionMode={canEnableSolutionMode}
        solutionModeEnabled={solutionModeEnabled}
        setSolutionModeEnabled={setSolutionModeEnabled}
        onExportSnapshot={onExportSnapshot}
        showHelpPanel={controller.showHelpPanel}
        setShowHelpPanel={controller.setShowHelpPanel}
        showAboutPanel={controller.showAboutPanel}
        setShowAboutPanel={controller.setShowAboutPanel}
        showSettingsPanel={controller.showSettingsPanel}
        setShowSettingsPanel={controller.setShowSettingsPanel}
      />

      <HelpCard
        open={controller.showHelpPanel}
        onClose={() => controller.setShowHelpPanel(false)}
        onOpenDocumentation={() => {
          controller.setShowHelpPanel(false)
          controller.setShowDocumentation(true)
        }}
      />
      <AboutCard open={controller.showAboutPanel} onClose={() => controller.setShowAboutPanel(false)} />
      <DocumentationViewer open={controller.showDocumentation} onClose={() => controller.setShowDocumentation(false)} />

      {controller.showSettingsPanel ? (
        <OverlaySettingsPanel
          schaefferShearerCases={controller.schaefferShearerCases}
          selectedSchaefferShearerCase={controller.selectedSchaefferShearerCase}
          applySchaefferShearerCase={controller.applySchaefferShearerCase}
          displayCoordinateTex={controller.displayCoordinateTex}
          yScale={yScale}
          tScale={tScale}
          zScale={zScale}
          resolution={resolution}
          opacity={opacity}
          setResolution={setResolution}
          setOpacity={setOpacity}
          updateScale={controller.updateScale}
          setYScale={setYScale}
          setTScale={setTScale}
          setZScale={setZScale}
          resetCaseScales={controller.resetCaseScales}
          view={view}
          updateView={controller.updateView}
          resetDrawingView={controller.resetDrawingView}
          onClose={() => controller.setShowSettingsPanel(false)}
        />
      ) : null}

      <OverlayStage
        activeView={activeView}
        params={params}
        view={view}
        probeView={calculationView ?? view}
        selectedEntries={selectedEntries}
        onSelectCharacteristicPoint={onSelectCharacteristicPoint}
        showInflectionMinusProjection={showInflectionMinusProjection}
        showInflectionPlusProjection={showInflectionPlusProjection}
        showCoincidence={showCoincidence}
        showHysPlusMinusProjection={showHysPlusMinusProjection}
        showCoincidenceMinusProjection={showCoincidenceMinusProjection}
        showRarefactionSlowMinusProjection={showRarefactionSlowMinusProjection}
        showRarefactionFastMinusProjection={showRarefactionFastMinusProjection}
        showCompositeSlowMinusProjection={showCompositeSlowMinusProjection}
        showCompositeFastMinusProjection={showCompositeFastMinusProjection}
        showCoincidencePlusProjection={showCoincidencePlusProjection}
        showRarefactionSlowPlusProjection={showRarefactionSlowPlusProjection}
        showRarefactionFastPlusProjection={showRarefactionFastPlusProjection}
        showCompositeSlowPlusProjection={showCompositeSlowPlusProjection}
        showCompositeFastPlusProjection={showCompositeFastPlusProjection}
        showHysMinusMinusProjection={showHysMinusMinusProjection}
        showHysPlusPlusProjection={showHysPlusPlusProjection}
        showHugoniotMinusPlusProjection={showHugoniotMinusPlusProjection}
        showHugoniotPlusPlusProjection={showHugoniotPlusPlusProjection}
        showHugoniotMinusMinusProjection={showHugoniotMinusMinusProjection}
        showHugoniotPlusMinusProjection={showHugoniotPlusMinusProjection}
        showHysMinusPlusProjection={showHysMinusPlusProjection}
        showHugoniotMinus={showHugoniotMinus}
        showDoubleSonicMinusProjection={showDoubleSonicMinusProjection}
        showHysteresisSelfIntersectionMinusProjection={showHysteresisSelfIntersectionMinusProjection}
        showDoubleSonicPlusProjection={showDoubleSonicPlusProjection}
        showHysteresisSelfIntersectionPlusProjection={showHysteresisSelfIntersectionPlusProjection}
        showExtensionMinusMinusProjection={showExtensionMinusMinusProjection}
        showExtensionPlusMinusProjection={showExtensionPlusMinusProjection}
        showExtensionMinusPlusProjection={showExtensionMinusPlusProjection}
        showExtensionPlusPlusProjection={showExtensionPlusPlusProjection}
        showExtensionCoincidencePlus={showExtensionCoincidencePlus}
        inspectionModeEnabled={inspectionModeEnabled}
        inspectionProbesByBranch={inspectionProbesByBranch}
        inspectionCurveVisibility={inspectionCurveVisibility}
        onMoveInspectionProbe={onMoveInspectionProbe}
        resolution={resolution}
        solutionDiagnostics={solutionDiagnostics}
        formatNumber={controller.formatNumber}
        parameterMapProps={{
          parameterWindow: controller.parameterWindow,
          visibleParameterCurves: controller.visibleParameterCurves,
          activeParameterCase: controller.activeParameterCase,
          selectedSchaefferShearerCase: controller.selectedSchaefferShearerCase,
          currentParameterPoint: controller.currentParameterPoint,
          parameterPointBoundsForWindow: controller.parameterPointBoundsForWindow,
          updateParameterPoint: controller.updateParameterPoint,
          parameterAxisX: controller.parameterAxisX,
          parameterAxisY: controller.parameterAxisY,
          setHoveredParameterCase: controller.setHoveredParameterCase,
          updateVisibleParameterCurve: controller.updateVisibleParameterCurve,
          updateParameterWindow: controller.updateParameterWindow,
          resetParameterWindow: controller.resetParameterWindow,
          params,
          updateParam: controller.updateParam,
          resetParams,
        }}
      />

      <RightInfoPanel {...controller.rightInfoPanelProps} />
      <VisualizationControlsPanel {...controller.visualizationPanelProps} />
    </div>
  )
}





