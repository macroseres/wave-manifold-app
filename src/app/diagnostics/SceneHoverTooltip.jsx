import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { projectStates } from '../../entities/geometry/stateProjections.js'
import { waveSpeed } from '../../entities/surfaceImplicit/state.js'

function fmt(value) {
  if (!Number.isFinite(value)) return '—'
  if (value !== 0 && (Math.abs(value) < 1e-4 || Math.abs(value) >= 1e6)) return value.toExponential(3)
  return Number(value.toFixed(5)).toString()
}

export default function SceneHoverTooltip({ point, position, params, stateSpace = false }) {
  const element = useRef(null)
  useLayoutEffect(() => {
    if (!element.current || !position) return
    const { width, height } = element.current.getBoundingClientRect()
    element.current.style.left = Math.max(12, Math.min(position.x + 16, window.innerWidth - width - 12)) + 'px'
    element.current.style.top = Math.max(12, Math.min(position.y + 16, window.innerHeight - height - 12)) + 'px'
  })
  if (!point || !position) return null
  const validWave = [point.t, point.Y, point.z].every(Number.isFinite)
  const states = validWave && params ? projectStates(point.t, point.Y, point.z, params) : null
  const speed = point.s ?? (validWave && params ? waveSpeed(point.t, point.z, params) : undefined)
  const title = point.hoverLabel ?? point.endpointLabel ?? point.intersectionLabel ?? point.curveType ?? point.attachedCurve ?? point.kind ?? 'Ponto na variedade'
  const pair = (u, v) => '(' + fmt(u) + ', ' + fmt(v) + ')'
  const row = (label, value) => <div className="scene-hover-tooltip-row" key={label}><span>{label}</span><strong>{value}</strong></div>
  return createPortal(<div ref={element} className="scene-hover-tooltip" aria-hidden="true">
    <div className="scene-hover-tooltip-title">{title}</div>
    <div className="scene-hover-tooltip-context">{stateSpace ? 'Espaço de estados' : 'Variedade de ondas'}</div>
    {stateSpace ? row('(u, v)', pair(point.u ?? point.uMinus, point.v ?? point.vMinus)) : <>
      {row('τ', fmt(point.t))}{row('Y', fmt(point.Y))}{row('z', fmt(point.z))}
      {row('U−', pair(point.uMinus ?? states?.minus.u, point.vMinus ?? states?.minus.v))}
      {row('U+', pair(point.uPlus ?? states?.plus.u, point.vPlus ?? states?.plus.v))}
    </>}
    {row('s', fmt(speed))}
    {point.residual !== undefined && row('Resíduo', fmt(point.residual))}
    {point.hint && <div className="scene-hover-tooltip-context">{point.hint}</div>}
  </div>, document.body)
}
