import LayerHelp from './LayerHelp'
import { formatNumber } from '../../ui/display'

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

/**
 * Keep editable copy beside each Toggle at its call site.
 * label: compact panel content (JSX).
 * helper: { title: JSX, description: JSX, documentation: string }.
 * Hover content is mounted only when opened; this component does not infer copy.
 */
export function Toggle({ checked, onChange, label, color, helper }) {
  const row = (
    <label className="toggle-row">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-dot" style={{ background: color ?? '#64748b' }} />
      <span>{label}</span>
    </label>
  )
  return helper ? <LayerHelp helper={helper}>{row}</LayerHelp> : row
}

export function Section({ title, children, defaultOpen = true, accent = '#64748b' }) {
  return (
    <details className="panel-section" open={defaultOpen} style={{ '--accent': accent }}>
      <summary>{title}</summary>
      <div className="section-body">{children}</div>
    </details>
  )
}
