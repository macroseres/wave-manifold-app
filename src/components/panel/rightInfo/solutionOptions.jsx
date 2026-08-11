import React from 'react'
import MathLabel from '../MathLabel'
import { Toggle } from '../PanelPrimitives'
import { defaultSolutionVisibility } from './panelDefaults'

function branchPalette(branch) {
  return {
    sign: branch === 'slow' ? '-' : '+',
    dagger: branch === 'reflected' ? '^\\dagger' : '',
    shockColor: branch === 'slow' ? '#60a5fa' : branch === 'fast' ? '#fb7185' : '#fca5a5',
    rarefactionColor: branch === 'slow' ? '#34d399' : branch === 'fast' ? '#a78bfa' : '#c4b5fd',
    compositeColor: branch === 'slow' ? '#f59e0b' : branch === 'fast' ? '#f472b6' : '#f9a8d4',
  }
}

export function SolutionCurveOptions({ branch, title, visibility, setVisibility }) {
  const values = visibility?.[branch] ?? defaultSolutionVisibility[branch]
  const update = (name, checked) => {
    setVisibility?.((prev) => ({
      ...defaultSolutionVisibility,
      ...prev,
      [branch]: {
        ...defaultSolutionVisibility[branch],
        ...(prev?.[branch] ?? {}),
        [name]: checked,
      },
    }))
  }

  const { sign, dagger, shockColor, rarefactionColor, compositeColor } = branchPalette(branch)

  return (
    <div className="mode-status-card solution-options-card">
      <strong>{title}</strong>
      <div className="toggle-grid">
        <Toggle checked={values.hugoniotLocal !== false} onChange={(checked) => update('hugoniotLocal', checked)} label={<><MathLabel tex={`\\mathcal A_{loc}${dagger}(\\mathcal H_${sign})`} /></>} color={shockColor} />
        <Toggle checked={values.hugoniotNonlocal !== false} onChange={(checked) => update('hugoniotNonlocal', checked)} label={<><MathLabel tex={`\\mathcal A_{nl}${dagger}(\\mathcal H_${sign})`} /></>} color={shockColor} />
        {branch === 'slow' ? <Toggle checked={values.auxiliaryHPlus !== false} onChange={(checked) => update('auxiliaryHPlus', checked)} label={<><MathLabel tex={'\\mathcal H_+ \\text{ auxiliar da segunda cadeia}'} /></>} color={'#d4af37'} /> : null}
        <Toggle checked={values.rarefactionLocal !== false} onChange={(checked) => update('rarefactionLocal', checked)} label={<><MathLabel tex={`\\mathcal A_{loc}${dagger}(\\mathcal R_${sign})`} /></>} color={rarefactionColor} />
        <Toggle checked={values.rarefactionNonlocal !== false} onChange={(checked) => update('rarefactionNonlocal', checked)} label={<><MathLabel tex={`\\mathcal A_{nl}${dagger}(\\mathcal R_${sign})`} /></>} color={rarefactionColor} />
        <Toggle checked={values.compositeLocal !== false} onChange={(checked) => update('compositeLocal', checked)} label={<><MathLabel tex={`\\mathcal A_{loc}${dagger}(\\mathcal K_${sign})`} /></>} color={compositeColor} />
        <Toggle checked={values.compositeNonlocal !== false} onChange={(checked) => update('compositeNonlocal', checked)} label={<><MathLabel tex={`\\mathcal A_{nl}${dagger}(\\mathcal K_${sign})`} /></>} color={compositeColor} />
        <Toggle checked={values.involvedRarefactionCurve === true} onChange={(checked) => update('involvedRarefactionCurve', checked)} label={<><MathLabel tex={`\\mathcal R_{nl}${dagger}`} /></>} color={rarefactionColor} />
        <Toggle checked={values.involvedCompositeCurve === true} onChange={(checked) => update('involvedCompositeCurve', checked)} label={<><MathLabel tex={`\\mathcal K_{nl}${dagger}`} /></>} color={compositeColor} />
        {branch === 'slow' ? (
          <>
            <Toggle checked={values.satHugoniotLocal !== false} onChange={(checked) => update('satHugoniotLocal', checked)} label={<><MathLabel tex={'\\operatorname{Sat}_{\\mathcal H_+}(\\mathcal A_{loc}(\\mathcal H_-))'} /></>} color={'#1d4ed8'} />
            <Toggle checked={values.satHugoniotNonlocal !== false} onChange={(checked) => update('satHugoniotNonlocal', checked)} label={<><MathLabel tex={'\\operatorname{Sat}_{\\mathcal H_+}(\\mathcal A_{nl}(\\mathcal H_-))'} /></>} color={'#3b82f6'} />
            <Toggle checked={values.satRarefactionLocal !== false} onChange={(checked) => update('satRarefactionLocal', checked)} label={<><MathLabel tex={'\\operatorname{Sat}_{\\mathcal H_+}(\\mathcal A_{loc}(\\mathcal R_-))'} /></>} color={'#047857'} />
            <Toggle checked={values.satInvolvedRarefactionCurve === true} onChange={(checked) => update('satInvolvedRarefactionCurve', checked)} label={<><MathLabel tex={'\\operatorname{Sat}_{\\mathcal H_-}(\\mathcal R_{nl})'} /></>} color={'#86efac'} />
            <Toggle checked={values.satComposite !== false} onChange={(checked) => update('satComposite', checked)} label={<><MathLabel tex={'\\operatorname{Sat}_{\\mathcal H_+}(\\mathcal A(\\mathcal K_-))'} /></>} color={'#b45309'} />
            <Toggle checked={values.chosenHPlusIntersection !== false} onChange={(checked) => update('chosenHPlusIntersection', checked)} label={<><MathLabel tex={'H_+^* \\cap \\mathcal A_+^\\dagger \\cap \\operatorname{Sat}_{H_+}(\\mathcal A_-)'} /></>} color={'#facc15'} />
            <Toggle checked={values.chosenHMinusRarefaction !== false} onChange={(checked) => update('chosenHMinusRarefaction', checked)} label={<><MathLabel tex={'H_-^* \\cap \\mathcal R_-'} /></>} color={'#93c5fd'} />
          </>
        ) : null}
      </div>
      {branch === 'reflected' ? <p className="solution-reflection-note"><MathLabel tex={'\\dagger:(\\tau,Y,z)\\mapsto(\\tau,-Y,z)'} /></p> : null}
    </div>
  )
}
