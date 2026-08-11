import React from 'react'
import MathLabel from './MathLabel'
import { formatNumber } from '../../ui/display'

export function characteristicTexFromPoint(point) {
  if (!point || !Number.isFinite(point.t)) return '\\mathcal{C}'
  if (point.branch === 'fast' || point.t < -1e-9) return '\\mathcal{C}_f'
  if (point.branch === 'slow' || point.t > 1e-9) return '\\mathcal{C}_s'
  return '\\mathcal{C}'
}

export function InspectLabel({ label }) {
  if (!label) return <>Ponto selecionado</>
  if (typeof label === 'string' && label.includes('\\')) return <MathLabel tex={label} />
  return <>{label}</>
}

export function SourceLabel({ source, point, hugoniotIntersections }) {
  if (source === 'characteristic') {
    const tex = characteristicTexFromPoint(point)
    const name = tex === '\\mathcal{C}_f' ? 'Característica rápida' : tex === '\\mathcal{C}_s' ? 'Característica lenta' : 'Característica'
    return <>{name} <MathLabel tex={tex} /></>
  }

  if (source === 'sonicLeft') {
    const clickedIntersection = hugoniotIntersections?.sonicLeft?.find((p) => p.isClicked)
    const tex = clickedIntersection?.texLabel ?? '\\mathcal{S}^-'
    const name = clickedIntersection?.branch === 'fast'
      ? 'Sônica à esquerda rápida'
      : clickedIntersection?.branch === 'slow'
        ? 'Sônica à esquerda lenta'
        : 'Sônica à esquerda'
    return <>{name} <MathLabel tex={tex} /></>
  }

  return <>{source ?? '—'}</>
}

export function RangeControl({ label, min, max, step, value, onChange }) {
  return (
    <label className="range-control">
      <div className="range-label">
        <span className="range-name">{label}</span>
        <strong>{formatNumber(value)}</strong>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  )
}

export function MathVar({ tex }) {
  return <span className="math-var"><MathLabel tex={tex} /></span>
}

export function PlainParam({ children }) {
  return <span className="plain-param">{children}</span>
}

export function Toggle({ checked, onChange, label, color }) {
  return (
    <label className="toggle-row">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-dot" style={{ background: color ?? '#64748b' }} />
      <span>{label}</span>
    </label>
  )
}

export function LegendItem({ color, label }) {
  return (
    <div className="legend-item">
      <span className="legend-dot" style={{ background: color }} />
      <span>{label}</span>
    </div>
  )
}

export function Section({ title, children, defaultOpen = true, accent = '#64748b' }) {
  return (
    <details className="panel-section" open={defaultOpen} style={{ '--accent': accent }}>
      <summary>{title}</summary>
      <div className="section-body">{children}</div>
    </details>
  )
}

export function CoordinateRow({ point }) {
  return (
    <div className="tuple-line">
      <MathLabel tex={"(\\tau,Y,z)"} />
      <span>=</span>
      <span>({formatNumber(point?.t)}, {formatNumber(point?.Y)}, {formatNumber(point?.z)})</span>
    </div>
  )
}

export function ClassificationRow({ point }) {
  if (!point?.branchLabel && !point?.branchLabelTex) return null
  return (
    <div className="classification-row">
      {point.branchLabelTex ? <MathLabel tex={point.branchLabelTex} /> : point.branchLabel}
    </div>
  )
}
