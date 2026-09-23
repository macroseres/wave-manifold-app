import MathLabel from './MathLabel'
import { controlsForCase } from './schaefferShearerConfig.js'
import { RangeControl, Section } from './PanelPrimitives'

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
  const controls = controlsForCase(selectedSchaefferShearerCase)
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
        <RangeControl label={<><span>Escala visual de </span><MathLabel tex="Y" /></>} {...controls.yScale} value={yScale} onChange={(v) => updateScale('yScale', v, setYScale)} />
        <RangeControl label={<><span>Escala visual de </span><MathLabel tex={displayCoordinateTex.tau} /></>} {...controls.tauScale} value={tauScale} onChange={(v) => updateScale('tauScale', v, setTauScale)} />
        <RangeControl label={<><span>Escala visual de </span><MathLabel tex="\hat z" /></>} {...controls.zScale} value={zScale} onChange={(v) => updateScale('zScale', v, setZScale)} />
        <RangeControl label="Resolução" {...controls.resolution} value={resolution} onChange={setResolution} />
        <RangeControl label="Opacidade" {...controls.opacity} value={opacity} onChange={setOpacity} />
        <button type="button" onClick={() => { resetCaseScales(); resetCaseResolution() }} className="primary-button">Redefinir escalas e resolução</button>
      </Section>

      <Section title="Janela de desenho" defaultOpen={true} accent="#64748b">
        <RangeControl label={<MathLabel tex="Y_{\min}" />} {...controls.yMin} value={view.yMin} onChange={(v) => updateView('yMin', v)} />
        <RangeControl label={<MathLabel tex="Y_{\max}" />} {...controls.yMax} value={view.yMax} onChange={(v) => updateView('yMax', v)} />
        <RangeControl label={<MathLabel tex="\tau_{\min}" />} {...controls.tMin} value={view.tMin} onChange={(v) => updateView('tMin', v)} />
        <RangeControl label={<MathLabel tex="\tau_{\max}" />} {...controls.tMax} value={view.tMax} onChange={(v) => updateView('tMax', v)} />
        <button type="button" onClick={resetDrawingView} className="primary-button">Redefinir janela do caso</button>
      </Section>
    </aside>
  )
}
