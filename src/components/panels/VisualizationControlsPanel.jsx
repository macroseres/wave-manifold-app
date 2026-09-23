import MathLabel from './MathLabel'
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
                  <p>Como <MathLabel tex="\mathcal{C} = \{Y=0\}" /> e, neste modelo, a coincidência corresponde a <MathLabel tex="\tau=0" />, temos:</p>
                  <div className="tooltip-equation"><MathLabel tex="\mathcal{E} = \{(\tau, Y, z)\in\mathcal{W} : Y=0, \tau = 0\}" />.</div>
                  <p>Se <MathLabel tex="P\in\mathcal{C}" />, as duas projeções representam o mesmo estado:</p>
                  <div className="tooltip-equation"><MathLabel tex="\pi_-(P) = \pi_+(P) = U" />.</div>
                  <p>A coincidência reúne os pontos em que as velocidades características lenta e rápida desse estado são iguais:</p>
                  <div className="tooltip-equation"><MathLabel tex="\mathcal{E} = \{P\in\mathcal{C} : \lambda_s(\pi(P)) = \lambda_f(\pi(P))\}" />.</div>
                  <p>Na superfície característica, usamos a projeção comum:</p>
                  <div className="tooltip-equation"><MathLabel tex="\pi = \pi_-|_{\mathcal{C}} = \pi_+|_{\mathcal{C}}" />.</div>
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
              title: <><MathLabel tex="\mathcal{C}=\mathcal{C}_s\cup\mathcal{E}\cup\mathcal{C}_f" /><span> — Características</span></>,
              description: (
                <><p>Plano característico <MathLabel tex="Y=0" /> em <MathLabel tex="(\tau,Y,\hat{z})" />, dividido nas folhas lenta <MathLabel tex="\mathcal{C}_s" /> e rápida <MathLabel tex="\mathcal{C}_f" />.</p></>
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
            label={<><MathLabel tex={String.raw`\mathcal{S}^-`} /><span> : Sônica Esquerda</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{S}^-`} /><span> — Sônica Esquerda</span></>,
              description: (
                <><p>{"Superfície sônica: a velocidade de choque coincide com uma velocidade característica do estado indicado."}</p>
                <div className="layer-help-definition"><MathLabel tex={String.raw`\mathcal{S}^- = \mathcal{S}^-_s\cup\mathcal{BT}^-
          \cup\mathcal{S}^-_f`} /></div>
                <>
                  <section className="layer-help-section">
                    <strong>Definição</strong>
                    <div><MathLabel tex={String.raw`\sigma(U_-,U_+)=\lambda_i(U_-),\quad i\in\{s,f\}`} /></div>
                    <p>{"A velocidade do choque é igual à velocidade característica do estado "}{"esquerdo"}{"."}</p>
                  </section>
                  <section className="layer-help-section">
                    <strong>Estacionariedade na Hugoniot</strong>
                    <div><MathLabel tex={String.raw`\left.\frac{d}{d\xi}\sigma(\gamma(\xi))\right|_{\xi=\xi_*}=0,\quad \gamma(\xi)\in\mathcal H^{back}(U_+)`} /></div>
                    <p>{"Ao longo dessa folha de Hugoniot, a velocidade do choque é estacionária no ponto sônico. O parâmetro ξ percorre a folha, mantendo o estado "}{"direito"}{" fixo."}</p>
                  </section>
                </></>
              ),
              documentation: "superficies",
            }}
          />
          <Toggle
            checked={showSonicRight}
            onChange={setShowSonicRight}
            color={waveColors.sonicRightFast}
            label={<><MathLabel tex={String.raw`\mathcal{S}^+`} /><span> : Sônica Direita</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{S}^+`} /><span> — Sônica Direita</span></>,
              description: (
                <><p>{"Superfície sônica: a velocidade de choque coincide com uma velocidade característica do estado indicado."}</p>
                <div className="layer-help-definition"><MathLabel tex={String.raw`\mathcal{S}^+ = \mathcal{S}^+_s\cup\mathcal{BT}^+
          \cup\mathcal{S}^+_f`} /></div>
                <>
                  <section className="layer-help-section">
                    <strong>Definição</strong>
                    <div><MathLabel tex={String.raw`\sigma(U_-,U_+)=\lambda_i(U_+),\quad i\in\{s,f\}`} /></div>
                    <p>{"A velocidade do choque é igual à velocidade característica do estado "}{"direito"}{"."}</p>
                  </section>
                  <section className="layer-help-section">
                    <strong>Estacionariedade na Hugoniot</strong>
                    <div><MathLabel tex={String.raw`\left.\frac{d}{d\xi}\sigma(\gamma(\xi))\right|_{\xi=\xi_*}=0,\quad \gamma(\xi)\in\mathcal H^{forw}(U_-)`} /></div>
                    <p>{"Ao longo dessa folha de Hugoniot, a velocidade do choque é estacionária no ponto sônico. O parâmetro ξ percorre a folha, mantendo o estado "}{"esquerdo"}{" fixo."}</p>
                  </section>
                </></>
              ),
              documentation: "superficies",
            }}
          />
          <Toggle
            checked={showHopfMinus}
            onChange={setShowHopfMinus}
            color={waveColors.hopfMinus}
            label={<><MathLabel tex={String.raw`\mathcal{Hopf}^-`} /><span> : Hopf esquerda</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{Hopf}^-`} /><span> — Hopf esquerda</span></>,
              description: (
                <><p>{"Superfície de Hopf: traço nulo da matriz correspondente, restrito à região elíptica."}</p></>
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
              title: <><MathLabel tex={String.raw`\mathcal{Hopf}^+`} /><span> — Hopf direita</span></>,
              description: (
                <><p>{"Superfície de Hopf: traço nulo da matriz correspondente, restrito à região elíptica."}</p></>
              ),
              documentation: "superficies",
            }}
          />
        </div>
      </Section>
      <Section title="Curvas especiais" defaultOpen={true} accent="#facc15">
        <div className="toggle-grid">
          <Toggle
            checked={showDoubleSonic}
            onChange={setShowDoubleSonic}
            color={waveColors.doubleSonic}
            label={<><MathLabel tex={String.raw`\mathcal{DS}`} /><span> : Dupla Sônica</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{DS}`} /><span> — Dupla Sônica</span></>,
              description: (
                <><p>{"Dupla sônica: a velocidade de choque é característica nos dois estados."}</p></>
              ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showInflectionSlow || showInflectionFast}
            onChange={(checked) => { setShowInflectionSlow(checked); setShowInflectionFast(checked) }}
            color={waveColors.inflection ?? waveColors.inflectionSlow}
            label={<><MathLabel tex={String.raw`\mathcal{J}`} /><span> : Inflexões</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{J}`} /><span> — Inflexões</span></>,
              description: (
                <><p>{"Inflexão: lugar onde a velocidade característica é estacionária ao longo da rarefação."}</p></>
              ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showHysteresisLeft ?? showHysteresis}
            onChange={setShowHysteresisLeft ?? setShowHysteresis}
            color={waveColors.hysteresisLeft ?? '#64748b'}
            label={<><MathLabel tex={String.raw`\mathcal{Hys}^-`} /><span> : Histerese Esquerda</span></>}
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
            label={<><MathLabel tex={String.raw`\mathcal{H}^{forw}(U_-)`} /><span> : Hugoniot Forward</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{H}^{forw}(U_-)`} /><span> — Hugoniot Forward</span></>,
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
            label={<><MathLabel tex={String.raw`\mathcal{R}_s(U_-)`} /><span> : Rarefação Lenta</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{R}_s(U_-)`} /><span> — Rarefação Lenta</span></>,
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
            label={<><MathLabel tex={String.raw`\mathcal{H}^{back}(U_+)`} /><span> : Hugoniot Backward</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{H}^{back}(U_+)`} /><span> — Hugoniot Backward</span></>,
              description: (
                <><p>{"Folha de Hugoniot: estados ligados pela condição de Rankine–Hugoniot, com um dos estados fixo."}</p></>
              ),
              documentation: "curvas",
            }}
          />
          <Toggle
            checked={showRarefactionFast}
            onChange={setShowRarefactionFast}
            color={waveColors.rarefactionFast}
            label={<><MathLabel tex={String.raw`\mathcal{R}_f(U_+)`} /><span> : Rarefação Rápida</span></>}
            helper={{
              title: <><MathLabel tex={String.raw`\mathcal{R}_f(U_+)`} /><span> — Rarefação Rápida</span></>,
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


















