import React from 'react'
import MathLabel from './MathLabel'
import { Section, Toggle } from './PanelPrimitives'

export default function VisualizationControlsPanel({
  clearVisualizationControls,
  clearSelectedState,
  markVisualizationControls,
  setShowAxes,
  setShowBifurcationRight,
  setShowCharacteristic,
  setShowCoincidence,
  setShowCompositeFast,
  setShowCompositeSlow,
  setShowCompositeSaturatedFast,
  setShowCompositeSaturatedSlow,
  setShowDoubleSonic,
  setShowHugoniotMinus,
  setShowHugoniotPlus,
  setShowHysteresis,
  setShowHysteresisLeft,
  setShowHysteresisRight,
  setShowInflectionFast,
  setShowInflectionSlow,
  setShowRarefactionFast,
  setShowRarefactionSlow,
  setShowSaturated,
  setShowSaturatedCoincidence,
  setShowSonicLeft,
  setShowSonicRight,
  showAxes,
  showBifurcationRight,
  showCharacteristic,
  showCoincidence,
  showCompositeFast,
  showCompositeSlow,
  showCompositeSaturatedFast,
  showCompositeSaturatedSlow,
  showDoubleSonic,
  showHugoniotMinus,
  showHugoniotPlus,
  showHysteresis,
  showHysteresisLeft,
  showHysteresisRight,
  showInflectionFast,
  showInflectionSlow,
  showRarefactionFast,
  showRarefactionSlow,
  showSaturated,
  showSaturatedCoincidence,
  showSonicLeft,
  showSonicRight,
  waveColors,
}) {
  return (
      <aside className="wm-left wm-panel">

      <Section title="Controles de visualização" defaultOpen={true} accent="#f97316">
        <div className="toggle-grid">
          <Toggle checked={showAxes} onChange={setShowAxes} label="Eixos" />
          <Toggle checked={showCharacteristic} onChange={setShowCharacteristic} label={<><MathLabel tex={"\\mathcal{C}"} /><span> : Características</span></>} color={waveColors.characteristicFast} />
          <Toggle checked={showCoincidence} onChange={setShowCoincidence} label={<><MathLabel tex={"\\mathcal{E}"} /><span> : Coincidência </span></>} color={waveColors.coincidence} />
          <Toggle checked={showSonicLeft} onChange={setShowSonicLeft} label={<><MathLabel tex={"\\mathcal{S}^-_s"} /><span> / </span><MathLabel tex={"\\mathcal{S}^-_f"} /><span> : Sônica Esquerda</span></>} color={waveColors.sonicLeftSlow} />
          <Toggle checked={showSonicRight} onChange={setShowSonicRight} label={<><MathLabel tex={"\\mathcal{S}^+_s"} /><span> / </span><MathLabel tex={"\\mathcal{S}^+_f"} /><span> : Sônica Direita</span></>} color={waveColors.sonicRightFast} />
          <Toggle checked={showDoubleSonic} onChange={setShowDoubleSonic} label={<><MathLabel tex={"\\mathcal{DS}"} /><span> : Dupla Sônica </span></>} color={waveColors.doubleSonic} />
          <Toggle checked={showInflectionSlow || showInflectionFast} onChange={(checked) => { setShowInflectionSlow(checked); setShowInflectionFast(checked) }} label={<><MathLabel tex={"\\mathcal{J}"} /><span> : Inflexões </span></>} color={waveColors.inflection ?? waveColors.inflectionSlow} />
          <Toggle checked={showHysteresisLeft ?? showHysteresis} onChange={setShowHysteresisLeft ?? setShowHysteresis} label={<><MathLabel tex={"\\operatorname{Hys}^-"} /><span> : Histerese Esquerda</span></>} color={waveColors.hysteresisLeft ?? '#64748b'} />
          <Toggle checked={showHysteresisRight ?? showHysteresis} onChange={setShowHysteresisRight ?? setShowHysteresis} label={<><MathLabel tex={"\\operatorname{Hys}^+"} /><span> : Histerese Direita</span></>} color={waveColors.hysteresisRight ?? '#111827'} />
          <Toggle checked={showBifurcationRight} onChange={setShowBifurcationRight} label={<><MathLabel tex={"\\mathcal{B}^+"} /><span> : Bifurcação Secundária Direita</span></>} color={waveColors.bifurcationRight} />
          <Toggle checked={showSaturated} onChange={setShowSaturated} label={<><MathLabel tex={"\\operatorname{Sat}_-(\\operatorname{Hys}^+)"} /><span> : Saturada de </span><MathLabel tex={"\\operatorname{Hys}^+"} /> por <MathLabel tex={"H_-"} /></>} color="#f97316" />
          <Toggle checked={showSaturatedCoincidence} onChange={setShowSaturatedCoincidence} label={<><MathLabel tex={"\\operatorname{Sat}_-(\\mathcal{E})"} /><span> : Saturada de </span> <MathLabel tex={"\\mathcal{E}"} /> por <MathLabel tex={"H_-"} /></>} color={waveColors.saturatedCoincidence} />
          
          
          
          <div className="visualization-group-title">Família lenta</div>
          <Toggle checked={showHugoniotMinus} onChange={setShowHugoniotMinus} label={<><MathLabel tex={"H_-(U_L)"} /><span> : Hugoniot Forward</span></>} color={waveColors.hugoniotMinus ?? '#0f172a'} />
          <Toggle checked={showRarefactionSlow} onChange={setShowRarefactionSlow} label={<><MathLabel tex={"\\mathcal{R}^-(U_L)"} /><span> : Rarefação Lenta </span></>} color={waveColors.rarefactionSlow} />
          <Toggle checked={showCompositeSlow} onChange={setShowCompositeSlow} label={<><MathLabel tex={"\\mathcal{K}_-(U_L)"} /><span> : Composta Lenta </span></>} color={waveColors.compositeSlow ?? waveColors.composite} />
          <Toggle checked={showCompositeSaturatedSlow} onChange={setShowCompositeSaturatedSlow} label={<><MathLabel tex={"\\operatorname{Sat}_{H_-}(\\mathcal{R}^-)"} /><span> : Superfície saturada lenta </span></>} color={waveColors.compositeSaturatedSlow ?? '#60a5fa'} />
          

          <div className="visualization-group-title">Família rápida</div>
          <Toggle checked={showHugoniotPlus} onChange={setShowHugoniotPlus} label={<><MathLabel tex={"H_+(U_R)"} /><span> : Hugoniot Backward</span></>} color={waveColors.hugoniotPlus ?? '#0f172a'} />
          <Toggle checked={showRarefactionFast} onChange={setShowRarefactionFast} label={<><MathLabel tex={"\\mathcal{R}^+(U_R)"} /><span> : Rarefação Rápida</span></>} color={waveColors.rarefactionFast} />
          <Toggle checked={showCompositeFast} onChange={setShowCompositeFast} label={<><MathLabel tex={"\\mathcal{K}_+(U_R)"} /><span> : Composta Rápida</span></>} color={waveColors.compositeFast ?? waveColors.composite} />
          <Toggle checked={showCompositeSaturatedFast} onChange={setShowCompositeSaturatedFast} label={<><MathLabel tex={"\\operatorname{Sat}_{H_+}(\\mathcal{R}^+)"} /><span> : Superfície saturada rápida</span></>} color={waveColors.compositeSaturatedFast ?? '#f472b6'} />
          
          <div className="visualization-note">As curvas exibidas correspondem às folhas completas das bifolheações ativas.</div>
          <div className="visualization-bulk-actions">
            <button type="button" className="secondary-button visualization-clear-button" onClick={clearVisualizationControls}>Desmarcar todos</button>
            <button type="button" className="secondary-button visualization-clear-button" onClick={markVisualizationControls}>Marcar todos</button>
          </div>
        </div>
      </Section>

      <button onClick={clearSelectedState} className="secondary-button panel-clear-button">Limpar seleções</button>

      
      

    </aside>
  )
}
