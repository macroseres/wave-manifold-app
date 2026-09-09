import React from 'react'
import MathLabel from './MathLabel'
import StateSpaceCanvas, { SolutionCanvas } from './StateSpaceCanvas'
import ParameterMapView from './ParameterMapView'
import SolutionDiagnosticsPanel from './SolutionDiagnosticsPanel'
import { diagnosticLabel, formatDiagnosticSpeed, formatDiagnosticState } from './solutionDiagnosticsFormat'

export default function OverlayStage({
  activeView,
  params,
  view,
  probeView,
  selectedEntries,
  onSelectCharacteristicPoint,
  showInflectionMinusProjection,
  showInflectionPlusProjection,
  showCoincidence,
  showHysPlusMinusProjection,
  showCoincidenceMinusProjection,
  showRarefactionSlowMinusProjection,
  showCoincidencePlusProjection,
  showRarefactionSlowPlusProjection,
  showHysMinusMinusProjection,
  showHysPlusPlusProjection,
  showHugoniotMinusPlusProjection,
  showHysMinusPlusProjection,
  showHugoniotMinus,
  showDoubleSonicMinusProjection,
  showDoubleSonicPlusProjection,
  showExtensionMinusMinusProjection,
  showExtensionPlusMinusProjection,
  showExtensionMinusPlusProjection,
  showExtensionPlusPlusProjection,
  showExtensionCoincidencePlus,
  inspectionModeEnabled,
  inspectionProbesByBranch,
  inspectionCurveVisibility,
  onMoveInspectionProbe,
  resolution,
  solutionDiagnostics,
  formatNumber,
  parameterMapProps,
}) {
  return (
    <main className="wm-stage-shell">
      <div className="wm-stage-frame">

        {activeView === 'state' ? (
          <div className="wm-stage-content state-view">
            <div className="stage-state-plot">
              <StateSpaceCanvas
                params={params}
                view={view}
                probeView={probeView}
                selectedEntries={selectedEntries}
                onSelectCharacteristicPoint={onSelectCharacteristicPoint}
                showInflectionMinusProjection={showInflectionMinusProjection}
                showInflectionPlusProjection={showInflectionPlusProjection}
                showCoincidence={showCoincidence}
                showHysPlusMinusProjection={showHysPlusMinusProjection}
                showCoincidenceMinusProjection={showCoincidenceMinusProjection}
                showRarefactionSlowMinusProjection={showRarefactionSlowMinusProjection}
                showCoincidencePlusProjection={showCoincidencePlusProjection}
                showRarefactionSlowPlusProjection={showRarefactionSlowPlusProjection}
                showHysMinusMinusProjection={showHysMinusMinusProjection}
                showHysPlusPlusProjection={showHysPlusPlusProjection}
                showHugoniotMinusPlusProjection={showHugoniotMinusPlusProjection}
                showHysMinusPlusProjection={showHysMinusPlusProjection}
                showHugoniotMinus={showHugoniotMinus}
                showDoubleSonicMinusProjection={showDoubleSonicMinusProjection}
                showDoubleSonicPlusProjection={showDoubleSonicPlusProjection}
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
              />
            </div>
          </div>
        ) : null}

        {activeView === 'solution' ? (
          <div className="wm-stage-content solution-view">
            <div className="wm-stage-title inline">Perfil da solução <MathLabel tex={"(x,t=t_0)"} /></div>
            <div className="stage-solution-plot">
              <SolutionCanvas />
            </div>
            <SolutionDiagnosticsPanel
              diagnostics={solutionDiagnostics}
              diagnosticLabel={diagnosticLabel}
              formatDiagnosticSpeed={formatDiagnosticSpeed}
              formatDiagnosticState={(item) => formatDiagnosticState(item, formatNumber)}
            />
          </div>
        ) : null}

        {activeView === 'params' ? <ParameterMapView {...parameterMapProps} /> : null}
      </div>
    </main>
  )
}





