import React from 'react'

export function HelpCard({ open, onClose }) {
  if (!open) return null
  return (
    <aside className="wm-floating-card wm-help-card wm-panel">
      <div className="settings-header">
        <strong>Ajuda</strong>
        <button type="button" onClick={onClose} aria-label="Fechar ajuda">×</button>
      </div>
      <div className="wm-floating-content">
        <p><strong>3D:</strong> arraste para orbitar, use a roda do mouse para zoom e os botões para alternar modos.</p>
        <p><strong>Inspeção:</strong> clique em pontos da característica; use <kbd>Ctrl</kbd> ao arrastar a sonda para prender às curvas disponíveis.</p>
        <p><strong>Solução:</strong> ativa a camada de curvas admissíveis lenta/rápida e o reflexo correspondente na variedade.</p>
      </div>
    </aside>
  )
}

export function AboutCard({ open, onClose }) {
  if (!open) return null
  return (
    <aside className="wm-floating-card wm-about-card wm-panel">
      <div className="settings-header">
        <strong>Sobre</strong>
        <button type="button" onClick={onClose} aria-label="Fechar sobre">×</button>
      </div>
      <div className="wm-floating-content">
        <p><strong>Wave Manifold Explorer</strong></p>
        <p>Aplicativo para visualizar a variedade de ondas do sistema quadrático 2×2, incluindo Hugoniot, rarefação, sônica, composta, reflexão e solução na variedade.</p>
      </div>
    </aside>
  )
}
