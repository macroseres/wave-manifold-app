import React from 'react'
import MathLabel from '../MathLabel'
import { Toggle } from '../PanelPrimitives'
import { defaultCurveVisibility } from './panelDefaults'

export function ProbeCurveOptions({ branch, title, visibility, setVisibility }) {
  const values = visibility?.[branch] ?? defaultCurveVisibility[branch]
  const update = (name, checked) => {
    setVisibility?.((prev) => ({
      ...defaultCurveVisibility,
      ...prev,
      [branch]: {
        ...defaultCurveVisibility[branch],
        ...(prev?.[branch] ?? {}),
        [name]: checked,
      },
    }))
  }

  return (
    <div className="mode-status-card inspection-options-card">
      <strong>{title}</strong>
      <div className="toggle-grid">
        <Toggle checked={values.hugoniotMinus !== false} onChange={(checked) => update('hugoniotMinus', checked)} label={<><MathLabel tex={"\\mathcal H_-"} /><span> passando pela sonda</span></>} color="#d4af37" />
        <Toggle checked={values.hugoniotPlus !== false} onChange={(checked) => update('hugoniotPlus', checked)} label={<><MathLabel tex={"\\mathcal H_+"} /><span> passando pela sonda</span></>} color="#d4af37" />
        <Toggle checked={values.rarefaction !== false} onChange={(checked) => update('rarefaction', checked)} label={<><MathLabel tex={"\\mathcal R"} /><span> passando pela sonda</span></>} color="#d4af37" />
      </div>
    </div>
  )
}
