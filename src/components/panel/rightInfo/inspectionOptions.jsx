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
    <div className={`mode-status-card inspection-options-card ${branch}`}>
      <strong><i aria-hidden="true" />{title}</strong>
      <div className="toggle-grid">
        <Toggle
          checked={values.hugoniotMinus !== false}
          onChange={(checked) => update('hugoniotMinus', checked)}
          color="#d4af37"
          label={<><MathLabel tex={String.raw`\mathcal H_-`} /><span> : Hugoniot −</span></>}
          helper={{
            title: <><MathLabel tex={String.raw`\mathcal H_-`} /><span> — Hugoniot −</span></>,
            description: (
              <><p>{"Folha de Hugoniot: estados ligados pela condição de Rankine–Hugoniot, com um dos estados fixo."}</p></>
            ),
            documentation: "curvas",
          }}
        />
        <Toggle
          checked={values.hugoniotPlus !== false}
          onChange={(checked) => update('hugoniotPlus', checked)}
          color="#d4af37"
          label={<><MathLabel tex={String.raw`\mathcal H_+`} /><span> : Hugoniot +</span></>}
          helper={{
            title: <><MathLabel tex={String.raw`\mathcal H_+`} /><span> — Hugoniot +</span></>,
            description: (
              <><p>{"Folha de Hugoniot: estados ligados pela condição de Rankine–Hugoniot, com um dos estados fixo."}</p></>
            ),
            documentation: "curvas",
          }}
        />
        <Toggle
          checked={values.rarefaction !== false}
          onChange={(checked) => update('rarefaction', checked)}
          color="#d4af37"
          label={<><MathLabel tex={String.raw`\mathcal R`} /><span> : Rarefação</span></>}
          helper={{
            title: <><MathLabel tex={String.raw`\mathcal R`} /><span> — Rarefação</span></>,
            description: (
              <><p>{"Curva integral do campo característico da família indicada, a partir do estado selecionado."}</p></>
            ),
            documentation: "curvas",
          }}
        />
      </div>
    </div>
  )
}
