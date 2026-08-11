import React from 'react'
import MathLabel from './MathLabel'
import { MathVar, RangeControl, Section } from './PanelPrimitives'

export default function OverlaySettingsPanel({
  schaefferShearerCases,
  selectedSchaefferShearerCase,
  applySchaefferShearerCase,
  displayCoordinateTex,
  yScale,
  tScale,
  zScale,
  resolution,
  opacity,
  setResolution,
  setOpacity,
  updateScale,
  setYScale,
  setTScale,
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
        <button type="button" onClick={onClose} aria-label="Fechar configurações">×</button>
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
        <RangeControl label={<><span>Escala visual de </span><MathVar tex="Y" /></>} min={0.5} max={2} step={0.1} value={yScale} onChange={(v) => updateScale('yScale', v, setYScale)} />
        <RangeControl label={<><span>Escala visual de </span><MathVar tex={displayCoordinateTex.tau} /></>} min={0.5} max={6} step={0.1} value={tScale} onChange={(v) => updateScale('tScale', v, setTScale)} />
        <RangeControl label={<><span>Escala visual de </span><MathVar tex="z" /></>} min={1} max={6} step={0.1} value={zScale} onChange={(v) => updateScale('zScale', v, setZScale)} />
        <RangeControl label="Resolução" min={32} max={88} step={4} value={resolution} onChange={setResolution} />
        <RangeControl label="Opacidade" min={0.1} max={1.0} step={0.05} value={opacity} onChange={setOpacity} />
        <button type="button" onClick={resetCaseScales} className="primary-button">Redefinir escalas do caso</button>
      </Section>

      <Section title="Janela de desenho" defaultOpen={true} accent="#64748b">
        <RangeControl label={<MathVar tex="Y_{\\min}" />} min={-10} max={-0.5} step={0.5} value={view.yMin} onChange={(v) => updateView('yMin', v)} />
        <RangeControl label={<MathVar tex="Y_{\\max}" />} min={0.5} max={10} step={0.5} value={view.yMax} onChange={(v) => updateView('yMax', v)} />
        <RangeControl label={<MathVar tex="\tau_{\\min}" />} min={-2} max={0} step={0.5} value={view.tMin} onChange={(v) => updateView('tMin', v)} />
        <RangeControl label={<MathVar tex="\tau_{\\max}" />} min={0} max={2} step={0.5} value={view.tMax} onChange={(v) => updateView('tMax', v)} />
        <RangeControl label={<MathVar tex="z_{\\min}" />} min={-5} max={0} step={0.1} value={view.zMin} onChange={(v) => updateView('zMin', v)} />
        <RangeControl label={<MathVar tex="z_{\\max}" />} min={0} max={5} step={0.1} value={view.zMax} onChange={(v) => updateView('zMax', v)} />
        <button onClick={resetDrawingView} className="primary-button">Resetar janela</button>
      </Section>
    </aside>
  )
}
