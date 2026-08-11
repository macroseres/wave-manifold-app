import React from 'react'
import MathLabel from '../MathLabel'

export function SolutionModeCard({ slowPoint, fastPoint }) {
  const hasSlow = Boolean(slowPoint)
  const hasFast = Boolean(fastPoint)
  return (
    <div className="solution-mode-card">
      <div className="solution-mode-header">
        <span className="solution-mode-dot" />
        <div>
          <strong>Modo SOLUÇÃO ativo</strong>
          <span>arcos admissiveis orientados</span>
        </div>
      </div>
      <div className="solution-mode-grid solution-arc-grid">
        <span>Parte lenta</span>
        <strong>{hasSlow ? <><MathLabel tex={'\\mathcal A_{loc/nl}(\\mathcal H_-)'} /> · <MathLabel tex={'\\mathcal A_{loc/nl}(\\mathcal R_-)'} /> · <MathLabel tex={'\\mathcal A(\\mathcal K_-)'} /></> : 'selecione C_s'}</strong>
        <span>Parte rapida</span>
        <strong>{hasFast ? <><MathLabel tex={'\\mathcal A_{loc/nl}(\\mathcal H_+)'} /> · <MathLabel tex={'\\mathcal A_{loc/nl}(\\mathcal R_+)'} /> · <MathLabel tex={'\\mathcal A(\\mathcal K_+)'} /></> : 'selecione C_f'}</strong>
        <span>Reflexo</span>
        <strong>{hasFast ? <><MathLabel tex={'\\dagger:(\\tau,Y,z)\\mapsto(\\tau,-Y,z)'} /></> : 'aguardando parte rapida'}</strong>
        <span>Sequencia</span>
        <strong>{hasSlow && hasFast ? <><MathLabel tex={'\\Sigma=(\\mathcal A_1,\\ldots,\\mathcal A_n)'} /></> : 'aguardando estados iniciais'}</strong>
      </div>
      <p className="solution-mode-note">
        Esta camada usa os trechos admissiveis extraidos das bifolheacoes orientadas.
        Choques e rarefacoes estao separados em arcos locais e nao-locais.
      </p>
    </div>
  )
}
