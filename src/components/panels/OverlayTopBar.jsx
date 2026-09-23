import React from 'react'
import MathLabel from './MathLabel'

export default function OverlayTopBar({
  activeView,
  setActiveView,
  activeViewLabel,
  activeModeLabel,
  activeModeClass,
  canEnableInspectionMode,
  inspectionModeEnabled,
  setInspectionModeEnabled,
  canEnableSolutionMode,
  solutionModeEnabled,
  setSolutionModeEnabled,
  onExportSnapshot,
  showDocumentation,
  setShowDocumentation,
  showSettingsPanel,
  setShowSettingsPanel,
}) {
  return (
    <header className="wm-topbar">
      <div className="wm-brand">
        <div className="wm-logo">W</div>
        <div>
          <div className="wm-title">Wave Manifold Explorer</div>
          <div className="wm-subtitle">Modelo quadrático 2x2</div>
        </div>
      </div>

      <nav className="wm-tabs" aria-label="Navegação principal">
        <button type="button" className={`wm-tab ${activeView === '3d' ? 'active' : ''}`} title="Abrir variedade de ondas" onClick={() => setActiveView?.('3d')}>
          <span className="wm-math-tab-label">Variedade <MathLabel tex="\mathcal{W}" /></span>
        </button>
        <button type="button" className={`wm-tab ${activeView === 'state' ? 'active' : ''}`} title="Abrir espaço de estados" onClick={() => setActiveView?.('state')}>
          <span className="wm-math-tab-label">Estados <MathLabel tex="(u,v)" /></span>
        </button>
        <button type="button" className={`wm-tab ${activeView === 'solution' ? 'active' : ''}`} title="Abrir perfil da solução" onClick={() => setActiveView?.('solution')}>
          <span className="wm-math-tab-label">Perfil <MathLabel tex="(x,t=t_0)" /></span>
        </button>
        <button type="button" className={`wm-tab ${activeView === 'params' ? 'active' : ''}`} title="Abrir parâmetros" onClick={() => setActiveView?.('params')}>
          <span className="wm-params-tab-label">Parâmetros <MathLabel tex="(b_1,b_2)" /></span>
        </button>
      </nav>

      <div className="wm-context" aria-live="polite">
        <span className="wm-context-view">{activeViewLabel}</span>
        {activeModeLabel ? <span className={`wm-context-mode ${activeModeClass}`}>{activeModeLabel}</span> : null}
      </div>

      <div className="wm-actions">
        {(activeView === '3d' || activeView === 'state') ? (
          <>
            <button
              type="button"
              title={canEnableInspectionMode
                ? inspectionModeEnabled ? 'Desativar Modo Inspeção' : 'Ativar Modo Inspeção'
                : 'Desenhe pelo menos um estado inicial para ativar o Modo Inspeção'}
              aria-label={canEnableInspectionMode
                ? inspectionModeEnabled ? 'Desativar Modo Inspeção' : 'Ativar Modo Inspeção'
                : 'Modo Inspeção indisponível: desenhe pelo menos um estado inicial'}
              className={`wm-action-button inspection ${inspectionModeEnabled ? 'active' : ''} ${!canEnableInspectionMode ? 'disabled' : ''}`}
              disabled={!canEnableInspectionMode}
              onClick={() => setInspectionModeEnabled?.((value) => !value)}
            >
              <span>⌖</span><strong>Inspeção</strong>
            </button>
            <button
              type="button"
              title={canEnableSolutionMode
                ? solutionModeEnabled ? 'Desativar Modo SOLUÇÃO' : 'Ativar Modo SOLUÇÃO'
                : 'Desenhe os dois estados iniciais para ativar o Modo SOLUÇÃO'}
              aria-label={canEnableSolutionMode
                ? solutionModeEnabled ? 'Desativar Modo SOLUÇÃO' : 'Ativar Modo SOLUÇÃO'
                : 'Modo SOLUÇÃO indisponível: desenhe os dois estados iniciais'}
              className={`wm-action-button solution ${solutionModeEnabled ? 'active' : ''} ${!canEnableSolutionMode ? 'disabled' : ''}`}
              disabled={!canEnableSolutionMode}
              onClick={() => setSolutionModeEnabled?.((value) => !value)}
            >
              <span>Σ</span><strong>Solução</strong>
            </button>
          </>
        ) : null}
        <button type="button" title="Exportar imagem da visualização 3D" className="wm-action-button export" onClick={onExportSnapshot}>
          <span>⇩</span><strong>Exportar</strong>
        </button>
        <button
          type="button"
          title="Ajuda e documentação"
          className={`wm-action-button help ${showDocumentation ? 'active' : ''}`}
          onClick={() => setShowDocumentation((open) => !open)}
        >
          <span>?</span><strong>Ajuda</strong>
        </button>
        <button type="button" title="Configurações" className={`wm-action-button settings ${showSettingsPanel ? 'active' : ''}`} onClick={() => setShowSettingsPanel((open) => !open)}>
          <span>⚙</span><strong>Ajustes</strong>
        </button>
      </div>
    </header>
  )
}
