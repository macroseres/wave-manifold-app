import React from 'react'

export default function OverlayTopBar({
  activeView,
  setActiveView,
  canOpenStateView,
  activeViewLabel,
  activeModeLabel,
  activeModeClass,
  autoRotate3D,
  setAutoRotate3D,
  canEnableInspectionMode,
  inspectionModeEnabled,
  setInspectionModeEnabled,
  canEnableSolutionMode,
  solutionModeEnabled,
  setSolutionModeEnabled,
  onExportSnapshot,
  showHelpPanel,
  setShowHelpPanel,
  showAboutPanel,
  setShowAboutPanel,
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
        <button type="button" className={`wm-tab ${activeView === '3d' ? 'active' : ''}`} onClick={() => setActiveView?.('3d')}>
          <span className="wm-tab-icon">⟐</span>
          <span>3D</span>
        </button>
        <button type="button" className={`wm-tab ${activeView === 'state' ? 'active' : ''}`} disabled={!canOpenStateView} title={canOpenStateView ? 'Abrir espaço de estados' : 'Selecione C_s e C_f primeiro'} onClick={() => setActiveView?.('state')}>
          <span className="wm-tab-icon">uv</span>
          <span>Estados</span>
        </button>
        <button type="button" className={`wm-tab ${activeView === 'solution' ? 'active' : ''}`} onClick={() => setActiveView?.('solution')}>
          <span className="wm-tab-icon">Σ</span>
          <span>Solução</span>
        </button>
        <button type="button" className={`wm-tab ${activeView === 'params' ? 'active' : ''}`} onClick={() => setActiveView?.('params')}>
          <span className="wm-tab-icon">β</span>
          <span>Parâmetros</span>
        </button>
      </nav>

      <div className="wm-context" aria-live="polite">
        <span className="wm-context-view">{activeViewLabel}</span>
        {activeModeLabel ? <span className={`wm-context-mode ${activeModeClass}`}>{activeModeLabel}</span> : null}
      </div>

      <div className="wm-actions">
        {activeView === '3d' ? (
          <>
            <button
              type="button"
              title={autoRotate3D ? 'Parar rotação automática em torno de Y' : 'Rotação automática em torno de Y'}
              aria-label={autoRotate3D ? 'Parar rotação automática em torno de Y' : 'Ativar rotação automática em torno de Y'}
              className={`wm-action-button ${autoRotate3D ? 'active' : ''}`}
              onClick={() => setAutoRotate3D?.((value) => !value)}
            >
              <span>⟳</span><strong>Rotação</strong>
            </button>
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
          title="Ajuda"
          className={`wm-action-button help ${showHelpPanel ? 'active' : ''}`}
          onClick={() => {
            setShowHelpPanel((open) => !open)
            setShowAboutPanel(false)
          }}
        >
          <span>?</span><strong>Ajuda</strong>
        </button>
        <button
          type="button"
          title="Sobre"
          className={`wm-action-button about ${showAboutPanel ? 'active' : ''}`}
          onClick={() => {
            setShowAboutPanel((open) => !open)
            setShowHelpPanel(false)
          }}
        >
          <span>i</span><strong>Sobre</strong>
        </button>
        <button type="button" title="Configurações" className={`wm-action-button settings ${showSettingsPanel ? 'active' : ''}`} onClick={() => setShowSettingsPanel((open) => !open)}>
          <span>⚙</span><strong>Ajustes</strong>
        </button>
      </div>
    </header>
  )
}
