import React from 'react'
import MathLabel from './MathLabel'
import { MathVar, RangeControl, Section } from './PanelPrimitives'

export default function OverlaySettingsPanel({
  schaefferShearerCases,
  selectedSchaefferShearerCase,
  applySchaefferShearerCase,
  displayCoordinateTex,
  yScale,
  tauScale,
  zScale,
  resolution,
  opacity,
  setResolution,
  resetCaseResolution,
  setOpacity,
  updateScale,
  setYScale,
  setTauScale,
  setZScale,
  resetCaseScales,
  view,
  updateView,
  resetDrawingView,
  onClose,
}) {
  return (
    <aside className="wm-settings-panel wm-panel">
      <div className="settings-header">
        <strong>Configurações</strong>
        <button type="button" onClick={onClose} aria-label="Fechar configurações">x</button>
      </div>

      <Section title="Casos de Schaeffer-Shearer" defaultOpen={true} accent="#facc15">
        <div className="schaeffer-case-selector" role="radiogroup" aria-label="Casos de Schaeffer-Shearer">
          {schaefferShearerCases.map((caseItem) => (
            <label key={caseItem.key} className={`schaeffer-case-option ${selectedSchaefferShearerCase === caseItem.key ? 'active' : ''}`}>
              <input
                type="radio"
                name="schaeffer-shearer-case"
                value={caseItem.key}
                checked={selectedSchaefferShearerCase === caseItem.key}
                onChange={() => applySchaefferShearerCase(caseItem.key)}
              />
              <span>{caseItem.label}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Escalas e resolução" defaultOpen={true} accent="#9333ea">
        <p className="parameter-card-description">Escalas, resolução e janela do caso {schaefferShearerCases.find((item) => item.key === selectedSchaefferShearerCase)?.label} são salvas automaticamente neste navegador para a próxima abertura.</p>
        <RangeControl label={<><span>Escala visual de </span><MathLabel tex="Y" /></>} min={0.5} max={2} step={0.1} value={yScale} onChange={(v) => updateScale('yScale', v, setYScale)} />
        <RangeControl label={<><span>Escala visual de </span><MathLabel tex={displayCoordinateTex.tau} /></>} min={0.5} max={6} step={0.1} value={tauScale} onChange={(v) => updateScale('tauScale', v, setTauScale)} />
        <RangeControl label={<><span>Escala visual de </span><MathLabel tex="\hat z" /></>} min={1} max={6} step={0.1} value={zScale} onChange={(v) => updateScale('zScale', v, setZScale)} />
        <RangeControl label="Resolução" min={32} max={88} step={4} value={resolution} onChange={setResolution} />
        <RangeControl label="Opacidade" min={0.1} max={1.0} step={0.05} value={opacity} onChange={setOpacity} />
        <button type="button" onClick={() => { resetCaseScales(); resetCaseResolution() }} className="primary-button">Redefinir escalas e resolução</button>
      </Section>

      <Section title="Janela de desenho" defaultOpen={true} accent="#64748b">
        <RangeControl label={<MathLabel tex="Y_{\min}" />} min={-10} max={-0.5} step={0.5} value={view.yMin} onChange={(v) => updateView('yMin', v)} />
        <RangeControl label={<MathLabel tex="Y_{\max}" />} min={0.5} max={10} step={0.5} value={view.yMax} onChange={(v) => updateView('yMax', v)} />
        <RangeControl label={<MathLabel tex="\tau_{\min}" />} min={-2} max={0} step={0.5} value={view.tMin} onChange={(v) => updateView('tMin', v)} />
        <RangeControl label={<MathLabel tex="\tau_{\max}" />} min={0} max={2} step={0.5} value={view.tMax} onChange={(v) => updateView('tMax', v)} />
        <button type="button" onClick={resetDrawingView} className="primary-button">Redefinir janela do caso</button>
      </Section>
    </aside>
  )
}
