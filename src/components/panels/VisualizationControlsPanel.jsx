import MathLabel from './MathLabel'
import PhasePortraitControl from './PhasePortraitControl.jsx'
import { Section, Toggle } from './PanelPrimitives'

export default function VisualizationControlsPanel({
  activeView = '3d',
  clearVisualizationControls,
  clearSelectedState,
  markVisualizationControls,
  setShowAxes,
  setShowBifurcationLeft,
  setShowSaturatedLeftMinus,
  setShowSaturatedLeftPlus,
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
  setShowLeftHysteresisSelfIntersection,
  setShowSaturatedCoincidence,
  setShowSaturatedCoincidencePlus,
  setShowExtensionCoincidenceMinus,
  setShowExtensionCoincidencePlus,
  setShowSonicLeft,
  setShowHopfPlus,
  setShowHopfMinus,
  setShowSonicRight,
  showAxes,
  showBifurcationLeft,
  showSaturatedLeftMinus,
  showSaturatedLeftPlus,
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
  showLeftHysteresisSelfIntersection,
  showSaturatedCoincidence,
  showSaturatedCoincidencePlus,
  showExtensionCoincidenceMinus,
  showExtensionCoincidencePlus,
  showSonicLeft,
  showHopfPlus,
  showHopfMinus,
  showSonicRight,
  waveColors,
}) {
  return (
      <aside className="wm-left wm-panel">

      <div className="wm-panel-kicker">{activeView === 'state' ? 'Projeções' : 'Camadas da cena'}</div>
      <div className="wm-panel-intro">{activeView === 'state' ? <>A projeção <MathLabel tex="\pi_-"/> associa cada ponto <MathLabel tex="P\in\mathcal{W}"/> ao estado esquerdo <MathLabel tex="U_-" /> e a projeção <MathLabel tex="\pi_+" /> associa cada ponto <MathLabel tex="P\in\mathcal{W}"/> ao estado direito <MathLabel tex="U_+" />.</> : 'Escolha as superfícies e curvas da variedade de ondas.'}</div>
      
      {activeView === 'state' && (
      <>
      <Section title="Referências geométricas" defaultOpen={true} accent="#38bdf8">
        <div className="state-projection-group" role="group" aria-label="Projeção no estado esquerdo">
          <div className="toggle-grid">
            <Toggle
              checked={showCoincidenceMinusProjection}
              onChange={setShowCoincidenceMinusProjection}
              color={waveColors.coincidence}
              label={<><MathLabel tex="\pi_-(\mathcal{E})" /><span> : Coincidência</span></>}
              helper={{
                title: <><MathLabel tex="\pi_-(\mathcal{E})" /><span> — Coincidência</span></>,
                description: (
                  <><p>{"Coincidência: os dois valores característicos coincidem. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
          </div>
        </div>
        <div className="state-projection-group" role="group" aria-label="Projeção no estado direito">
          <div className="toggle-grid">
            <Toggle
              checked={showCoincidencePlusProjection}
              onChange={setShowCoincidencePlusProjection}
              color={waveColors.coincidence}
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{E})`} /><span> : Coincidência</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{E})`} /><span> — Coincidência</span></>,
                description: (
                  <><p>{"Coincidência: os dois valores característicos coincidem. A projeção π₊ associa cada ponto ao estado direito U₊."}</p></>
                ),
                documentation: "curvas",
              }}
            />
          </div>
        </div>
      </Section>
      <Section title="Curvas especiais" defaultOpen={true} accent="#facc15">
        <div className="state-projection-group" role="group" aria-label="Projeção no estado esquerdo">
          <div className="toggle-grid">
            <Toggle
              checked={showDoubleSonicMinusProjection}
              onChange={setShowDoubleSonicMinusProjection}
              color={waveColors.doubleSonic}
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{DS})`} /><span> : Dupla Sônica</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{DS})`} /><span> — Dupla Sônica</span></>,
                description: (
                  <><p>{"Dupla sônica: a velocidade de choque é característica nos dois estados. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={showInflectionMinusProjection}
              onChange={setShowInflectionMinusProjection}
              color={waveColors.inflection}
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{J})`} /><span> : Inflexões</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{J})`} /><span> — Inflexões</span></>,
                description: (
                  <><p>{"Inflexão: lugar onde a velocidade característica é estacionária ao longo da rarefação. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={showHysMinusMinusProjection}
              onChange={setShowHysMinusMinusProjection}
              color={waveColors.hysMinusMinusProjection}
              label={<><MathLabel tex={String.raw`\pi_-(\operatorname{Hys}^-)`} /><span> : Histerese Esquerda</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\operatorname{Hys}^-)`} /><span> — Histerese Esquerda</span></>,
                description: (
                  <><p>{"Curva de histerese na superfície sônica, associada à extensão da curva de inflexão. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={showHysPlusMinusProjection}
              onChange={setShowHysPlusMinusProjection}
              color={waveColors.hysPlusMinusProjection}
              label={<><MathLabel tex={String.raw`\pi_-(\operatorname{Hys}^+)`} /><span> : Histerese Direita</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\operatorname{Hys}^+)`} /><span> — Histerese Direita</span></>,
                description: (
                  <><p>{"Curva de histerese na superfície sônica, associada à extensão da curva de inflexão. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
          </div>
        </div>
        <div className="state-projection-group" role="group" aria-label="Projeção no estado direito">
          <div className="toggle-grid">
            <Toggle
              checked={showDoubleSonicPlusProjection}
              onChange={setShowDoubleSonicPlusProjection}
              color={waveColors.doubleSonic}
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{DS})`} /><span> : Dupla Sônica</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{DS})`} /><span> — Dupla Sônica</span></>,
                description: (
                  <><p>{"Dupla sônica: a velocidade de choque é característica nos dois estados. A projeção π₊ associa cada ponto ao estado direito U₊."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={showInflectionPlusProjection}
              onChange={setShowInflectionPlusProjection}
              color={waveColors.inflection}
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{J})`} /><span> : Inflexões</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{J})`} /><span> — Inflexões</span></>,
                description: (
                  <><p>{"Inflexão: lugar onde a velocidade característica é estacionária ao longo da rarefação. A projeção π₊ associa cada ponto ao estado direito U₊."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={showHysMinusPlusProjection}
              onChange={setShowHysMinusPlusProjection}
              color={waveColors.hysMinusPlusProjection}
              label={<><MathLabel tex={String.raw`\pi_+(\operatorname{Hys}^-)`} /><span> : Histerese Esquerda</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\operatorname{Hys}^-)`} /><span> — Histerese Esquerda</span></>,
                description: (
                  <><p>{"Curva de histerese na superfície sônica, associada à extensão da curva de inflexão. A projeção π₊ associa cada ponto ao estado direito U₊."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={showHysPlusPlusProjection}
              onChange={setShowHysPlusPlusProjection}
              color={waveColors.hysPlusPlusProjection}
              label={<><MathLabel tex={String.raw`\pi_+(\operatorname{Hys}^+)`} /><span> : Histerese Direita</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\operatorname{Hys}^+)`} /><span> — Histerese Direita</span></>,
                description: (
                  <><p>{"Curva de histerese na superfície sônica, associada à extensão da curva de inflexão. A projeção π₊ associa cada ponto ao estado direito U₊."}</p></>
                ),
                documentation: "curvas",
              }}
            />
          </div>
        </div>
      </Section>
      <Section title="Extensões da coincidência" defaultOpen={true} accent="#22d3ee">
        <div className="state-projection-group" role="group" aria-label="Projeção no estado esquerdo">
          <div className="toggle-grid">
            <Toggle
              checked={showExtensionMinusMinusProjection}
              onChange={setShowExtensionMinusMinusProjection}
              color={waveColors.extensionCoincidenceMinus}
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{BT}^-)`} /><span> : Sonic Fold Esquerdo</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{BT}^-)`} /><span> — Sonic Fold Esquerdo</span></>,
                description: (
                  <><p>{"Extensão da coincidência: interseção da superfície sônica com a saturação da coincidência na direção indicada. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={showExtensionPlusMinusProjection}
              onChange={setShowExtensionPlusMinusProjection}
              color={waveColors.extensionCoincidencePlus}
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{BT}^+)`} /><span> : Sonic Fold Direito</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{BT}^+)`} /><span> — Sonic Fold Direito</span></>,
                description: (
                  <><p>{"Extensão da coincidência: interseção da superfície sônica com a saturação da coincidência na direção indicada. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
          </div>
        </div>
        <div className="state-projection-group" role="group" aria-label="Projeção no estado direito">
          <div className="toggle-grid">
            <Toggle
              checked={showExtensionMinusPlusProjection}
              onChange={setShowExtensionMinusPlusProjection}
              color={waveColors.extensionCoincidenceMinus}
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{BT}^-)`} /><span> : Sonic Fold Esquerdo</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{BT}^-)`} /><span> — Sonic Fold Esquerdo</span></>,
                description: (
                  <><p>{"Extensão da coincidência: interseção da superfície sônica com a saturação da coincidência na direção indicada. A projeção π₊ associa cada ponto ao estado direito U₊."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={showExtensionPlusPlusProjection}
              onChange={setShowExtensionPlusPlusProjection}
              color={waveColors.extensionCoincidencePlus}
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{BT}^+)`} /><span> : Sonic Fold Direito</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{BT}^+)`} /><span> — Sonic Fold Direito</span></>,
                description: (
                  <><p>{"Extensão da coincidência: interseção da superfície sônica com a saturação da coincidência na direção indicada. A projeção π₊ associa cada ponto ao estado direito U₊."}</p></>
                ),
                documentation: "curvas",
              }}
            />
          </div>
        </div>
      </Section>
      <Section title="Curvas de autointerseção" defaultOpen={true} accent="#f0abfc">
        <div className="state-projection-group" role="group" aria-label="Projeção no estado esquerdo">
          <div className="toggle-grid">
            <Toggle
              checked={showHysteresisSelfIntersectionMinusProjection}
              onChange={setShowHysteresisSelfIntersectionMinusProjection}
              color={waveColors.hysteresisSelfIntersection}
              label={<><MathLabel tex={String.raw`\pi_-(\operatorname{sat}_{forw}^{*}(\operatorname{Hys}^{+}))`} /><span> : Autointerseção</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\operatorname{sat}_{forw}^{*}(\operatorname{Hys}^{+}))`} /><span> — Autointerseção</span></>,
                description: (
                  <><p>{"Lugar onde folhas geradas por pontos distintos da histerese se encontram, compartilhando o mesmo estado fixo. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "superficies",
              }}
            />
          </div>
        </div>
        <div className="state-projection-group" role="group" aria-label="Projeção no estado direito">
          <div className="toggle-grid">
            <Toggle
              checked={showHysteresisSelfIntersectionPlusProjection}
              onChange={setShowHysteresisSelfIntersectionPlusProjection}
              color={waveColors.hysteresisSelfIntersection}
              label={<><MathLabel tex={String.raw`\pi_+(\operatorname{sat}_{forw}^{*}(\operatorname{Hys}^{+}))`} /><span> : Autointerseção</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\operatorname{sat}_{forw}^{*}(\operatorname{Hys}^{+}))`} /><span> — Autointerseção</span></>,
                description: (
                  <><p>{"Lugar onde folhas geradas por pontos distintos da histerese se encontram, compartilhando o mesmo estado fixo. A projeção π₊ associa cada ponto ao estado direito U₊."}</p></>
                ),
                documentation: "superficies",
              }}
            />
          </div>
        </div>
      </Section>
      <Section title="Ondas da família lenta" defaultOpen={true} accent="#22c55e">
        <div className="state-projection-group" role="group" aria-label="Projeção no estado esquerdo">
          <div className="toggle-grid">
            <Toggle
              checked={showHugoniotMinusMinusProjection}
              onChange={setShowHugoniotMinusMinusProjection}
              color={waveColors.hugoniotMinus}
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{H}^{forw}(U_-))`} /><span> : Hugoniot Forward</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{H}^{forw}(U_-))`} /><span> — Hugoniot Forward</span></>,
                description: (
                  <><p>{"Folha de Hugoniot: estados ligados pela condição de Rankine–Hugoniot, com um dos estados fixo. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={showRarefactionSlowMinusProjection}
              onChange={setShowRarefactionSlowMinusProjection}
              color={waveColors.rarefactionSlow}
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{R}_s(U_-))`} /><span> : Rarefação Lenta</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{R}_s(U_-))`} /><span> — Rarefação Lenta</span></>,
                description: (
                  <><p>{"Curva integral do campo característico da família indicada, a partir do estado selecionado. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={showCompositeSlowMinusProjection}
              onChange={setShowCompositeSlowMinusProjection}
              color={waveColors.compositeSlow}
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{K}_s(U_-))`} /><span> : Composta Lenta</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{K}_s(U_-))`} /><span> — Composta Lenta</span></>,
                description: (
                  <><p>{"Curva composta construída pela extensão sônica da rarefação da família indicada. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
          </div>
        </div>
        <div className="state-projection-group" role="group" aria-label="Projeção no estado direito">
          <div className="toggle-grid">
            <Toggle
              checked={showHugoniotMinusPlusProjection}
              onChange={setShowHugoniotMinusPlusProjection}
              color={waveColors.hugoniotMinus}
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{H}^{forw}(U_-))`} /><span> : Hugoniot Forward</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{H}^{forw}(U_-))`} /><span> — Hugoniot Forward</span></>,
                description: (
                  <><p>{"Folha de Hugoniot: estados ligados pela condição de Rankine–Hugoniot, com um dos estados fixo. A projeção π₊ associa cada ponto ao estado direito U₊."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={showRarefactionSlowPlusProjection}
              onChange={setShowRarefactionSlowPlusProjection}
              color={waveColors.rarefactionSlow}
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{R}_s(U_-))`} /><span> : Rarefação Lenta</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{R}_s(U_-))`} /><span> — Rarefação Lenta</span></>,
                description: (
                  <><p>{"Curva integral do campo característico da família indicada, a partir do estado selecionado. A projeção π₊ associa cada ponto ao estado direito U₊."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={showCompositeSlowPlusProjection}
              onChange={setShowCompositeSlowPlusProjection}
              color={waveColors.compositeSlow}
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{K}_s(U_-))`} /><span> : Composta Lenta</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{K}_s(U_-))`} /><span> — Composta Lenta</span></>,
                description: (
                  <><p>{"Curva composta construída pela extensão sônica da rarefação da família indicada. A projeção π₊ associa cada ponto ao estado direito U₊."}</p></>
                ),
                documentation: "curvas",
              }}
            />
          </div>
        </div>
      </Section>
      <Section title="Ondas da família rápida" defaultOpen={true} accent="#a78bfa">
        <div className="state-projection-group" role="group" aria-label="Projeção no estado esquerdo">
          <div className="toggle-grid">
            <Toggle
              checked={showHugoniotPlusMinusProjection}
              onChange={setShowHugoniotPlusMinusProjection}
              color={waveColors.hugoniotPlus}
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{H}^{back}(U_+))`} /><span> : Hugoniot Backward</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{H}^{back}(U_+))`} /><span> — Hugoniot Backward</span></>,
                description: (
                  <><p>{"Folha de Hugoniot: estados ligados pela condição de Rankine–Hugoniot, com um dos estados fixo. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={showRarefactionFastMinusProjection}
              onChange={setShowRarefactionFastMinusProjection}
              color={waveColors.rarefactionFast}
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{R}_f(U_+))`} /><span> : Rarefação Rápida</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{R}_f(U_+))`} /><span> — Rarefação Rápida</span></>,
                description: (
                  <><p>{"Curva integral do campo característico da família indicada, a partir do estado selecionado. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={showCompositeFastMinusProjection}
              onChange={setShowCompositeFastMinusProjection}
              color={waveColors.compositeFast}
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{K}_f(U_+))`} /><span> : Composta Rápida</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{K}_f(U_+))`} /><span> — Composta Rápida</span></>,
                description: (
                  <><p>{"Curva composta construída pela extensão sônica da rarefação da família indicada. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
          </div>
        </div>
        <div className="state-projection-group" role="group" aria-label="Projeção no estado direito">
          <div className="toggle-grid">
            <Toggle
              checked={showHugoniotPlusPlusProjection}
              onChange={setShowHugoniotPlusPlusProjection}
              color={waveColors.hugoniotPlus}
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{H}^{back}(U_+))`} /><span> : Hugoniot Backward</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{H}^{back}(U_+))`} /><span> — Hugoniot Backward</span></>,
                description: (
                  <><p>{"Folha de Hugoniot: estados ligados pela condição de Rankine–Hugoniot, com um dos estados fixo. A projeção π₊ associa cada ponto ao estado direito U₊."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={showRarefactionFastPlusProjection}
              onChange={setShowRarefactionFastPlusProjection}
              color={waveColors.rarefactionFast}
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{R}_f(U_+))`} /><span> : Rarefação Rápida</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{R}_f(U_+))`} /><span> — Rarefação Rápida</span></>,
                description: (
                  <><p>{"Curva integral do campo característico da família indicada, a partir do estado selecionado. A projeção π₊ associa cada ponto ao estado direito U₊."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={showCompositeFastPlusProjection}
              onChange={setShowCompositeFastPlusProjection}
              color={waveColors.compositeFast}
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{K}_f(U_+))`} /><span> : Composta Rápida</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{K}_f(U_+))`} /><span> — Composta Rápida</span></>,
                description: (
                  <><p>{"Curva composta construída pela extensão sônica da rarefação da família indicada. A projeção π₊ associa cada ponto ao estado direito U₊."}</p></>
                ),
                documentation: "curvas",
              }}
            />
          </div>
        </div>
      </Section>
      </>
      )}
      {activeView !== 'state' && (<>
      <Section title="Referências geométricas" defaultOpen={true} accent="#38bdf8">
        <div className="toggle-grid">
          <Toggle checked={showAxes} onChange={setShowAxes} label="Eixos" />
          <Toggle
            checked={showCharacteristic}
            onChange={setShowCharacteristic}
            color={waveColors.characteristicFast}
            label={<><MathLabel tex="\mathcal{C}" /><span> : Características</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{C}" /><span> — Característica</span></>,
              description: (
              <>
                <p>Seja <MathLabel tex="P=(\tau,Y,z)\in\mathcal{W}" />. A característica é o conjunto dos pontos da variedade de ondas nos quais os estados esquerdo e direito coincidem:</p>
                
                <div className="tooltip-equation"><MathLabel tex="\mathcal{C}=\{P\in\mathcal{W}:\pi_-(P)=\pi_+(P)=U\}" />.</div>
                
                <p>Nas coordenadas <MathLabel tex="(\tau,Y,z)" />, a característica é dada por</p>
                
                <div className="tooltip-equation"><MathLabel tex="\mathcal{C}=\{P\in\mathcal{W}:Y=0\}" />.</div>
                
                <p>A característica decompõe-se na folha lenta, na curva de coincidência e na folha rápida:</p>
                
                <div className="tooltip-equation"><MathLabel tex="\mathcal{C}=\mathcal{C}_s\cup\mathcal{E}\cup\mathcal{C}_f" />.</div>
                
                <p>Na folha lenta <MathLabel tex="\mathcal{C}_s" />,</p>
                
                <div className="tooltip-equation"><MathLabel tex="s(P)=\lambda_s(U)" />.</div>
                
                <p>Na folha rápida <MathLabel tex="\mathcal{C}_f" />,</p>
                
                <div className="tooltip-equation"><MathLabel tex="s(P)=\lambda_f(U)" />.</div>
                
                <p>As duas velocidades características coincidem em <MathLabel tex="\mathcal{E}" />:</p>
                
                <div className="tooltip-equation"><MathLabel tex="\lambda_s(U)=\lambda_f(U)" />.</div>
                
                <p>Nas coordenadas <MathLabel tex="(\tau,Y,z)" />, a curva de coincidência é</p>
                
                <div className="tooltip-equation"><MathLabel tex="\mathcal{E}=\{P\in\mathcal{W}:Y=0,\ \tau=0\}" />.</div>
              </>
            ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showCoincidence}
            onChange={setShowCoincidence}
            color={waveColors.coincidence}
            label={<><MathLabel tex="\mathcal{E}" /><span> : Coincidência</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{E}" /><span> — Coincidência</span></>,
              description: (
                <>
                  <p>A curva de coincidência <MathLabel tex="\mathcal{E}" /> é o conjunto dos pontos da característica <MathLabel tex="\mathcal{C}" /> nos quais as velocidades características lenta e rápida coincidem:</p>
                  
                  <div className="tooltip-equation"><MathLabel tex="\mathcal{E}=\{P\in\mathcal{C}:\lambda_s(\pi(P))=\lambda_f(\pi(P))\}" />.</div>
                  
                  <p>Na característica, as projeções esquerda e direita coincidem:</p>
                  
                  <div className="tooltip-equation"><MathLabel tex="\pi=\pi_-|_{\mathcal{C}}=\pi_+|_{\mathcal{C}}" />.</div>
                  
                  <p>Assim, para <MathLabel tex="P\in\mathcal{E}" />, o estado comum <MathLabel tex="U=\pi(P)" /> satisfaz</p>
                  
                  <div className="tooltip-equation"><MathLabel tex="\lambda_s(U)=\lambda_f(U)" />.</div>
                  
                  <p>A curva <MathLabel tex="\mathcal{E}" /> separa a folha característica lenta <MathLabel tex="\mathcal{C}_s" /> da folha característica rápida <MathLabel tex="\mathcal{C}_f" />.</p>
                  
                  <p>Nas coordenadas <MathLabel tex="(\tau,Y,z)" />, a coincidência é dada por</p>
                  
                  <div className="tooltip-equation"><MathLabel tex="\mathcal{E}=\{P\in\mathcal{W}:Y=0,\ \tau=0\}" />.</div>
                </>
              ),
              documentation: "curvas",
            }}
          />
        </div>
      </Section>
      <Section title="Superfícies sônicas e de Hopf" defaultOpen={true} accent="#f97316">
        <div className="toggle-grid">
          <Toggle
            checked={showSonicLeft}
            onChange={setShowSonicLeft}
            color={waveColors.sonicLeftSlow}
            label={<><MathLabel tex="\mathcal{S}^-" /><span> : Sônica Esquerda </span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{S}^-" /><span> — Sônica Esquerda </span>(<MathLabel tex="\mathcal{Son}'" />)</>,
              description: (
              <>
                <p>A superfície sônica esquerda <MathLabel tex="\mathcal{S}^-" /> é o conjunto dos pontos <MathLabel tex="P\in\mathcal{W}" /> nos quais a velocidade <MathLabel tex="s" /> é crítica ao longo da curva de Hugoniot backward, mantendo fixo o estado direito <MathLabel tex="U_+" />:</p>
                
                <div className="tooltip-equation"><MathLabel tex="\mathcal{S}^-=\{P\in\mathcal{W}:ds|_{\mathcal{H}^{\mathrm{back}}(U_+)}(P)=0\}" />.</div>
                
                <p>Pela condição de Bethe–Wendroff, em <MathLabel tex="\mathcal{S}^-" /> a velocidade do choque coincide com uma velocidade característica do estado esquerdo <MathLabel tex="U_-=\pi_-(P)" />:</p>
                
                <div className="tooltip-equation"><MathLabel tex="s(P)=\lambda_s(U_-)\quad\text{ou}\quad s(P)=\lambda_f(U_-)" />.</div>
                
                <p>A superfície sônica esquerda decompõe-se na parte lenta, na curva de Bogdanov-Takens e na parte rápida:</p>
                
                <div className="tooltip-equation"><MathLabel tex="\mathcal{S}^-=\mathcal{S}^-_s\cup \mathcal{BT}^-\cup\mathcal{S}^-_f" />.</div>
                
                <p>Na parte lenta <MathLabel tex="\mathcal{S}^-_s" />,</p>
                
                <div className="tooltip-equation"><MathLabel tex="s(P)=\lambda_s(U_-)" />.</div>
                
                <p>Na parte rápida <MathLabel tex="\mathcal{S}^-_f" />,</p>
                
                <div className="tooltip-equation"><MathLabel tex="s(P)=\lambda_f(U_-)" />.</div>
                
                <p>A curva <MathLabel tex="\mathcal{BT}^-" /> separa as partes lenta e rápida de <MathLabel tex="\mathcal{S}^-" /> e é a extensão esquerda da curva de coincidência <MathLabel tex="\mathcal{E}" />:</p>
                
                <div className="tooltip-equation"><MathLabel tex="BT^-=\operatorname{ext}_-(\mathcal{E})=\mathcal{S}^-\cap\operatorname{sat}_{\mathrm{forw}}(\mathcal{E})" />.</div>
              </>
              ),
              documentation: "superficies",
            }}
          />
          <Toggle
            checked={showSonicRight}
            onChange={setShowSonicRight}
            color={waveColors.sonicRightFast}
            label={<><MathLabel tex="\mathcal{S}^+" /><span> : Sônica Direita </span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{S}^+" /><span> — Sônica Direita </span>(<MathLabel tex="\mathcal{Son}" />)</>,
              description: (
                <>
                  <p>A superfície sônica direita <MathLabel tex="\mathcal{S}^+" /> é o conjunto dos pontos <MathLabel tex="P\in\mathcal{W}" /> nos quais a velocidade <MathLabel tex="s" /> é crítica ao longo da curva de Hugoniot forward, mantendo fixo o estado esquerdo <MathLabel tex="U_-" />:</p>
                  
                  <div className="tooltip-equation"><MathLabel tex="\mathcal{S}^+=\{P\in\mathcal{W}:ds|_{\mathcal{H}^{\mathrm{forw}}(U_-)}(P)=0\}" />.</div>
                  
                  <p>Pela condição de Bethe-Wendroff, em <MathLabel tex="\mathcal{S}^+" /> a velocidade do choque coincide com uma velocidade característica do estado direito <MathLabel tex="U_+=\pi_+(P)" />:</p>
                  
                  <div className="tooltip-equation"><MathLabel tex="s(P)=\lambda_s(U_+)\quad\text{ou}\quad s(P)=\lambda_f(U_+)" />.</div>
                  
                  <p>A superfície sônica direita decompõe-se na parte lenta, na curva de Bogdanov-Takens e na parte rápida:</p>
                  
                  <div className="tooltip-equation"><MathLabel tex="\mathcal{S}^+=\mathcal{S}^+_s\cup \mathcal{BT}^+\cup\mathcal{S}^+_f" />.</div>
                  
                  <p>Na parte lenta <MathLabel tex="\mathcal{S}^+_s" />,</p>
                  
                  <div className="tooltip-equation"><MathLabel tex="s(P)=\lambda_s(U_+)" />.</div>
                  
                  <p>Na parte rápida <MathLabel tex="\mathcal{S}^+_f" />,</p>
                  
                  <div className="tooltip-equation"><MathLabel tex="s(P)=\lambda_f(U_+)" />.</div>
                  
                  <p>A curva <MathLabel tex="\mathcal{BT}^+" /> separa as partes lenta e rápida de <MathLabel tex="\mathcal{S}^+" /> e é a extensão direita da curva de coincidência <MathLabel tex="\mathcal{E}" />:</p>
                  
                  <div className="tooltip-equation"><MathLabel tex="BT^+=\operatorname{ext}_+(\mathcal{E})=\mathcal{S}^+\cap\operatorname{sat}_{\mathrm{back}}(\mathcal{E})" />.</div>
                </>
              ),
              documentation: "superficies",
            }}
          />
          <Toggle
            checked={showHopfMinus}
            onChange={setShowHopfMinus}
            color={waveColors.hopfMinus}
            label={<><MathLabel tex="\mathcal{Hopf}^-" /><span> : Hopf Esquerda</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{Hopf}^-" /><span> — Hopf Esquerda</span></>,
              description: (
                <>
                  <p>A superfície de Hopf esquerda <MathLabel tex="\mathcal{Hopf}^-" /> é o conjunto dos pontos <MathLabel tex="P\in\mathcal{W}" /> nos quais a matriz</p>

                  <div className="tooltip-equation"><MathLabel tex="M_-(P) = DF(U_-)-s(P)I" />.</div>

                  <p>possui traço nulo e determinante não negativo:</p>

                  <div className="tooltip-equation"><MathLabel tex="\operatorname{tr}M_-(P) = 0,\qquad \det M_-(P)\geq 0" />.</div>

                  <p>Portanto,</p>

                  <div className="tooltip-equation"><MathLabel tex="\mathcal{Hopf}^- =\{P\in\mathcal{W}:\operatorname{tr}M_-(P) = 0,\ \det M_-(P)\geq 0\}" />.</div>

                  <p>Nessas condições, os autovalores de <MathLabel tex="M_-(P)" /> são imaginários puros ou nulos.
                  </p>

                  <p>A superfície <MathLabel tex="\mathcal{Hopf}^-" /> é limitada pela curva de coincidência <MathLabel tex="\mathcal{E}" /> e pela curva de Bogdanov-Takens <MathLabel tex="\mathcal{BT}^-" />.</p>
                </>
              ),
              documentation: "superficies",
            }}
          />
          <Toggle
            checked={showHopfPlus}
            onChange={setShowHopfPlus}
            color={waveColors.hopfPlus}
            label={<><MathLabel tex={String.raw`\mathcal{Hopf}^+`} /><span> : Hopf Direita</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{Hopf}^+" /><span> — Hopf Direita</span></>,
              description: (
                <>
                  <p>A superfície de Hopf direita <MathLabel tex="\mathcal{Hopf}^+" /> é o conjunto dos pontos <MathLabel tex="P\in\mathcal{W}" /> nos quais a matriz</p>

                  <div className="tooltip-equation"><MathLabel tex="M_+(P) = DF(U_+)-s(P)I" />.</div>

                  <p>possui traço nulo e determinante não negativo:</p>

                  <div className="tooltip-equation"><MathLabel tex="\operatorname{tr}M_+(P) = 0,\qquad \det M_+(P)\geq 0" />.</div>

                  <p>Portanto,</p>

                  <div className="tooltip-equation"><MathLabel tex="\mathcal{Hopf}^+=\{P\in\mathcal{W}:\operatorname{tr}M_+(P) = 0,\ \det M_+(P)\geq 0\}" />.</div>

                  <p>Nessas condições, os autovalores de <MathLabel tex="M_+(P)" /> são imaginários puros ou nulos.</p>

                  <p>A superfície <MathLabel tex="\mathcal{Hopf}^+" /> é limitada pela curva de coincidência <MathLabel tex="\mathcal{E}" /> e pela curva de Bogdanov-Takens <MathLabel tex="\mathcal{BT}^+" />.</p>
                </>
              ),
              documentation: "superficies",
            }}
          />
        </div>
      </Section>
      <Section title="Curvas especiais" defaultOpen={true} accent="#facc15">
        <div className="toggle-grid">
          <Toggle
            checked={showInflectionSlow || showInflectionFast}
            onChange={(checked) => { setShowInflectionSlow(checked); setShowInflectionFast(checked) }}
            color={waveColors.inflection ?? waveColors.inflectionSlow}
            label={<><MathLabel tex="\mathcal{J}" /><span> : Inflexões</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{J}" /><span> — Inflexão</span></>,
              description: (
                <>
                  <p>A curva de inflexão <MathLabel tex="\mathcal{J}" /> é o conjunto dos pontos da característica <MathLabel tex="\mathcal{C}" /> nos quais a velocidade característica é crítica ao longo da rarefação da respectiva família.</p>

                  <p>Na folha característica lenta <MathLabel tex="\mathcal{C}_s" />, a criticidade ocorre ao longo da rarefação lenta <MathLabel tex="\mathcal{R}_s" />:</p>

                  <div className="tooltip-equation"><MathLabel tex="ds|_{\mathcal{R}_s}(P)=0" />.</div>

                  <p>Na folha característica rápida <MathLabel tex="\mathcal{C}_f" />, a criticidade ocorre ao longo da rarefação rápida <MathLabel tex="\mathcal{R}_f" />:</p>

                  <div className="tooltip-equation"><MathLabel tex="ds|_{\mathcal{R}_f}(P)=0" />. </div>

                  <p>Como <MathLabel tex="\mathcal{J}\subset\mathcal{C}" />, os estados esquerdo e direito coincidem:</p>

                  <div className="tooltip-equation"><MathLabel tex="\pi_-(P)=\pi_+(P)=U" />.</div>

                  <p>A curva de inflexão pertence simultaneamente às superfícies sônicas esquerda <MathLabel tex="\mathcal{S}^-" /> e direita <MathLabel tex="\mathcal{S}^+" />:</p>

                  <div className="tooltip-equation"><MathLabel tex="\mathcal{J}\subset\mathcal{S}^-\cap\mathcal{S}^+" />.</div>

                  <p>A interseção das duas superfícies sônicas decompõe-se em</p>

                  <div className="tooltip-equation"><MathLabel tex="\mathcal{S}^-\cap\mathcal{S}^+=\mathcal{J}\cup\mathcal{DS}" />.</div>
                </>
              ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showDoubleSonic}
            onChange={setShowDoubleSonic}
            color={waveColors.doubleSonic}
            label={<><MathLabel tex={String.raw`\mathcal{DS}`} /><span> : Dupla Sônica</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{DS}" /><span> — Dupla Sônica</span></>,
              description: (
                <>
                  <p>
                    O conjunto dupla sônica <MathLabel tex="\mathcal{DS}" /> é formado pelos pontos <MathLabel tex="P\in\mathcal{W}" /> que pertencem simultaneamente às superfícies sônicas esquerda <MathLabel tex="\mathcal{S}^-" /> e direita <MathLabel tex="\mathcal{S}^+" />, excluindo a curva de inflexão <MathLabel tex="\mathcal{J}" />.</p>

                  <div className="tooltip-equation"><MathLabel tex="\mathcal{S}^-\cap\mathcal{S}^+=\mathcal{J}\cup\mathcal{DS}" />.</div>

                  <p>Portanto,</p>

                  <div className="tooltip-equation"><MathLabel tex="\mathcal{DS}=(\mathcal{S}^-\cap\mathcal{S}^+)\setminus\mathcal{J}" />.</div>

                  <p>Para <MathLabel tex="P\in\mathcal{DS}" />, a velocidade <MathLabel tex="s(P)" /> é simultaneamente crítica ao longo das curvas de Hugoniot forward e backward:</p>

                  <div className="tooltip-equation"><MathLabel tex="ds|_{\mathcal{H}^{\mathrm{forw}}(U_-)}(P)=0,\qquad ds|_{\mathcal{H}^{\mathrm{back}}(U_+)}(P)=0" />.</div>

                  <p>Equivalentemente, pela condição de Bethe-Wendroff, a velocidade do choque é simultaneamente uma velocidade característica dos estados esquerdo e direito:</p>

                  <div className="tooltip-equation"><MathLabel tex="s(P)\in\{\lambda_s(U_-),\lambda_f(U_-)\}\cap\{\lambda_s(U_+),\lambda_f(U_+)\}" />.</div>
                </>
              ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showHysteresisLeft ?? showHysteresis}
            onChange={setShowHysteresisLeft ?? setShowHysteresis}
            color={waveColors.hysteresisLeft ?? '#64748b'}
            label={<><MathLabel tex="\mathcal{Hys}^-" /><span> : Histerese Esquerda</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{Hys}^-" /><span> — Histerese Esquerda</span></>,
              description: (
                <>
                  <p>A curva de histerese esquerda <MathLabel tex="\mathcal{Hys}^-" /> é o conjunto dos pontos <MathLabel tex="P\in\mathcal{S}^-" /> nos quais a curva de Hugoniot forward <MathLabel tex="\mathcal{H}^{\mathrm{forw}}(U_-)" />, com o estado esquerdo <MathLabel tex="U_-" /> fixo, é tangente à superfície sônica esquerda <MathLabel tex="\mathcal{S}^-" />.</p>

                  <p>Equivalentemente, <MathLabel tex="\mathcal{Hys}^-" /> é a extensão esquerda da curva de inflexão <MathLabel tex="\mathcal{J}" />:</p>

                  <div className="tooltip-equation"><MathLabel tex="\mathcal{Hys}^-=\operatorname{ext}_-(\mathcal{J})" />.</div>

                  <p>Essa extensão é obtida saturando <MathLabel tex="\mathcal{J}" /> pelas curvas de Hugoniot forward e intersectando a superfície resultante com <MathLabel tex="\mathcal{S}^-" />:</p>

                  <div className="tooltip-equation"><MathLabel tex="\mathcal{Hys}^-=\mathcal{S}^-\cap\operatorname{sat}_{\mathrm{forw}}(\mathcal{J})" />.</div>

                  <p>Portanto,</p>

                  <div className="tooltip-equation"><MathLabel tex="\mathcal{Hys}^-=\operatorname{ext}_-(\mathcal{J})=\mathcal{S}^-\cap\operatorname{sat}_{\mathrm{forw}}(\mathcal{J})" />.</div>
                </>
              ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showHysteresisRight ?? showHysteresis}
            onChange={setShowHysteresisRight ?? setShowHysteresis}
            color={waveColors.hysteresisRight ?? '#111827'}
            label={<><MathLabel tex="\mathcal{Hys}^+" /><span> : Histerese Direita</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{Hys}^+" /><span> — Histerese Direita</span></>,
              description: (
                <>
                  <p>A curva de histerese direita <MathLabel tex="\mathcal{Hys}^+" /> é o conjunto dos pontos <MathLabel tex="P\in\mathcal{S}^+" /> nos quais a curva de Hugoniot backward <MathLabel tex="\mathcal{H}^{\mathrm{back}}(U_+)" />, com o estado direito <MathLabel tex="U_+" /> fixo, é tangente à superfície sônica direita <MathLabel tex="\mathcal{S}^+" />.</p>

                  <p>Equivalentemente, <MathLabel tex="\mathcal{Hys}^+" /> é a extensão direita da curva de inflexão <MathLabel tex="\mathcal{J}" />:</p>

                  <div className="tooltip-equation"><MathLabel tex="\mathcal{Hys}^+=\operatorname{ext}_+(\mathcal{J})" />.</div>

                  <p>Essa extensão é obtida saturando <MathLabel tex="\mathcal{J}" /> pelas curvas de Hugoniot backward e intersectando a superfície resultante com <MathLabel tex="\mathcal{S}^+" />:</p>

                  <div className="tooltip-equation"><MathLabel tex="\mathcal{Hys}^+=\mathcal{S}^+\cap\operatorname{sat}_{\mathrm{back}}(\mathcal{J})" />.</div>

                  <p>Portanto,</p>

                  <div className="tooltip-equation"><MathLabel tex="\mathcal{Hys}^+=\operatorname{ext}_+(\mathcal{J})=\mathcal{S}^+\cap\operatorname{sat}_{\mathrm{back}}(\mathcal{J})" />.</div>
                </>
              ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showBifurcationLeft}
            onChange={setShowBifurcationLeft}
            color={waveColors.bifurcationLeft}
            label={<><MathLabel tex="\mathcal{B}^-" /><span> : Bifurcação Secundária Esquerda</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{B}^-" /><span> — Bifurcação Secundária Esquerda</span></>,
description: (
  <>
    <p>
      A curva de bifurcação secundária esquerda <MathLabel tex="\mathcal{B}^-" />
      é o conjunto dos pontos <MathLabel tex="P\in\mathcal{W}" /> nos quais
      a curva de Hugoniot backward
      <MathLabel tex="\mathcal{H}^{\mathrm{back}}(U_+)" />, com o estado
      direito <MathLabel tex="U_+" /> fixo, deixa de ser regular.
    </p>

    <p>
      Assim, <MathLabel tex="\mathcal{B}^-" /> corresponde à perda de
      regularidade da folheação de Hugoniot backward.
    </p>

    <p>
      A curva <MathLabel tex="\mathcal{B}^-" /> é a contraparte esquerda
      de <MathLabel tex="\mathcal{B}^+" />.
    </p>
  </>
),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showBifurcationRight}
            onChange={setShowBifurcationRight}
            color={waveColors.bifurcationRight}
            label={<><MathLabel tex="\mathcal{B}^+" /><span> : Bifurcação Secundária Direita</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{B}^+" /><span> — Bifurcação Secundária Direita</span></>,
description: (
  <>
    <p>
      A curva de bifurcação secundária direita <MathLabel tex="\mathcal{B}^+" />
      é o conjunto dos pontos <MathLabel tex="P\in\mathcal{W}" /> nos quais
      a curva de Hugoniot forward
      <MathLabel tex="\mathcal{H}^{\mathrm{forw}}(U_-)" />, com o estado
      esquerdo <MathLabel tex="U_-" /> fixo, deixa de ser regular.
    </p>

    <p>
      Assim, <MathLabel tex="\mathcal{B}^+" /> corresponde à perda de
      regularidade da folheação de Hugoniot forward.
    </p>

    <p>
      A curva <MathLabel tex="\mathcal{B}^+" /> é a contraparte direita
      de <MathLabel tex="\mathcal{B}^-" />.
    </p>
  </>
),
              documentation: "curvas",
            }}
          />
        </div>
      </Section>
      <Section title="Saturações de Histerese" defaultOpen={true} accent="#34d399">
        <div className="toggle-grid">
          <Toggle
            checked={showSaturatedLeftMinus}
            onChange={setShowSaturatedLeftMinus}
            color="#38bdf8"
            label={<><MathLabel tex="\operatorname{sat}_{\mathrm{forw}}(\mathcal{Hys}^-)" /><span> : Saturação Fordward da Histerese Esquerda</span></>}
            helper={{
              title: <><MathLabel tex="\operatorname{sat}_{\mathrm{forw}}(\mathcal{Hys}^-)" /><span> — Saturação Forward da Histerese Esquerda</span></>,
description: (
  <>
    <p>
      A saturação forward de <MathLabel tex="\mathcal{Hys}^-" /> é a
      superfície obtida pela união das curvas de Hugoniot forward associadas
      aos estados esquerdos dos pontos da histerese esquerda.
    </p>

    <p>
      Para cada ponto <MathLabel tex="P\in\mathcal{Hys}^-" />, toma-se
      o estado esquerdo
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="U_-=\pi_-(P)" />.
    </div>

    <p>
      Mantendo <MathLabel tex="U_-" /> fixo, considera-se a curva de
      Hugoniot forward
      <MathLabel tex="\mathcal{H}^{\mathrm{forw}}(U_-)" />.
    </p>

    <p>
      A união dessas curvas define a superfície saturada:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\operatorname{sat}_{\mathrm{forw}}(\mathcal{Hys}^-)=\bigcup_{P\in\mathcal{Hys}^-}\mathcal{H}^{\mathrm{forw}}(\pi_-(P))" />.
    </div>
  </>
),
              documentation: "superficies",
            }}
          />
          <Toggle
            checked={showSaturatedLeftPlus}
            onChange={setShowSaturatedLeftPlus}
            color="#e879f9"
            label={<><MathLabel tex="\operatorname{sat}_{\mathrm{back}}(\mathcal{Hys}^-)" /><span> : Saturação Backward da Histerese Esquerda</span></>}
            helper={{
              title: <><MathLabel tex="\operatorname{sat}_{\mathrm{back}}(\mathcal{Hys}^-)" /><span> — Saturação Backward da Histerese Esquerda</span></>,
description: (
  <>
    <p>
      A saturação backward de <MathLabel tex="\mathcal{Hys}^-" /> é a
      superfície obtida pela união das curvas de Hugoniot backward associadas
      aos estados direitos dos pontos da histerese esquerda.
    </p>

    <p>
      Para cada ponto <MathLabel tex="P\in\mathcal{Hys}^-" />, toma-se
      o estado direito
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="U_+=\pi_+(P)" />.
    </div>

    <p>
      Mantendo <MathLabel tex="U_+" /> fixo, considera-se a curva de
      Hugoniot backward
      <MathLabel tex="\mathcal{H}^{\mathrm{back}}(U_+)" />.
    </p>

    <p>
      A união dessas curvas define a superfície saturada:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\operatorname{sat}_{\mathrm{back}}(\mathcal{Hys}^-)=\bigcup_{P\in\mathcal{Hys}^-}\mathcal{H}^{\mathrm{back}}(\pi_+(P))" />.
    </div>
  </>
),
              documentation: "superficies",
            }}
          />
          <Toggle
            checked={showSaturated}
            onChange={setShowSaturated}
            color="#f97316"
            label={<><MathLabel tex="\operatorname{sat}_{\mathrm{forw}}(\mathcal{Hys}^+)" /><span> : Saturação Forward da Histerese Direita</span></>}
            helper={{
              title: <><MathLabel tex="\operatorname{sat}_{\mathrm{forw}}(\mathcal{Hys}^+)" /><span> — Saturação Forward da Histerese Direita</span></>,
description: (
  <>
    <p>
      A saturação forward de <MathLabel tex="\mathcal{Hys}^+" /> é a
      superfície obtida pela união das curvas de Hugoniot forward associadas
      aos estados esquerdos dos pontos da histerese direita.
    </p>

    <p>
      Para cada ponto <MathLabel tex="P\in\mathcal{Hys}^+" />, toma-se
      o estado esquerdo
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="U_-=\pi_-(P)" />.
    </div>

    <p>
      Mantendo <MathLabel tex="U_-" /> fixo, considera-se a curva de
      Hugoniot forward
      <MathLabel tex="\mathcal{H}^{\mathrm{forw}}(U_-)" />.
    </p>

    <p>
      A união dessas curvas define a superfície saturada:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\operatorname{sat}_{\mathrm{forw}}(\mathcal{Hys}^+)=\bigcup_{P\in\mathcal{Hys}^+}\mathcal{H}^{\mathrm{forw}}(\pi_-(P))" />.
    </div>
  </>
),
              documentation: "superficies",
            }}
          />
          <Toggle
            checked={showSaturatedPlus}
            onChange={setShowSaturatedPlus}
            color="#34d399"
            label={<><MathLabel tex="\operatorname{sat}_{\mathrm{back}}(\mathcal{Hys}^+)" /><span> : Saturação Backward da Histerese Direita</span></>}
            helper={{
              title: <><MathLabel tex="\operatorname{sat}_{\mathrm{back}}(\mathcal{Hys}^+)" /><span> — Saturação Backward da Histerese Direita</span></>,
description: (
  <>
    <p>
      A saturação backward de <MathLabel tex="\mathcal{Hys}^+" /> é a superfície obtida pela união das curvas de Hugoniot backward associadas aos estados direitos dos pontos da histerese direita.
    </p>

    <p>
      Para cada ponto <MathLabel tex="P\in\mathcal{Hys}^+" />, toma-se
      o estado direito
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="U_+=\pi_+(P)" />.
    </div>

    <p>
      Mantendo <MathLabel tex="U_+" /> fixo, considera-se a curva de
      Hugoniot backward
      <MathLabel tex="\mathcal{H}^{\mathrm{back}}(U_+)" />.
    </p>

    <p>
      A união dessas curvas define a superfície saturada:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\operatorname{sat}_{\mathrm{back}}(\mathcal{Hys}^+)=\bigcup_{P\in\mathcal{Hys}^+}\mathcal{H}^{\mathrm{back}}(\pi_+(P))" />.
    </div>
  </>
),
              documentation: "superficies",
            }}
          />
        </div>
      </Section>
      <Section title={<>Saturações e extensões da <MathLabel tex="\mathcal{E}" /></>} defaultOpen={true} accent="#22d3ee">
        <div className="toggle-grid">
          <Toggle
            checked={showSaturatedCoincidence}
            onChange={setShowSaturatedCoincidence}
            color={waveColors.saturatedCoincidence}
            label={<><MathLabel tex="\operatorname{sat}_{\mathrm{forw}}(\mathcal{E})" /><span> : Saturação Forward da Conincidência</span></>}
            helper={{
              title: <><MathLabel tex="\operatorname{sat}_{\mathrm{forw}}(\mathcal{E})" /><span> — Saturação Forward da Coincidência</span></>,
description: (
  <>
    <p>
      A saturação forward da curva de coincidência <MathLabel tex="\mathcal{E}" /> é a
      superfície obtida pela união das curvas de Hugoniot forward associadas
      aos estados esquerdos dos pontos da coincidência.
    </p>

    <p>
      Para cada ponto <MathLabel tex="P\in\mathcal{E}" />, toma-se o estado esquerdo
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="U_-=\pi_-(P)" />.
    </div>

    <p>
      Mantendo <MathLabel tex="U_-" /> fixo, considera-se a curva de
      Hugoniot forward
      <MathLabel tex="\mathcal{H}^{\mathrm{forw}}(U_-)" />.
    </p>

    <p>
      A união dessas curvas define a superfície saturada:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\operatorname{sat}_{\mathrm{forw}}(\mathcal{E})=\bigcup_{P\in\mathcal{E}}\mathcal{H}^{\mathrm{forw}}(\pi_-(P))" />.
    </div>
  </>
),
              documentation: "superficies",
            }}
          />
          <Toggle
            checked={showSaturatedCoincidencePlus}
            onChange={setShowSaturatedCoincidencePlus}
            color={waveColors.saturatedCoincidencePlus}
            label={<><MathLabel tex="\operatorname{sat}_{\mathrm{back}}(\mathcal{E})" /><span> : Saturação Backward da Conincidência</span></>}
            helper={{
              title: <><MathLabel tex="\operatorname{sat}_{\mathrm{back}}(\mathcal{E})" /><span> — Saturação Backward da Coincidência</span></>,
description: (
  <>
    <p>A saturação backward da curva de coincidência <MathLabel tex="\mathcal{E}" /> é a superfície obtida pela união das curvas de Hugoniot backward associadas aos estados direitos dos pontos da coincidência.</p>

    <p>
      Para cada ponto <MathLabel tex="P\in\mathcal{E}" />, toma-se o estado direito
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="U_+=\pi_+(P)" />.
    </div>

    <p>
      Mantendo <MathLabel tex="U_+" /> fixo, considera-se a curva de Hugoniot backward <MathLabel tex="\mathcal{H}^{\mathrm{back}}(U_+)" />.
    </p>

    <p>A união dessas curvas define a superfície saturada:</p>

    <div className="tooltip-equation"><MathLabel tex="\operatorname{sat}_{\mathrm{back}}(\mathcal{E})=\bigcup_{P\in\mathcal{E}}\mathcal{H}^{\mathrm{back}}(\pi_+(P))" />.</div>
  </>
),
              documentation: "superficies",
            }}
          />
          <Toggle
            checked={showExtensionCoincidenceMinus}
            onChange={setShowExtensionCoincidenceMinus}
            color={waveColors.extensionCoincidenceMinus}
            label={<><MathLabel tex="\mathcal{BT}^{-}" /><span> : Bogdanov-Takens Esquerda</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{BT}^-" /><span> — Bogdanov-Takens Esquerda (Sonic Fold ?)</span></>,
description: (
  <>
    <p>
      A curva de Bogdanov-Takens esquerda <MathLabel tex="\mathcal{BT}^-" /> é
      a extensão esquerda da curva de coincidência <MathLabel tex="\mathcal{E}" />:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\mathcal{BT}^-=\operatorname{ext}_-(\mathcal{E})" />.
    </div>

    <p>
      Para construí-la, a curva <MathLabel tex="\mathcal{E}" /> é saturada
      pelas curvas de Hugoniot forward <MathLabel tex="\mathcal{H}^{\mathrm{forw}}(U_-)" />.
    </p>

    <p>Para cada ponto <MathLabel tex="P\in\mathcal{E}" />, toma-se o estado esquerdo</p>

    <div className="tooltip-equation"><MathLabel tex="U_-=\pi_-(P)" />.</div>

    <p>
      Mantendo <MathLabel tex="U_-" /> fixo, considera-se <MathLabel tex="\mathcal{H}^{\mathrm{forw}}(U_-)" />. A interseção da superfície saturada resultante com a sônica esquerda <MathLabel tex="\mathcal{S}^-" /> determina <MathLabel tex="\mathcal{BT}^-" />:
    </p>

    <div className="tooltip-equation"><MathLabel tex="\mathcal{BT}^-=\mathcal{S}^-\cap\operatorname{sat}_{\mathrm{forw}}(\mathcal{E})" />.</div>

    <p>
      Portanto,
    </p>

    <div className="tooltip-equation"><MathLabel tex="\mathcal{BT}^-=\operatorname{ext}_-(\mathcal{E})=\mathcal{S}^-\cap\operatorname{sat}_{\mathrm{forw}}(\mathcal{E})" />.</div>

    <p>
      A curva <MathLabel tex="\mathcal{BT}^-" /> separa as partes lenta <MathLabel tex="\mathcal{S}^-_s" /> e rápida <MathLabel tex="\mathcal{S}^-_f" /> da superfície sônica esquerda.
    </p>
  </>
),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showExtensionCoincidencePlus}
            onChange={setShowExtensionCoincidencePlus}
            color={waveColors.extensionCoincidencePlus}
            label={<><MathLabel tex="\mathcal{BT}^{+}" /><span> : Bogdanov-Takens Direita</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{BT}^+" /><span> — Bogdanov-Takens Direita (Sonic Fold ?)</span></>,
description: (
  <>
    <p>
      A curva de Bogdanov-Takens direita <MathLabel tex="\mathcal{BT}^+" /> é a extensão direita da curva de coincidência <MathLabel tex="\mathcal{E}" />:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\mathcal{BT}^+=\operatorname{ext}_+(\mathcal{E})" />.
    </div>

    <p>
      Para construí-la, a curva <MathLabel tex="\mathcal{E}" /> é saturada
      pelas curvas de Hugoniot backward <MathLabel tex="\mathcal{H}^{\mathrm{back}}(U_+)" />.
    </p>

    <p>
      Para cada ponto <MathLabel tex="P\in\mathcal{E}" />, toma-se o estado
      direito
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="U_+=\pi_+(P)" />.
    </div>

    <p>
      Mantendo <MathLabel tex="U_+" /> fixo, considera-se <MathLabel tex="\mathcal{H}^{\mathrm{back}}(U_+)" />. A interseção da superfície saturada resultante com a sônica direita <MathLabel tex="\mathcal{S}^+" /> determina <MathLabel tex="\mathcal{BT}^+" />:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\mathcal{BT}^+=\mathcal{S}^+\cap\operatorname{sat}_{\mathrm{back}}(\mathcal{E})" />.
    </div>

    <p>
      Portanto,
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\mathcal{BT}^+=\operatorname{ext}_+(\mathcal{E})=\mathcal{S}^+\cap\operatorname{sat}_{\mathrm{back}}(\mathcal{E})" />.
    </div>

    <p>
      A curva <MathLabel tex="\mathcal{BT}^+" /> separa as partes lenta <MathLabel tex="\mathcal{S}^+_s" /> e rápida <MathLabel tex="\mathcal{S}^+_f" /> da superfície sônica direita.
    </p>
  </>
),
              documentation: "curvas",
            }}
          />
        </div>
      </Section>
      <Section title="Curvas de autointerseção" defaultOpen={true} accent="#f0abfc">
        <div className="toggle-grid">
          <Toggle
            checked={showLeftHysteresisSelfIntersection}
            onChange={setShowLeftHysteresisSelfIntersection}
            color={waveColors.leftHysteresisSelfIntersection}
            label={<><MathLabel tex="\operatorname{sat}_{\mathrm{back}}^*(\mathcal{Hys}^-)" /><span> : Autointerseção da Saturação Backward</span></>}
            helper={{
              title: <><MathLabel tex="\operatorname{sat}_{\mathrm{back}}^{*}(\operatorname{Hys}^-)" /><span> — Autointerseção da Saturação Backward</span></>,
description: (
  <>
    <p>
      A curva <MathLabel tex="\operatorname{sat}_{\mathrm{back}}^{*}(\operatorname{Hys}^-)" /> é a autointerseção da superfície <MathLabel tex="\operatorname{sat}_{\mathrm{back}}(\operatorname{Hys}^-)" />.
    </p>

    <p>
      A superfície saturada é formada pelas curvas de Hugoniot backward
      associadas aos estados direitos dos pontos da histerese esquerda:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\operatorname{sat}_{\mathrm{back}}(\operatorname{Hys}^-)=\bigcup_{P\in\operatorname{Hys}^-}\mathcal{H}^{\mathrm{back}}(\pi_+(P))" />.
    </div>

    <p>
      Um ponto <MathLabel tex="Q" /> pertence à curva de autointerseção quando
      pertence a duas curvas de Hugoniot backward distintas dessa saturação.
      Assim, existem pontos distintos <MathLabel tex="P_1,P_2\in\operatorname{Hys}^-" /> tais que
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="Q\in\mathcal{H}^{\mathrm{back}}(\pi_+(P_1))\cap\mathcal{H}^{\mathrm{back}}(\pi_+(P_2))" />.
    </div>

    <p>
      com
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\pi_+(P_1)\neq\pi_+(P_2)" />.
    </div>

    <p>
      O asterisco <MathLabel tex="*" /> identifica essa curva de
      autointerseção da superfície saturada.
    </p>
  </>
),
              documentation: "superficies",
            }}
          />
          <Toggle
            checked={showHysteresisSelfIntersection}
            onChange={setShowHysteresisSelfIntersection}
            color={waveColors.hysteresisSelfIntersection}
            label={<><MathLabel tex="\operatorname{sat}_{\mathrm{forw}}^*(\mathcal{Hys}^+)" /><span> : Autointerseção da Saturação Forward</span></>}
            helper={{
              title: <><MathLabel tex="\operatorname{sat}_{\mathrm{forw}}^{*}(\mathcal{Hys}^+)" /><span> — Autointerseção da Saturação Forward</span></>,
description: (
  <>
    <p>
      A curva <MathLabel tex="\operatorname{sat}_{\mathrm{forw}}^{*}(\mathcal{Hys}^+)" /> é a autointerseção da superfície <MathLabel tex="\operatorname{sat}_{\mathrm{forw}}(\mathcal{Hys}^+)" />.
    </p>

    <p>
      A superfície saturada é formada pelas curvas de Hugoniot forward associadas aos estados esquerdos dos pontos da histerese direita:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\operatorname{sat}_{\mathrm{forw}}(\mathcal{Hys}^+)=\bigcup_{P\in\mathcal{Hys}^+}\mathcal{H}^{\mathrm{forw}}(\pi_-(P))" />.
    </div>

    <p>
      Um ponto <MathLabel tex="Q" /> pertence à curva de autointerseção quando
      pertence a duas curvas de Hugoniot forward distintas dessa saturação.
      Assim, existem pontos distintos <MathLabel tex="P_1,P_2\in\mathcal{Hys}^+" /> tais que
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="Q\in\mathcal{H}^{\mathrm{forw}}(\pi_-(P_1))\cap\mathcal{H}^{\mathrm{forw}}(\pi_-(P_2))" />.
    </div>

    <p>
      com
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\pi_-(P_1)\neq\pi_-(P_2)" />.
    </div>

    <p>
      O asterisco <MathLabel tex="*" /> identifica essa curva de autointerseção da superfície saturada.
    </p>
  </>
),
              documentation: "superficies",
            }}
          />
        </div>
      </Section>
      <Section title="Ondas da Família Lenta" defaultOpen={true} accent="#22c55e">
        <div className="toggle-grid">
          <Toggle
            checked={showHugoniotMinus}
            onChange={setShowHugoniotMinus}
            color={waveColors.hugoniotMinus ?? '#0f172a'}
            label={<><MathLabel tex="\mathcal{H}^{\mathrm{forw}}(U_L)" /><span> : Hugoniot Forward</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{H}^{\mathrm{forw}}(U_L)" /><span> — Hugoniot Forward</span></>,
description: (
  <>
    <p>
      A curva de Hugoniot forward <MathLabel tex="\mathcal{H}^{\mathrm{forw}}(U_L)" /> é o conjunto dos pontos <MathLabel tex="P\in\mathcal{W}" /> cujo estado esquerdo é o estado fixo <MathLabel tex="U_L" />:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\mathcal{H}^{\mathrm{forw}}(U_L)=\{P\in\mathcal{W}:\pi_-(P)=U_L\}" />.
    </div>

    <p>
      Ao longo dessa curva, o estado esquerdo permanece fixo,
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="U_-=\pi_-(P)=U_L" />.
    </div>

    <p>
      enquanto o estado direito <MathLabel tex="U_+=\pi_+(P)" /> e a velocidade de choque <MathLabel tex="s(P)" /> variam, satisfazendo a condição de Rankine-Hugoniot:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="F(U_+)-F(U_L)=s(P)(U_+-U_L)" />.
    </div>

    <p>
      Na resolução do problema de Riemann, os trechos que satisfazem as
      condições de admissibilidade podem ser selecionados como ondas de choque
      a partir de <MathLabel tex="U_L" />.
    </p>
  </>
),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showRarefactionSlow}
            onChange={setShowRarefactionSlow}
            color={waveColors.rarefactionSlow}
            label={<><MathLabel tex="\mathcal{R}_s(U_L)" /><span> : Rarefação Lenta</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{R}_s(U_L)" /><span> — Rarefação Lenta</span></>,
description: (
  <>
    <p>
      A curva de rarefação lenta <MathLabel tex="\mathcal{R}_s(U_L)" /> é a curva integral da família característica lenta que passa pelo estado <MathLabel tex="U_L" />.
    </p>

    <p>
      Se <MathLabel tex="r_s(U)" /> é o autovetor associado à velocidade
      característica lenta <MathLabel tex="\lambda_s(U)" />, a rarefação
      satisfaz
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\frac{dU}{d\xi}=r_s(U)" />.
    </div>

    <p>
      com condição inicial
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="U(0)=U_L" />.
    </div>

    <p>
      Na variedade de ondas, <MathLabel tex="\mathcal{R}_s(U_L)" /> está contida na folha característica lenta <MathLabel tex="\mathcal{C}_s" />, onde os estados esquerdo e direito coincidem:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\pi_-(P)=\pi_+(P)=U" />.
    </div>

    <p>
      Ao longo da rarefação lenta, a velocidade é a velocidade característica
      lenta:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="s(P)=\lambda_s(U)" />.
    </div>
  </>
),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showCompositeSlow}
            onChange={setShowCompositeSlow}
            color={waveColors.compositeSlow ?? waveColors.composite}
            label={<><MathLabel tex="\mathcal{K}_s(U_L)" /><span> : Composta Lenta</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{K}_s(U_L)" /><span> — Composta Lenta</span></>,
description: (
  <>
    <p>
      A curva composta lenta <MathLabel tex="\mathcal{K}_s(U_L)" /> é obtida estendendo a curva de rarefação lenta <MathLabel tex="\mathcal{R}_s(U_L)" /> até a superfície sônica esquerda <MathLabel tex="\mathcal{S}^-(U_L)" /> por meio das curvas de Hugoniot forward.
    </p>

    <p>
      Para cada ponto <MathLabel tex="P\in\mathcal{R}_s(U_L)" />, toma-se o estado esquerdo
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="U_-=\pi_-(P)" />.
    </div>

    <p>
      Mantendo <MathLabel tex="U_-" /> fixo, considera-se a curva de Hugoniot forward <MathLabel tex="\mathcal{H}^{\mathrm{forw}}(U_-)" />. A união dessas curvas define a saturação forward da rarefação lenta:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\operatorname{sat}_{\mathrm{forw}}(\mathcal{R}_s(U_L))=\bigcup_{P\in\mathcal{R}_s(U_L)}\mathcal{H}^{\mathrm{forw}}(\pi_-(P))" />.
    </div>

    <p>
      A interseção dessa superfície saturada com <MathLabel tex="\mathcal{S}^-(U_L)" /> determina a curva composta lenta:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\mathcal{K}_s(U_L)=\mathcal{S}^-(U_L)\cap\operatorname{sat}_{\mathrm{forw}}(\mathcal{R}_s(U_L))" />.
    </div>

    <p>
      Portanto, a composta lenta é a extensão esquerda da rarefação lenta:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\mathcal{K}_s(U_L)=\operatorname{ext}_-(\mathcal{R}_s(U_L))=\mathcal{S}^-(U_L)\cap\operatorname{sat}_{\mathrm{forw}}(\mathcal{R}_s(U_L))" />.
    </div>
  </>
),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showCompositeSaturatedSlow}
            onChange={setShowCompositeSaturatedSlow}
            color={waveColors.compositeSaturatedSlow ?? '#60a5fa'}
            label={<><MathLabel tex="\operatorname{sat}_{\mathrm{forw}}(\mathcal{R}_s(U_L))" /><span> : Saturação</span></>}
            helper={{
              title: <><MathLabel tex="\operatorname{sat}_{\mathrm{forw}}(\mathcal{R}_s(U_L))" /><span> — Saturação Forward da Rarefação Lenta</span></>,
description: (
  <>
    <p>
      A saturação forward da rarefação lenta <MathLabel tex="\mathcal{R}_s(U_L)" /> é a superfície obtida pela união das curvas de Hugoniot forward associadas aos estados esquerdos dos pontos da rarefação lenta.
    </p>

    <p>
      Para cada ponto <MathLabel tex="P\in\mathcal{R}_s(U_L)" />, toma-se o estado esquerdo
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="U_-=\pi_-(P)" />.
    </div>

    <p>
      Mantendo <MathLabel tex="U_-" /> fixo, considera-se a curva de Hugoniot forward <MathLabel tex="\mathcal{H}^{\mathrm{forw}}(U_-)" />.
    </p>

    <p>
      A união dessas curvas define a superfície saturada:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\operatorname{sat}_{\mathrm{forw}}(\mathcal{R}_s(U_L))=\bigcup_{P\in\mathcal{R}_s(U_L)}\mathcal{H}^{\mathrm{forw}}(\pi_-(P))" />.
    </div>

    <p>
      A interseção dessa superfície com a sônica esquerda <MathLabel tex="\mathcal{S}^-" /> determina a curva composta lenta <MathLabel tex="\mathcal{K}_s" />:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\mathcal{K}_s=\mathcal{S}^-\cap\operatorname{sat}_{\mathrm{forw}}(\mathcal{R}_s(U_L))" />.
    </div>
  </>
),
              documentation: "superficies",
            }}
          />
        </div>
      </Section>
      <Section title="Ondas da Família Rápida" defaultOpen={true} accent="#a78bfa">
        <div className="toggle-grid">
          <Toggle
            checked={showHugoniotPlus}
            onChange={setShowHugoniotPlus}
            color={waveColors.hugoniotPlus ?? '#0f172a'}
            label={<><MathLabel tex="\mathcal{H}^{\mathrm{back}}(U_R)" /><span> : Hugoniot Backward</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{H}^{\mathrm{back}}(U_R)" /><span> — Hugoniot Backward</span></>,
description: (
  <>
    <p>
      A curva de Hugoniot backward <MathLabel tex="\mathcal{H}^{\mathrm{back}}(U_R)" /> é o conjunto dos
      pontos <MathLabel tex="P\in\mathcal{W}" /> cujo estado direito é o
      estado fixo <MathLabel tex="U_R" />:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\mathcal{H}^{\mathrm{back}}(U_R)=\{P\in\mathcal{W}:\pi_+(P)=U_R\}" />.
    </div>

    <p>
      Ao longo dessa curva, o estado direito permanece fixo,
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="U_+=\pi_+(P)=U_R" />.
    </div>

    <p>
      enquanto o estado esquerdo <MathLabel tex="U_-=\pi_-(P)" /> e a velocidade de choque <MathLabel tex="s(P)" /> variam, satisfazendo a condição de
      Rankine-Hugoniot:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="F(U_R)-F(U_-)=s(P)(U_R-U_-)" />.
    </div>

    <p>
      Na resolução do problema de Riemann, os trechos que satisfazem as
      condições de admissibilidade podem ser selecionados como ondas de choque
      que chegam ao estado <MathLabel tex="U_R" />.
    </p>
  </>
),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showRarefactionFast}
            onChange={setShowRarefactionFast}
            color={waveColors.rarefactionFast}
            label={<><MathLabel tex="\mathcal{R}_f(U_R)" /><span> : Rarefação Rápida</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{R}_f(U_R)" /><span> — Rarefação Rápida</span></>,
description: (
  <>
    <p>
      A curva de rarefação rápida <MathLabel tex="\mathcal{R}_f(U_R)" /> é a curva integral da família característica rápida que passa pelo estado <MathLabel tex="U_R" />.
    </p>

    <p>
      Se <MathLabel tex="r_f(U)" /> é o autovetor associado à velocidade característica rápida <MathLabel tex="\lambda_f(U)" />, a rarefação
      satisfaz
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\frac{dU}{d\xi}=r_f(U)" />.
    </div>

    <p>
      com condição inicial
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="U(0)=U_R" />.
    </div>

    <p>
      Na variedade de ondas, <MathLabel tex="\mathcal{R}_f(U_R)" /> está contida na folha característica rápida <MathLabel tex="\mathcal{C}_f" />,
      onde os estados esquerdo e direito coincidem:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\pi_-(P)=\pi_+(P)=U" />.
    </div>

    <p>
      Ao longo da rarefação rápida, a velocidade é a velocidade característica
      rápida:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="s(P)=\lambda_f(U)" />.
    </div>
  </>
),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showCompositeFast}
            onChange={setShowCompositeFast}
            color={waveColors.compositeFast ?? waveColors.composite}
            label={<><MathLabel tex="\mathcal{K}_f(U_R)" /><span> : Composta Rápida</span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{K}_f(U_R)" /><span> — Composta Rápida</span></>,
description: (
  <>
    <p>
      A curva composta rápida <MathLabel tex="\mathcal{K}_f(U_R)" /> é obtida
      estendendo a curva de rarefação rápida <MathLabel tex="\mathcal{R}_f(U_R)" /> até a superfície sônica direita <MathLabel tex="\mathcal{S}^+" /> por meio das curvas de Hugoniot backward.
    </p>

    <p>
      Para cada ponto <MathLabel tex="P\in\mathcal{R}_f(U_R)" />, toma-se o estado
      direito
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="U_+=\pi_+(P)" />.
    </div>

    <p>
      Mantendo <MathLabel tex="U_+" /> fixo, considera-se a curva de Hugoniot backward <MathLabel tex="\mathcal{H}^{\mathrm{back}}(U_+)" />. A união dessas curvas define a saturação backward da rarefação rápida:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\operatorname{sat}_{\mathrm{back}}(\mathcal{R}_f(U_R))=\bigcup_{P\in\mathcal{R}_f(U_R)}\mathcal{H}^{\mathrm{back}}(\pi_+(P))" />.
    </div>

    <p>
      A interseção dessa superfície saturada com <MathLabel tex="\mathcal{S}^+" /> determina a curva composta rápida:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\mathcal{K}_f(U_R)=\mathcal{S}^+\cap\operatorname{sat}_{\mathrm{back}}(\mathcal{R}_f(U_R))" />.
    </div>

    <p>
      Portanto, a composta rápida é a extensão direita da rarefação rápida:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\mathcal{K}_f(U_R)=\operatorname{ext}_+(\mathcal{R}_f(U_R))=\mathcal{S}^+\cap\operatorname{sat}_{\mathrm{back}}(\mathcal{R}_f(U_R))" />.
    </div>
  </>
),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showCompositeSaturatedFast}
            onChange={setShowCompositeSaturatedFast}
            color={waveColors.compositeSaturatedFast ?? '#f472b6'}
            label={<><MathLabel tex="\operatorname{sat}_{\mathrm{back}}(\mathcal{R}_f(U_R))" /><span> : Saturação</span></>}
            helper={{
              title: <><MathLabel tex="\operatorname{sat}_{\mathrm{back}}(\mathcal{R}_f(U_R))" /><span> — Saturação Backward da Rarefação Rápida</span></>,
description: (
  <>
    <p>
      A saturação backward da rarefação rápida <MathLabel tex="\mathcal{R}_f(U_R)" /> é a superfície obtida pela união
      das curvas de Hugoniot backward associadas aos estados direitos dos
      pontos da rarefação rápida.
    </p>

    <p>
      Para cada ponto <MathLabel tex="P\in\mathcal{R}_f(U_R)" />, toma-se o
      estado direito
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="U_+=\pi_+(P)" />.
    </div>

    <p>
      Mantendo <MathLabel tex="U_+" /> fixo, considera-se a curva de
      Hugoniot backward <MathLabel tex="\mathcal{H}^{\mathrm{back}}(U_+)" />.
    </p>

    <p>
      A união dessas curvas define a superfície saturada:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\operatorname{sat}_{\mathrm{back}}(\mathcal{R}_f(U_R))=\bigcup_{P\in\mathcal{R}_f(U_R)}\mathcal{H}^{\mathrm{back}}(\pi_+(P))" />.
    </div>

    <p>
      A interseção dessa superfície com a sônica direita <MathLabel tex="\mathcal{S}^+" /> determina a curva composta rápida
      associada a <MathLabel tex="U_R" />:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\mathcal{K}_f(U_R)=\mathcal{S}^+\cap\operatorname{sat}_{\mathrm{back}}(\mathcal{R}_f(U_R))" />.
    </div>
  </>
),
              documentation: "superficies",
            }}
          />
        </div>
      </Section>
      </>)}

      <div className="visualization-bulk-actions">
        <button type="button" className="secondary-button visualization-clear-button" onClick={clearVisualizationControls}>Ocultar tudo</button>
        <button type="button" className="secondary-button visualization-clear-button" onClick={markVisualizationControls}>Mostrar tudo</button>
      </div>

      <button onClick={clearSelectedState} className="secondary-button panel-clear-button">Limpar seleções</button>
      <PhasePortraitControl />
      
      

    </aside>
  )
}


















