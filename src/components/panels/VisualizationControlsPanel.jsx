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
      <div className="wm-panel-intro">{activeView === 'state' ? 'Escolha as projeções para visualizar no espaço de estados.' : 'Escolha as superfícies e curvas da variedade de ondas.'}</div>
      <PhasePortraitControl />
      {activeView === 'state' && (
      <>
      <Section title="Referências geométricas" defaultOpen={true} accent="#38bdf8">
        <div className="state-projection-group" role="group" aria-label="Projeção no estado esquerdo">
          <div className="state-projection-heading"><MathLabel tex="\pi_-" />: estado esquerdo <MathLabel tex="U_-" /></div>
          <div className="toggle-grid">
            <Toggle
              checked={showCoincidenceMinusProjection}
              onChange={setShowCoincidenceMinusProjection}
              color={waveColors.coincidence}
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{E})`} /><span> : Coincidência</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{E})`} /><span> — Coincidência</span></>,
                description: (
                  <><p>{"Coincidência: os dois valores característicos coincidem. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
          </div>
        </div>
        <div className="state-projection-group" role="group" aria-label="Projeção no estado direito">
          <div className="state-projection-heading"><MathLabel tex="\pi_+" />: estado direito <MathLabel tex="U_+" /></div>
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
          <div className="state-projection-heading"><MathLabel tex="\pi_-" />: estado esquerdo <MathLabel tex="U_-" /></div>
          <div className="toggle-grid">
            <Toggle
              checked={showDoubleSonicMinusProjection}
              onChange={setShowDoubleSonicMinusProjection}
              color={waveColors.doubleSonic}
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{DS})`} /><span> : Dupla sônica</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{DS})`} /><span> — Dupla sônica</span></>,
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
              label={<><MathLabel tex={String.raw`\pi_-(\operatorname{Hys}^-)`} /><span> : Histerese esquerda</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\operatorname{Hys}^-)`} /><span> — Histerese esquerda</span></>,
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
              label={<><MathLabel tex={String.raw`\pi_-(\operatorname{Hys}^+)`} /><span> : Histerese direita</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\operatorname{Hys}^+)`} /><span> — Histerese direita</span></>,
                description: (
                  <><p>{"Curva de histerese na superfície sônica, associada à extensão da curva de inflexão. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
          </div>
        </div>
        <div className="state-projection-group" role="group" aria-label="Projeção no estado direito">
          <div className="state-projection-heading"><MathLabel tex="\pi_+" />: estado direito <MathLabel tex="U_+" /></div>
          <div className="toggle-grid">
            <Toggle
              checked={showDoubleSonicPlusProjection}
              onChange={setShowDoubleSonicPlusProjection}
              color={waveColors.doubleSonic}
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{DS})`} /><span> : Dupla sônica</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{DS})`} /><span> — Dupla sônica</span></>,
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
              label={<><MathLabel tex={String.raw`\pi_+(\operatorname{Hys}^-)`} /><span> : Histerese esquerda</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\operatorname{Hys}^-)`} /><span> — Histerese esquerda</span></>,
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
              label={<><MathLabel tex={String.raw`\pi_+(\operatorname{Hys}^+)`} /><span> : Histerese direita</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\operatorname{Hys}^+)`} /><span> — Histerese direita</span></>,
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
          <div className="state-projection-heading"><MathLabel tex="\pi_-" />: estado esquerdo <MathLabel tex="U_-" /></div>
          <div className="toggle-grid">
            <Toggle
              checked={showExtensionMinusMinusProjection}
              onChange={setShowExtensionMinusMinusProjection}
              color={waveColors.extensionCoincidenceMinus}
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{BT}^-)`} /><span> : Sonic Fold esquerdo</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{BT}^-)`} /><span> — Sonic Fold esquerdo</span></>,
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
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{BT}^+)`} /><span> : Sonic Fold direito</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{BT}^+)`} /><span> — Sonic Fold direito</span></>,
                description: (
                  <><p>{"Extensão da coincidência: interseção da superfície sônica com a saturação da coincidência na direção indicada. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
          </div>
        </div>
        <div className="state-projection-group" role="group" aria-label="Projeção no estado direito">
          <div className="state-projection-heading"><MathLabel tex="\pi_+" />: estado direito <MathLabel tex="U_+" /></div>
          <div className="toggle-grid">
            <Toggle
              checked={showExtensionMinusPlusProjection}
              onChange={setShowExtensionMinusPlusProjection}
              color={waveColors.extensionCoincidenceMinus}
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{BT}^-)`} /><span> : Sonic Fold esquerdo</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{BT}^-)`} /><span> — Sonic Fold esquerdo</span></>,
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
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{BT}^+)`} /><span> : Sonic Fold direito</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{BT}^+)`} /><span> — Sonic Fold direito</span></>,
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
          <div className="state-projection-heading"><MathLabel tex="\pi_-" />: estado esquerdo <MathLabel tex="U_-" /></div>
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
          <div className="state-projection-heading"><MathLabel tex="\pi_+" />: estado direito <MathLabel tex="U_+" /></div>
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
          <div className="state-projection-heading"><MathLabel tex="\pi_-" />: estado esquerdo <MathLabel tex="U_-" /></div>
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
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{R}_s(U_-))`} /><span> : Rarefação lenta</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{R}_s(U_-))`} /><span> — Rarefação lenta</span></>,
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
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{K}_s(U_-))`} /><span> : Composta lenta</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{K}_s(U_-))`} /><span> — Composta lenta</span></>,
                description: (
                  <><p>{"Curva composta construída pela extensão sônica da rarefação da família indicada. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
          </div>
        </div>
        <div className="state-projection-group" role="group" aria-label="Projeção no estado direito">
          <div className="state-projection-heading"><MathLabel tex="\pi_+" />: estado direito <MathLabel tex="U_+" /></div>
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
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{R}_s(U_-))`} /><span> : Rarefação lenta</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{R}_s(U_-))`} /><span> — Rarefação lenta</span></>,
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
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{K}_s(U_-))`} /><span> : Composta lenta</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{K}_s(U_-))`} /><span> — Composta lenta</span></>,
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
          <div className="state-projection-heading"><MathLabel tex="\pi_-" />: estado esquerdo <MathLabel tex="U_-" /></div>
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
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{R}_f(U_+))`} /><span> : Rarefação rápida</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{R}_f(U_+))`} /><span> — Rarefação rápida</span></>,
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
              label={<><MathLabel tex={String.raw`\pi_-(\mathcal{K}_f(U_+))`} /><span> : Composta rápida</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_-(\mathcal{K}_f(U_+))`} /><span> — Composta rápida</span></>,
                description: (
                  <><p>{"Curva composta construída pela extensão sônica da rarefação da família indicada. A projeção π₋ associa cada ponto ao estado esquerdo U₋."}</p></>
                ),
                documentation: "curvas",
              }}
            />
          </div>
        </div>
        <div className="state-projection-group" role="group" aria-label="Projeção no estado direito">
          <div className="state-projection-heading"><MathLabel tex="\pi_+" />: estado direito <MathLabel tex="U_+" /></div>
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
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{R}_f(U_+))`} /><span> : Rarefação rápida</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{R}_f(U_+))`} /><span> — Rarefação rápida</span></>,
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
              label={<><MathLabel tex={String.raw`\pi_+(\mathcal{K}_f(U_+))`} /><span> : Composta rápida</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\pi_+(\mathcal{K}_f(U_+))`} /><span> — Composta rápida</span></>,
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
            label={<><MathLabel tex={String.raw`\mathcal{S}^+`} /><span> : Sônica Direita </span></>}
            helper={{
              title: <><MathLabel tex="\mathcal{S}^+" /><span> — Sônica Direita </span>(<MathLabel tex="\mathcal{Son}" />)</>,
              description: (
                <>
                  <p>A superfície sônica direita <MathLabel tex="\mathcal{S}^+" /> é o conjunto dos pontos <MathLabel tex="P\in\mathcal{W}" /> nos quais a velocidade <MathLabel tex="s" /> é crítica ao longo da curva de Hugoniot forward, mantendo fixo o estado esquerdo <MathLabel tex="U_-" />:</p>
                  
                  <div className="tooltip-equation"><MathLabel tex="\mathcal{S}^+=\{P\in\mathcal{W}:ds|_{\mathcal{H}^{\mathrm{forw}}(U_-)}(P)=0\}" />.</div>
                  
                  <p>Pela condição de Bethe–Wendroff, em <MathLabel tex="\mathcal{S}^+" /> a velocidade do choque coincide com uma velocidade característica do estado direito <MathLabel tex="U_+=\pi_+(P)" />:</p>
                  
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
            label={<><MathLabel tex="\mathcal{Hopf}^-" /><span> : Hopf esquerda</span></>}
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
            label={<><MathLabel tex={String.raw`\mathcal{Hopf}^+`} /><span> : Hopf direita</span></>}
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
              title: <><MathLabel tex="\mathcal{J}" /><span> — Curva de Inflexão</span></>,
              title: <><MathLabel tex="\mathcal{J}" /><span> — Curva de Inflexão</span></>,
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
              title: <><MathLabel tex={String.raw`\mathcal{Hys}^-`} /><span> — Histerese Esquerda</span></>,
              description: (
                <><p>{"Curva de histerese na superfície sônica, associada à extensão da curva de inflexão."}</p>
                <div className="layer-help-definition"><MathLabel tex={String.raw`\mathcal{Hys}^- = \operatorname{ext}_-(\mathcal{J}) = S_-\cap\operatorname{sat}_{forw}(\mathcal{J})`} /></div></>
              ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showHysteresisRight ?? showHysteresis}
            onChange={setShowHysteresisRight ?? setShowHysteresis}
            color={waveColors.hysteresisRight ?? '#111827'}
            label={<><MathLabel tex={String.raw`\mathcal{Hys}^+`} /><span> : Histerese Direita</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{Hys}^+`} /><span> — Histerese Direita</span></>,
              description: (
                <><p>{"Curva de histerese na superfície sônica, associada à extensão da curva de inflexão."}</p>
                <div className="layer-help-definition"><MathLabel tex={String.raw`\mathcal{Hys}^+ = \operatorname{ext}_+(\mathcal{J}) = S^+\cap\operatorname{sat}_{back}(\mathcal{J})`} /></div></>
              ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showBifurcationLeft}
            onChange={setShowBifurcationLeft}
            color={waveColors.bifurcationLeft}
            label={<><MathLabel tex={String.raw`\mathcal{B}^-`} /><span> : Bifurcação Esquerda</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{B}^-`} /><span> — Bifurcação Esquerda</span></>,
              description: (
                <><p>{"Bifurcação secundária da família indicada; sua existência depende dos parâmetros do fluxo."}</p></>
              ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showBifurcationRight}
            onChange={setShowBifurcationRight}
            color={waveColors.bifurcationRight}
            label={<><MathLabel tex={String.raw`\mathcal{B}^+`} /><span> : Bifurcação Direita</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{B}^+`} /><span> — Bifurcação Direita</span></>,
              description: (
                <><p>{"Bifurcação secundária da família indicada; sua existência depende dos parâmetros do fluxo."}</p></>
              ),
              documentation: "curvas",
            }}
          />
        </div>
      </Section>
      <Section title="Saturações de histerese" defaultOpen={true} accent="#34d399">
        <div className="toggle-grid">
          <Toggle
            checked={showSaturatedLeftMinus}
            onChange={setShowSaturatedLeftMinus}
            color="#38bdf8"
            label={<><MathLabel tex={String.raw`\operatorname{sat}_{forw}(\mathcal{Hys}^-)`} /><span> : Saturação</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\operatorname{sat}_{forw}(\mathcal{Hys}^-)`} /><span> — Saturação</span></>,
              description: (
                <><p>{"União das folhas de Hugoniot que passam pela curva geradora. Forward mantém o estado esquerdo fixo; backward mantém o direito."}</p>
                <div className="layer-help-definition"><MathLabel tex={String.raw`\operatorname{sat}_{forw}(\mathcal{Hys}^-) = \cup_{U_-\in\pi_-(\mathcal{Hys}^-)}\mathcal{H}^{forw}(U_-)`} /></div></>
              ),
              documentation: "superficies",
            }}
          />
          <Toggle
            checked={showSaturatedLeftPlus}
            onChange={setShowSaturatedLeftPlus}
            color="#e879f9"
            label={<><MathLabel tex={String.raw`\operatorname{sat}_{back}(\mathcal{Hys}^-)`} /><span> : Saturação</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\operatorname{sat}_{back}(\mathcal{Hys}^-)`} /><span> — Saturação</span></>,
              description: (
                <><p>{"União das folhas de Hugoniot que passam pela curva geradora. Forward mantém o estado esquerdo fixo; backward mantém o direito."}</p>
                <div className="layer-help-definition"><MathLabel tex={String.raw`\operatorname{sat}_{back}(\mathcal{Hys}^-) = \cup_{U_+\in\pi_+(\mathcal{Hys}^-)}\mathcal{H}^{back}(U_+)`} /></div></>
              ),
              documentation: "superficies",
            }}
          />
          <Toggle
            checked={showSaturated}
            onChange={setShowSaturated}
            color="#f97316"
            label={<><MathLabel tex={String.raw`\operatorname{sat}_{forw}(\mathcal{Hys}^+)`} /><span> : Saturação</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\operatorname{sat}_{forw}(\mathcal{Hys}^+)`} /><span> — Saturação</span></>,
              description: (
                <><p>{"União das folhas de Hugoniot que passam pela curva geradora. Forward mantém o estado esquerdo fixo; backward mantém o direito."}</p>
                <div className="layer-help-definition"><MathLabel tex={String.raw`\operatorname{sat}_{forw}(\mathcal{Hys}^+) = \cup_{U_-\in\pi_-(\mathcal{Hys}^+)}\mathcal{H}^{forw}(U_-)`} /></div></>
              ),
              documentation: "superficies",
            }}
          />
          <Toggle
            checked={showSaturatedPlus}
            onChange={setShowSaturatedPlus}
            color="#34d399"
            label={<><MathLabel tex={String.raw`\operatorname{sat}_{back}(\mathcal{Hys}^+)`} /><span> : Saturação</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\operatorname{sat}_{back}(\mathcal{Hys}^+)`} /><span> — Saturação</span></>,
              description: (
                <><p>{"União das folhas de Hugoniot que passam pela curva geradora. Forward mantém o estado esquerdo fixo; backward mantém o direito."}</p>
                <div className="layer-help-definition"><MathLabel tex={String.raw`\operatorname{sat}_{back}(\mathcal{Hys}^+) = \cup_{U_+\in\pi_+(\mathcal{Hys}^+)}\mathcal{H}^{back}(U_+)`} /></div></>
              ),
              documentation: "superficies",
            }}
          />
        </div>
      </Section>
      <Section title="Saturações e extensões da coincidência" defaultOpen={true} accent="#22d3ee">
        <div className="toggle-grid">
          <Toggle
            checked={showSaturatedCoincidence}
            onChange={setShowSaturatedCoincidence}
            color={waveColors.saturatedCoincidence}
            label={<><MathLabel tex={String.raw`\operatorname{sat}_{forw}(\mathcal{E})`} /><span> : Saturação</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\operatorname{sat}_{forw}(\mathcal{E})`} /><span> — Saturação</span></>,
              description: (
                <><p>{"União das folhas de Hugoniot que passam pela curva geradora. Forward mantém o estado esquerdo fixo; backward mantém o direito."}</p></>
              ),
              documentation: "superficies",
            }}
          />
          <Toggle
            checked={showSaturatedCoincidencePlus}
            onChange={setShowSaturatedCoincidencePlus}
            color={waveColors.saturatedCoincidencePlus}
            label={<><MathLabel tex={String.raw`\operatorname{sat}_{back}(\mathcal{E})`} /><span> : Saturação</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\operatorname{sat}_{back}(\mathcal{E})`} /><span> — Saturação</span></>,
              description: (
                <><p>{"União das folhas de Hugoniot que passam pela curva geradora. Forward mantém o estado esquerdo fixo; backward mantém o direito."}</p></>
              ),
              documentation: "superficies",
            }}
          />
          <Toggle
            checked={showExtensionCoincidenceMinus}
            onChange={setShowExtensionCoincidenceMinus}
            color={waveColors.extensionCoincidenceMinus}
            label={<><MathLabel tex={String.raw`\mathcal{BT}^{-}`} /><span> : Sonic Fold</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{BT}^{-}`} /><span> — Sonic Fold</span></>,
              description: (
                <><p>{"Extensão da coincidência: interseção da superfície sônica com a saturação da coincidência na direção indicada."}</p>
                <div className="layer-help-definition"><MathLabel tex={String.raw`\mathcal{BT}^{-}=\operatorname{ext}_-(\mathcal{E})=\mathcal{S}^-\cap\operatorname{sat}_{forw}(\mathcal{E})`} /></div></>
              ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showExtensionCoincidencePlus}
            onChange={setShowExtensionCoincidencePlus}
            color={waveColors.extensionCoincidencePlus}
            label={<><MathLabel tex={String.raw`\mathcal{BT}^{+}`} /><span> : Sonic Fold</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{BT}^{+}`} /><span> — Sonic Fold</span></>,
              description: (
                <><p>{"Extensão da coincidência: interseção da superfície sônica com a saturação da coincidência na direção indicada."}</p>
                <div className="layer-help-definition"><MathLabel tex={String.raw`\mathcal{BT}^{+}=\operatorname{ext}_+(\mathcal{E})=\mathcal{S}^+\cap\operatorname{sat}_{back}(\mathcal{E})`} /></div></>
              ),
              documentation: "curvas",
            }}
          />
        </div>
      </Section>
      <Section title="Curvas de autointerseção" defaultOpen={true} accent="#f0abfc">
        <div className="toggle-grid">
          <Toggle
            checked={showHysteresisSelfIntersection}
            onChange={setShowHysteresisSelfIntersection}
            color={waveColors.hysteresisSelfIntersection}
            label={<><MathLabel tex={String.raw`\operatorname{sat}_{forw}^*(\mathcal{Hys}^+)`} /><span> : Autointerseção</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\operatorname{sat}_{forw}^*(\mathcal{Hys}^+)`} /><span> — Autointerseção</span></>,
              description: (
                <><p>{"Lugar onde folhas geradas por pontos distintos da histerese se encontram, compartilhando o mesmo estado fixo."}</p></>
              ),
              documentation: "superficies",
            }}
          />
          <Toggle
            checked={showLeftHysteresisSelfIntersection}
            onChange={setShowLeftHysteresisSelfIntersection}
            color={waveColors.leftHysteresisSelfIntersection}
            label={<><MathLabel tex={String.raw`\operatorname{sat}_{back}^*(\mathcal{Hys}^-)`} /><span> : Autointerseção</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\operatorname{sat}_{back}^*(\mathcal{Hys}^-)`} /><span> — Autointerseção</span></>,
              description: (
                <><p>{"Lugar onde folhas geradas por pontos distintos da histerese se encontram, compartilhando o mesmo estado fixo."}</p></>
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
            label={<><MathLabel tex={String.raw`\mathcal{H}^{forw}(U_L)`} /><span> : Hugoniot Forward</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{H}^{forw}(U_L)`} /><span> — Hugoniot Forward</span></>,
              description: (
                <><p>{"Folha de Hugoniot: estados ligados pela condição de Rankine–Hugoniot, com um dos estados fixo."}</p></>
              ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showRarefactionSlow}
            onChange={setShowRarefactionSlow}
            color={waveColors.rarefactionSlow}
            label={<><MathLabel tex={String.raw`\mathcal{R}_s(U_L)`} /><span> : Rarefação Lenta</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{R}_s(U_L)`} /><span> — Rarefação Lenta</span></>,
              description: (
                <><p>{"Curva integral do campo característico da família indicada, a partir do estado selecionado."}</p></>
              ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showCompositeSlow}
            onChange={setShowCompositeSlow}
            color={waveColors.compositeSlow ?? waveColors.composite}
            label={<><MathLabel tex={String.raw`\mathcal{K}_s`} /><span> : Composta Lenta</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{K}_s`} /><span> — Composta Lenta</span></>,
              description: (
                <><p>{"Curva composta construída pela extensão sônica da rarefação da família indicada."}</p>
                <div className="layer-help-definition"><MathLabel tex={String.raw`\mathcal{K}_s =ext_-(\mathcal{R}_s) =\mathcal{S}^-\cap\operatorname{sat}_{forw}(\mathcal{R}_s)`} /></div></>
              ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showCompositeSaturatedSlow}
            onChange={setShowCompositeSaturatedSlow}
            color={waveColors.compositeSaturatedSlow ?? '#60a5fa'}
            label={<><MathLabel tex={String.raw`\operatorname{sat}_{forw}(\mathcal{R}_s)`} /><span> : Saturação</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\operatorname{sat}_{forw}(\mathcal{R}_s)`} /><span> — Saturação</span></>,
              description: (
                <><p>{"União das folhas de Hugoniot que passam pela curva geradora. Forward mantém o estado esquerdo fixo; backward mantém o direito."}</p>
                <div className="layer-help-definition"><MathLabel tex={String.raw`\operatorname{sat}_{forw}(\mathcal{R}_s) = \cup_{U_-\in\mathcal{R}_s}\mathcal{H}^{forw}(U_-)`} /></div></>
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
            label={<><MathLabel tex={String.raw`\mathcal{H}^{back}(U_R)`} /><span> : Hugoniot Backward</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{H}^{back}(U_R)`} /><span> — Hugoniot Backward</span></>,
              description: (
                <><p>{"Folha de Hugoniot: estados ligados pela condição de Rankine-Hugoniot, com um dos estados fixo."}</p></>
              ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showRarefactionFast}
            onChange={setShowRarefactionFast}
            color={waveColors.rarefactionFast}
            label={<><MathLabel tex={String.raw`\mathcal{R}_f(U_R)`} /><span> : Rarefação Rápida</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{R}_f(U_R)`} /><span> — Rarefação Rápida</span></>,
              description: (
                <><p>{"Curva integral do campo característico da família indicada, a partir do estado selecionado."}</p></>
              ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showCompositeFast}
            onChange={setShowCompositeFast}
            color={waveColors.compositeFast ?? waveColors.composite}
            label={<><MathLabel tex={String.raw`\mathcal{K}_f`} /><span> : Composta Rápida</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{K}_f`} /><span> — Composta Rápida</span></>,
              description: (
                <><p>{"Curva composta construída pela extensão sônica da rarefação da família indicada."}</p>
                <div className="layer-help-definition"><MathLabel tex={String.raw`\mathcal{K}_f =ext_+(\mathcal{R}_f) =\mathcal{S}^+\cap\operatorname{sat}_{back}(\mathcal{R}_f)`} /></div></>
              ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showCompositeSaturatedFast}
            onChange={setShowCompositeSaturatedFast}
            color={waveColors.compositeSaturatedFast ?? '#f472b6'}
            label={<><MathLabel tex={String.raw`\operatorname{sat}_{back}(\mathcal{R}_f)`} /><span> : Saturação</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\operatorname{sat}_{back}(\mathcal{R}_f)`} /><span> — Saturação</span></>,
              description: (
                <><p>{"União das folhas de Hugoniot que passam pela curva geradora. Forward mantém o estado esquerdo fixo; backward mantém o direito."}</p>
                <div className="layer-help-definition"><MathLabel tex={String.raw`\operatorname{sat}_{back}(\mathcal{R}_f) = \cup_{U_+\in\mathcal{R}_f}\mathcal{H}^{back}(U_+)`} /></div></>
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

      
      

    </aside>
  )
}


















