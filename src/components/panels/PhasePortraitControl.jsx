import { usePhasePortrait } from '../../app/inspection/PhasePortraitContext.js'
import { Toggle } from './PanelPrimitives'

const layers = [
  ['equilibria', 'Equilíbrios', 'Pontos de equilíbrio e classificação', '#4ade80'],
  ['invariantManifolds', 'Separatrizes', 'Wˢ estável · Wᵘ instável', '#fbbf24'],
  ['nullclines', 'Nulclinas', 'Curvas onde u′ = 0 ou v′ = 0', '#a78bfa'],
  ['eigenDirections', 'Autodireções', 'Direções locais nos equilíbrios', '#f8fafc'],
]

export default function PhasePortraitControl() {
  const phase = usePhasePortrait()
  if (!phase || !['3d', 'state'].includes(phase.activeView)) return null
  if (phase.activeView === '3d') return <div className="phase-controls">
    <strong>Retrato de fase</strong>
    <Toggle checked={phase.checked} disabled={!phase.valid} onChange={phase.setEnabled} color="#22d3ee" label="Rarefação" />
    <Toggle checked={phase.compositeEnabled} onChange={phase.setCompositeEnabled} color="#fda4af" label="Composta K₋" />
    <p className="phase-controls-summary">{phase.valid ? 'Integrais globais de C e suas compostas sobre S⁻.' : 'Ative C para mostrar a rarefação. A composta pode ser exibida sozinha.'}</p>
    {(phase.checked || phase.compositeEnabled) && <fieldset className="phase-layers"><legend>Elementos da rarefação</legend>
      {[['singularities', 'Singularidades'], ['separatrices', 'Separatrizes'], ['eigenDirections', 'Autodireções']].map(([key, label]) =>
        <label className="phase-layer" key={key}><input type="checkbox" checked={phase.rarefactionOptions[key]} onChange={e => phase.setRarefactionOption(key, e.target.checked)} /><span>{label}</span></label>)}
      {phase.rarefactionOptions.separatrices && <small>Estável (azul) e instável (âmbar) no campo regularizado da carta indicada.</small>}
    </fieldset>}
  </div>
  return <div className="phase-controls">
    <Toggle checked={phase.checked} disabled={!phase.valid} onChange={phase.setEnabled} color="#22d3ee" label="Retrato de Fase" />
    <p className="phase-controls-summary">{phase.activeView === '3d'
      ? phase.valid ? 'Curvas integrais sobre a característica, sem selecionar pontos.' : 'Ative a superfície característica.'
      : !phase.valid ? 'Selecione U_L e U_R para ativar.'
        : `Velocidade de U_L · s = ${phase.viscous.speed.toPrecision(5)}`}</p>
    {phase.activeView === 'state' && phase.checked && <>
      <div className="phase-view-switch" role="group" aria-label="Visualização do retrato viscoso">
        <button type="button" aria-pressed={!phase.viscousOptions.connectionOnly} onClick={() => phase.setViscousOption('connectionOnly', false)}>Retrato completo</button>
        <button type="button" aria-pressed={phase.viscousOptions.connectionOnly} onClick={() => phase.setViscousOption('connectionOnly', true)}>Conexão U_L → U_R</button>
      </div>
      <fieldset className="phase-layers"><legend>Elementos visíveis</legend>
        {layers.map(([key, label, description, color]) => <label className="phase-layer" key={key}>
          <input type="checkbox" checked={phase.viscousOptions[key]} onChange={event => phase.setViscousOption(key, event.target.checked)} />
          <span className="phase-layer-color" style={{ background: color }} />
          <span><strong>{label}</strong><small>{description}</small></span>
        </label>)}
      </fieldset>
      <p className="phase-controls-hint">Arraste U_R no gráfico para explorar a conexão. O estado e o resíduo atualizados aparecem junto ao gráfico.</p>
    </>}
  </div>
}
