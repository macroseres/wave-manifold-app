import React, { useId, useState } from 'react'

const numberLabel = (value) => String(Number(value.toFixed(8))).replace('.', ',')

export default function ParameterRangeControl({ label, name, min, max, step, value, onChange }) {
  const id = useId()
  const [draft, setDraft] = useState(null)
  const update = (next) => {
    if (!Number.isFinite(next)) return
    const bounded = Number(Math.max(min, Math.min(max, next)).toFixed(8))
    if (bounded !== value) onChange(bounded)
  }
  const commit = () => {
    if (draft !== null && draft.trim() !== '') update(Number(draft.trim().replace(',', '.')))
    setDraft(null)
  }
  const adjust = (multiplier) => {
    setDraft(null)
    update(value + step * multiplier)
  }

  return (
    <div className="parameter-range-control" role="group" aria-labelledby={`${id}-label`}>
      <div className="parameter-range-heading">
        <label id={`${id}-label`} htmlFor={`${id}-value`}>{label}</label>
        <div className="parameter-value-editor">
        <input
          id={`${id}-value`}
          className="parameter-value-input"
          type="text"
          inputMode="decimal"
          aria-label={`Valor de ${name}`}
          title="Digite um valor e pressione Enter; Escape cancela"
          value={draft ?? numberLabel(value)}
          onFocus={(event) => event.target.select()}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            } else if (event.key === 'Escape') {
              event.preventDefault()
              setDraft(null)
            } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
              event.preventDefault()
              adjust((event.key === 'ArrowUp' ? 1 : -1) * (event.shiftKey ? 10 : 1))
            }
          }}
        />
          <div className="parameter-range-actions">
            {[1, -1].map((multiplier) => {
              const direction = multiplier < 0 ? 'Diminuir' : 'Aumentar'
              return (
                <button
                  key={multiplier}
                  type="button"
                  aria-label={`${direction} ${name}`}
                  title={`${direction} em ${numberLabel(step)}`}
                  disabled={multiplier < 0 ? value <= min : value >= max}
                  onClick={() => adjust(multiplier)}
                >{multiplier < 0 ? '−' : '+'}</button>
              )
            })}
          </div>
        </div>
      </div>
      <input
        className="parameter-range-slider"
        type="range"
        aria-label={`Ajustar ${name}`}
        min={min} max={max} step="any" value={value}
        onChange={(event) => { setDraft(null); update(Number(event.target.value)) }}
        onKeyDown={(event) => {
          const increments = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }
          if (event.key in increments) {
            event.preventDefault()
            adjust(increments[event.key] * (event.shiftKey ? 10 : 1))
          }
        }}
      />
      <div className="parameter-range-limits"><span>{numberLabel(min)}</span><span>{numberLabel(max)}</span></div>

    </div>
  )
}
