import React from 'react'
import MathLabel from './MathLabel'
import { Section, Toggle } from './PanelPrimitives'

export default function VisualizationControlsPanel({
  activeView = '3d',
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
  setShowDoubleSonicMinusProjection,
  setShowHysteresisSelfIntersectionMinusProjection,
  setShowDoubleSonicPlusProjection,
  setShowHysteresisSelfIntersectionPlusProjection,
  setShowExtensionMinusMinusProjection,
  setShowExtensionPlusMinusProjection,
  setShowExtensionMinusPlusProjection,
  setShowExtensionPlusPlusProjection,
  setShowInflectionMinusProjection,
  setShowInflectionPlusProjection,
  setShowHysPlusMinusProjection,
  setShowCoincidenceMinusProjection,
  setShowRarefactionSlowMinusProjection,
  setShowRarefactionFastMinusProjection,
  setShowCompositeSlowMinusProjection,
  setShowCompositeFastMinusProjection,
  setShowCoincidencePlusProjection,
  setShowRarefactionSlowPlusProjection,
  setShowRarefactionFastPlusProjection,
  setShowCompositeSlowPlusProjection,
  setShowCompositeFastPlusProjection,
  setShowHysMinusMinusProjection,
  setShowHysPlusPlusProjection,
  setShowHugoniotMinusPlusProjection,
  setShowHugoniotPlusPlusProjection,
  setShowHugoniotMinusMinusProjection,
  setShowHugoniotPlusMinusProjection,
  setShowHysMinusPlusProjection,
  setShowSaturatedPlus,
  setShowHysteresisSelfIntersection,
  setShowSaturatedCoincidence,
  setShowSaturatedCoincidencePlus,
  setShowExtensionCoincidenceMinus,
  setShowExtensionCoincidencePlus,
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
  showDoubleSonicMinusProjection,
  showHysteresisSelfIntersectionMinusProjection,
  showDoubleSonicPlusProjection,
  showHysteresisSelfIntersectionPlusProjection,
  showExtensionMinusMinusProjection,
  showExtensionPlusMinusProjection,
  showExtensionMinusPlusProjection,
  showExtensionPlusPlusProjection,
  showInflectionMinusProjection,
  showInflectionPlusProjection,
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
  showSaturatedPlus,
  showHysteresisSelfIntersection,
  showSaturatedCoincidence,
  showSaturatedCoincidencePlus,
  showExtensionCoincidenceMinus,
  showExtensionCoincidencePlus,
  showSonicLeft,
  showSonicRight,
  waveColors,
}) {
  return (
      <aside className="wm-left wm-panel">

      <div className="wm-panel-kicker">{activeView === 'state' ? 'Projeções' : 'Camadas da cena'}</div>
      <div className="wm-panel-intro">{activeView === 'state' ? 'Escolha as projeções para visualizar no espaço de estados.' : 'Escolha as superfícies e curvas da variedade de ondas.'}</div>
      {activeView === 'state' && (
      <>
      <Section title={<>Projeções <MathLabel tex="\pi_-" /></>} defaultOpen={true} accent="#fde047">
        <div className="toggle-grid">
          <Toggle checked={showCoincidenceMinusProjection} onChange={setShowCoincidenceMinusProjection} label={<MathLabel tex="\pi_-(E)" />} color={waveColors.coincidence} />
          <Toggle checked={showRarefactionSlowMinusProjection} onChange={setShowRarefactionSlowMinusProjection} label={<MathLabel tex="\pi_-(R_-(U_L))" />} color={waveColors.rarefactionSlow} />
          <Toggle checked={showRarefactionFastMinusProjection} onChange={setShowRarefactionFastMinusProjection} label={<MathLabel tex="\pi_-(R_+(U_R))" />} color={waveColors.rarefactionFast} />
          <Toggle checked={showCompositeSlowMinusProjection} onChange={setShowCompositeSlowMinusProjection} label={<MathLabel tex="\pi_-(K_-(U_L))" />} color={waveColors.compositeSlow} />
          <Toggle checked={showCompositeFastMinusProjection} onChange={setShowCompositeFastMinusProjection} label={<MathLabel tex="\pi_-(K_+(U_R))" />} color={waveColors.compositeFast} />
          <Toggle checked={showDoubleSonicMinusProjection} onChange={setShowDoubleSonicMinusProjection} label={<><MathLabel tex={"\\pi_-(\\mathcal{DS})"} /><span> : Dupla sônica</span></>} color={waveColors.doubleSonic} />
          <Toggle checked={showHugoniotMinusMinusProjection} onChange={setShowHugoniotMinusMinusProjection} label={<MathLabel tex="\pi_-(H_-(U_L))" />} color={waveColors.hugoniotMinus} />
          <Toggle checked={showHugoniotPlusMinusProjection} onChange={setShowHugoniotPlusMinusProjection} label={<MathLabel tex="\pi_-(H_+(U_R))" />} color={waveColors.hugoniotPlus} />
          <Toggle checked={showHysteresisSelfIntersectionMinusProjection} onChange={setShowHysteresisSelfIntersectionMinusProjection} label={<><MathLabel tex={"\\pi_-(\\operatorname{sat}_{-}^{*}(\\operatorname{Hys}^{+}))"} /><span> : Autointerseção</span></>} color={waveColors.hysteresisSelfIntersection} />
          <Toggle checked={showExtensionMinusMinusProjection} onChange={setShowExtensionMinusMinusProjection} label={<><MathLabel tex={"\\pi_-(\\operatorname{ext}_-(\\mathcal{E}))"} /><span> : Inclusão na coincidência</span></>} color={waveColors.extensionCoincidenceMinus} />
          <Toggle checked={showExtensionPlusMinusProjection} onChange={setShowExtensionPlusMinusProjection} label={<><MathLabel tex={"\\pi_-(\\operatorname{ext}_+(\\mathcal{E}))"} /><span> : Projeção da extensão</span></>} color={waveColors.extensionCoincidencePlus} />
          <Toggle checked={showInflectionMinusProjection} onChange={setShowInflectionMinusProjection} label={<MathLabel tex={"\\pi_-(\\mathcal{J})"} />} color={waveColors.inflection} />
          <Toggle checked={showHysPlusMinusProjection} onChange={setShowHysPlusMinusProjection} label={<><MathLabel tex={"\\pi_-(\\operatorname{Hys}^+)"} /><span> : Projeção no espaço de estados</span></>} color={waveColors.hysPlusMinusProjection} />
          <Toggle checked={showHysMinusMinusProjection} onChange={setShowHysMinusMinusProjection} label={<><MathLabel tex={"\\pi_-(\\operatorname{Hys}^-)"} /><span> : Projeção no espaço de estados</span></>} color={waveColors.hysMinusMinusProjection} />
        </div>
      </Section>
      <Section title={<>Projeções <MathLabel tex="\pi_+" /></>} defaultOpen={true} accent="#f472b6">
        <div className="toggle-grid">
          <Toggle checked={showHugoniotMinusPlusProjection} onChange={setShowHugoniotMinusPlusProjection} label={<MathLabel tex="\pi_+(H_-(U_L))" />} color={waveColors.hugoniotMinus} />
          <Toggle checked={showHugoniotPlusPlusProjection} onChange={setShowHugoniotPlusPlusProjection} label={<MathLabel tex="\pi_+(H_+(U_R))" />} color={waveColors.hugoniotPlus} />
          <Toggle checked={showCoincidencePlusProjection} onChange={setShowCoincidencePlusProjection} label={<MathLabel tex="\pi_+(E)" />} color={waveColors.coincidence} />
          <Toggle checked={showRarefactionSlowPlusProjection} onChange={setShowRarefactionSlowPlusProjection} label={<MathLabel tex="\pi_+(R_-(U_L))" />} color={waveColors.rarefactionSlow} />
          <Toggle checked={showRarefactionFastPlusProjection} onChange={setShowRarefactionFastPlusProjection} label={<MathLabel tex="\pi_+(R_+(U_R))" />} color={waveColors.rarefactionFast} />
          <Toggle checked={showCompositeSlowPlusProjection} onChange={setShowCompositeSlowPlusProjection} label={<MathLabel tex="\pi_+(K_-(U_L))" />} color={waveColors.compositeSlow} />
          <Toggle checked={showCompositeFastPlusProjection} onChange={setShowCompositeFastPlusProjection} label={<MathLabel tex="\pi_+(K_+(U_R))" />} color={waveColors.compositeFast} />
          <Toggle checked={showDoubleSonicPlusProjection} onChange={setShowDoubleSonicPlusProjection} label={<><MathLabel tex={"\\pi_+(\\mathcal{DS})"} /><span> : Dupla sônica</span></>} color={waveColors.doubleSonic} />
          <Toggle checked={showHysteresisSelfIntersectionPlusProjection} onChange={setShowHysteresisSelfIntersectionPlusProjection} label={<><MathLabel tex={"\\pi_+(\\operatorname{sat}_{-}^{*}(\\operatorname{Hys}^{+}))"} /><span> : Autointerseção</span></>} color={waveColors.hysteresisSelfIntersection} />
          <Toggle checked={showExtensionMinusPlusProjection} onChange={setShowExtensionMinusPlusProjection} label={<><MathLabel tex={"\\pi_+(\\operatorname{ext}_-(\\mathcal{E}))"} /><span> : Projeção da extensão</span></>} color={waveColors.extensionCoincidenceMinus} />
          <Toggle checked={showExtensionPlusPlusProjection} onChange={setShowExtensionPlusPlusProjection} label={<><MathLabel tex={"\\pi_+(\\operatorname{ext}_+(\\mathcal{E}))"} /><span> : Inclusão na coincidência</span></>} color={waveColors.extensionCoincidencePlus} />
          <Toggle checked={showInflectionPlusProjection} onChange={setShowInflectionPlusProjection} label={<MathLabel tex={"\\pi_+(\\mathcal{J})"} />} color={waveColors.inflection} />
          <Toggle checked={showHysPlusPlusProjection} onChange={setShowHysPlusPlusProjection} label={<><MathLabel tex={"\\pi_+(\\operatorname{Hys}^+)"} /><span> : Projeção no espaço de estados</span></>} color={waveColors.hysPlusPlusProjection} />
          <Toggle checked={showHysMinusPlusProjection} onChange={setShowHysMinusPlusProjection} label={<><MathLabel tex={"\\pi_+(\\operatorname{Hys}^-)"} /><span> : Projeção no espaço de estados</span></>} color={waveColors.hysMinusPlusProjection} />
        </div>
      </Section>
      </>
      )}
      {activeView !== 'state' && (<>
      <Section title="Referências geométricas" defaultOpen={true} accent="#38bdf8">
        <div className="toggle-grid">
          <Toggle checked={showAxes} onChange={setShowAxes} label="Eixos" />
          <Toggle checked={showCharacteristic} onChange={setShowCharacteristic} label={<><MathLabel tex={"\\mathcal{C}"} /><span> : Características</span></>} color={waveColors.characteristicFast} />
          <Toggle checked={showCoincidence} onChange={setShowCoincidence} label={<><MathLabel tex={"\\mathcal{E}"} /><span> : Coincidência </span></>} color={waveColors.coincidence} />
        </div>
      </Section>
      <Section title="Superfícies e fronteiras" defaultOpen={true} accent="#f97316">
        <div className="toggle-grid">
          <Toggle checked={showSonicLeft} onChange={setShowSonicLeft} label={<><MathLabel tex={"\\mathcal{S}^- = \\mathcal{S}^-_s \\cup\\mathcal{S}^-_f"} /><span> : Sônica Esquerda</span></>} color={waveColors.sonicLeftSlow} />
          <Toggle checked={showSonicRight} onChange={setShowSonicRight} label={<><MathLabel tex={"\\mathcal{S}^+ = \\mathcal{S}^+_s\\cup\\mathcal{S}^+_f"} /><span> : Sônica Direita</span></>} color={waveColors.sonicRightFast} />
          <Toggle checked={showDoubleSonic} onChange={setShowDoubleSonic} label={<><MathLabel tex={"\\mathcal{DS}"} /><span> : Dupla Sônica </span></>} color={waveColors.doubleSonic} />
          <Toggle checked={showInflectionSlow || showInflectionFast} onChange={(checked) => { setShowInflectionSlow(checked); setShowInflectionFast(checked) }} label={<><MathLabel tex={"\\mathcal{J}"} /><span> : Inflexões </span></>} color={waveColors.inflection ?? waveColors.inflectionSlow} />
          <Toggle checked={showHysteresisLeft ?? showHysteresis} onChange={setShowHysteresisLeft ?? setShowHysteresis} label={<><MathLabel tex={"\\operatorname{Hys}^-"} /><span> : Histerese Esquerda</span></>} color={waveColors.hysteresisLeft ?? '#64748b'} />
          <Toggle checked={showHysteresisRight ?? showHysteresis} onChange={setShowHysteresisRight ?? setShowHysteresis} label={<><MathLabel tex={"\\operatorname{Hys}^+"} /><span> : Histerese Direita</span></>} color={waveColors.hysteresisRight ?? '#111827'} />
          <Toggle checked={showBifurcationRight} onChange={setShowBifurcationRight} label={<><MathLabel tex={"\\mathcal{B}^+"} /><span> : Bifurcação Secundária Direita</span></>} color={waveColors.bifurcationRight} />
          <Toggle checked={showSaturated} onChange={setShowSaturated} label={<><MathLabel tex={"\\operatorname{sat}_-(\\operatorname{Hys}^+)"} /><span> : Saturada de </span><MathLabel tex={"\\operatorname{Hys}^+"} /> por <MathLabel tex={"H_-"} /></>} color="#f97316" />
          <Toggle checked={showSaturatedPlus} onChange={setShowSaturatedPlus} label={<><MathLabel tex={"\\operatorname{sat}_+(\\operatorname{Hys}^+)"} /><span> : Saturada de </span><MathLabel tex={"\\operatorname{Hys}^+"} /> por <MathLabel tex={"H_+"} /></>} color="#34d399" />
          <Toggle checked={showHysteresisSelfIntersection} onChange={setShowHysteresisSelfIntersection} label={<><MathLabel tex={"\\operatorname{sat}_-^*(\\operatorname{Hys}^+)"} /><span> : Autointerseção de </span><MathLabel tex={"\\operatorname{sat}_-(\\operatorname{Hys}^+)"} /><span> em <MathLabel tex={"U_*"} /></span></>} color={waveColors.hysteresisSelfIntersection} />
          <Toggle checked={showSaturatedCoincidence} onChange={setShowSaturatedCoincidence} label={<><MathLabel tex={"\\operatorname{sat}_-(\\mathcal{E})"} /><span> : Saturada de </span> <MathLabel tex={"\\mathcal{E}"} /> por <MathLabel tex={"H_-"} /></>} color={waveColors.saturatedCoincidence} />
          <Toggle checked={showSaturatedCoincidencePlus} onChange={setShowSaturatedCoincidencePlus} label={<><MathLabel tex={"\\operatorname{sat}_+(\\mathcal{E})"} /><span> : Saturada de </span> <MathLabel tex={"\\mathcal{E}"} /> por <MathLabel tex={"H_+"} /></>} color={waveColors.saturatedCoincidencePlus} />
          <Toggle checked={showExtensionCoincidenceMinus} onChange={setShowExtensionCoincidenceMinus} label={<><MathLabel tex={"\\operatorname{ext}_-(\\mathcal{E})=\\operatorname{sat}_-(\\mathcal{E})\\cap\\mathcal{S}^-"} /></>} color={waveColors.extensionCoincidenceMinus} />
          <Toggle checked={showExtensionCoincidencePlus} onChange={setShowExtensionCoincidencePlus} label={<><MathLabel tex={"\\operatorname{ext}_+(\\mathcal{E})=\\operatorname{sat}_+(\\mathcal{E})\\cap\\mathcal{S}^+"} /></>} color={waveColors.extensionCoincidencePlus} />
        </div>
      </Section>
      <Section title="Família lenta" defaultOpen={true} accent="#22c55e">
        <div className="toggle-grid">
          <Toggle checked={showHugoniotMinus} onChange={setShowHugoniotMinus} label={<><MathLabel tex={"H_-(U_L)"} /><span> : Hugoniot Forward</span></>} color={waveColors.hugoniotMinus ?? '#0f172a'} />
          <Toggle checked={showRarefactionSlow} onChange={setShowRarefactionSlow} label={<><MathLabel tex={"\\mathcal{R}_-(U_L)"} /><span> : Rarefação Lenta </span></>} color={waveColors.rarefactionSlow} />
          <Toggle checked={showCompositeSlow} onChange={setShowCompositeSlow} label={<><MathLabel tex={"\\mathcal{K}_-(U_L)"} /><span> : Composta Lenta </span></>} color={waveColors.compositeSlow ?? waveColors.composite} />
          <Toggle checked={showCompositeSaturatedSlow} onChange={setShowCompositeSaturatedSlow} label={<><MathLabel tex={"\\operatorname{sat}_{-}(\\mathcal{R}_-)"} /><span> : Superfície saturada lenta </span></>} color={waveColors.compositeSaturatedSlow ?? '#60a5fa'} />
        </div>
      </Section>
      <Section title="Família rápida" defaultOpen={true} accent="#a78bfa">
        <div className="toggle-grid">
          <Toggle checked={showHugoniotPlus} onChange={setShowHugoniotPlus} label={<><MathLabel tex={"H_+(U_R)"} /><span> : Hugoniot Backward</span></>} color={waveColors.hugoniotPlus ?? '#0f172a'} />
          <Toggle checked={showRarefactionFast} onChange={setShowRarefactionFast} label={<><MathLabel tex={"\\mathcal{R}_+(U_R)"} /><span> : Rarefação Rápida</span></>} color={waveColors.rarefactionFast} />
          <Toggle checked={showCompositeFast} onChange={setShowCompositeFast} label={<><MathLabel tex={"\\mathcal{K}_+(U_R)"} /><span> : Composta Rápida</span></>} color={waveColors.compositeFast ?? waveColors.composite} />
          <Toggle checked={showCompositeSaturatedFast} onChange={setShowCompositeSaturatedFast} label={<><MathLabel tex={"\\operatorname{sat}_{+}(\\mathcal{R}_+)"} /><span> : Superfície saturada rápida</span></>} color={waveColors.compositeSaturatedFast ?? '#f472b6'} />
          
          <div className="visualization-note">As curvas exibidas correspondem às folhas completas das bifolheações ativas.</div>
        </div>
      </Section>

      </>)}
      <div className="visualization-bulk-actions">
        <button type="button" className="secondary-button visualization-clear-button" onClick={clearVisualizationControls}>Ocultar tudo</button>
        <button type="button" className="secondary-button visualization-clear-button" onClick={markVisualizationControls}>Mostrar tudo</button>
      </div>

      <button onClick={clearSelectedState} className="secondary-button panel-clear-button">Limpar seleções</button>

      
      

    </aside>
  )
}


















