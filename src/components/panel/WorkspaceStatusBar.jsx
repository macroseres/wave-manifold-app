import React from 'react'
import MathLabel from './MathLabel'

const LEGEND = [
  { tex: 'R_-', label: 'Rarefação lenta', color: '#22c55e' },
  { tex: 'H_-', label: 'Hugoniot lenta', color: '#38bdf8' },
  { tex: 'K_-', label: 'Composta lenta', color: '#facc15' },
  { tex: 'S^-', label: 'Sônica esquerda', color: '#fb7185' },
]

function ChainTrack({ solutionModeEnabled }) {
  const steps = [
    ['U_L', 'Estado'],
    ['H_-^{loc}', 'Choque'],
    ['P_2', 'Projeção'],
    ['R_-^{nloc}', 'Rarefação'],
    ['J_{nloc}', 'Inflexão'],
    ['K_-^{nloc}', 'Composta'],
  ]
  return (
    <div className={`wm-chain-track ${solutionModeEnabled ? 'active' : ''}`} aria-label="Sequência da segunda cadeia">
      {steps.map(([tex, label], index) => (
        <React.Fragment key={tex}>
          {index ? <span className="wm-chain-arrow" aria-hidden="true">→</span> : null}
          <span className="wm-chain-step" title={label}><MathLabel tex={tex} /></span>
        </React.Fragment>
      ))}
    </div>
  )
}

export default function WorkspaceStatusBar({
  selectedEntries = [],
  inspectionModeEnabled = false,
  solutionModeEnabled = false,
}) {
  const selectedBranches = new Set(selectedEntries.map((entry) => entry?.branch).filter(Boolean))
  const hasSlow = selectedBranches.has('slow')
  const hasFast = selectedBranches.has('fast')
  const ready = hasSlow && hasFast
  const status = ready
    ? solutionModeEnabled ? 'Solução ativa' : 'Estados definidos · ative Solução'
    : hasSlow || hasFast ? 'Selecione o estado da outra família' : 'Selecione Cₛ e Cᶠ para iniciar'

  return (
    <footer className="wm-statusbar">
      <div className="wm-status-summary" aria-live="polite">
        <span className={`wm-status-indicator ${ready ? 'ready' : ''}`} />
        <strong>{status}</strong>
        {inspectionModeEnabled ? <span className="wm-status-chip inspection">Inspeção</span> : null}
        {solutionModeEnabled ? <span className="wm-status-chip solution">Solução</span> : null}
      </div>
      <ChainTrack solutionModeEnabled={solutionModeEnabled} />
      <div className="wm-persistent-legend" aria-label="Legenda de curvas">
        {LEGEND.map((item) => (
          <span key={item.tex} className="wm-legend-token" title={item.label}>
            <i style={{ '--legend-color': item.color }} /><MathLabel tex={item.tex} />
          </span>
        ))}
      </div>
    </footer>
  )
}
