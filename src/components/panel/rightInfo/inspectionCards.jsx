import React from 'react'
import MathLabel from '../MathLabel'
import { waveSpeed } from '../../../entities/surfaceImplicit'

function fmt(value) {
  return Number.isFinite(value) ? value.toFixed(5) : '-'
}

function shockSpeedForPoint(point, params) {
  if (point && params && Number.isFinite(point.t) && Number.isFinite(point.z)) {
    return waveSpeed(point.t, point.z, params)
  }
  if (Number.isFinite(point?.shockSpeed)) return point.shockSpeed
  if (Number.isFinite(point?.s)) return point.s
  return Number.NaN
}

function curveLabel(point) {
  if (point?.attachedCurve) return point.attachedCurve
  return 'característica'
}

export function ProbeRow({ branch, label, point, params }) {
  if (!point) {
    return (
      <div className={`inspection-probe-card ${branch} empty`}>
        <div className="inspection-probe-title">
          <span><i aria-hidden="true" />{label}</span>
          <strong>sem sonda</strong>
        </div>
        <p>Clique próximo da característica desta família para criar a sonda.</p>
      </div>
    )
  }

  return (
    <div className={`inspection-probe-card ${branch}`}>
      <div className="inspection-probe-title">
        <span><i aria-hidden="true" />{label}</span>
        <strong>{curveLabel(point)}</strong>
      </div>
      <div className="inspection-probe-metrics">
        <div><span><MathLabel tex={"\\tau"} /></span><strong>{fmt(point.t)}</strong></div>
        <div><span><MathLabel tex={"Y"} /></span><strong>{fmt(point.Y ?? 0)}</strong></div>
        <div><span><MathLabel tex={"z"} /></span><strong>{fmt(point.z)}</strong></div>
        <div><span><MathLabel tex={"s"} /></span><strong>{fmt(shockSpeedForPoint(point, params))}</strong></div>
      </div>
      <div className="inspection-state-grid">
        <span><MathLabel tex={"u^-"} /></span><strong>{fmt(point.uMinus)}</strong>
        <span><MathLabel tex={"v^-"} /></span><strong>{fmt(point.vMinus)}</strong>
        <span><MathLabel tex={"u^+"} /></span><strong>{fmt(point.uPlus)}</strong>
        <span><MathLabel tex={"v^+"} /></span><strong>{fmt(point.vPlus)}</strong>
      </div>
    </div>
  )
}

export function HoverPointCard({ point, params }) {
  if (!point) {
    return (
      <div className="inspection-hover-card empty">
        <div className="inspection-hover-title">
          <span>Ponto sob o mouse</span>
          <strong>nenhum</strong>
        </div>
        <p>Sobreponha o mouse a um marcador para ver as coordenadas.</p>
      </div>
    )
  }

  const label = point.hoverLabel ?? point.endpointLabel ?? point.curveType ?? point.attachedCurve ?? point.kind ?? point.intersectionLabel ?? 'ponto'

  return (
    <div className="inspection-hover-card active">
      <div className="inspection-hover-title">
        <span>Ponto sob o mouse</span>
        <strong>{label}</strong>
      </div>
      <div className="inspection-hover-line">
        <MathLabel tex={"(\\tau,Y,z)"} />
        <strong>({fmt(point.t)}, {fmt(point.Y ?? 0)}, {fmt(point.z)})</strong>
      </div>
      <div className="inspection-hover-line">
        <MathLabel tex={"(u_-,v_-)"} />
        <strong>({fmt(point.uMinus)}, {fmt(point.vMinus)})</strong>
      </div>
      <div className="inspection-hover-line">
        <MathLabel tex={"(u_+,v_+)"} />
        <strong>({fmt(point.uPlus)}, {fmt(point.vPlus)})</strong>
      </div>
      <div className="inspection-hover-line">
        <MathLabel tex={"s"} />
        <strong>{fmt(shockSpeedForPoint(point, params))}</strong>
      </div>
    </div>
  )
}

export function InspectionModeSummary({ activeView = '3d', probeCount = 0 }) {
  const inStateSpace = activeView === 'state'
  return (
    <div className="inspection-mode-card">
      <div className="inspection-mode-header">
        <span className="inspection-mode-dot" />
        <div>
          <strong>Inspeção ativa</strong>
          <span>{probeCount}/2 sondas posicionadas</span>
        </div>
      </div>
      <div className="inspection-mode-actions">
        {inStateSpace ? (
          <>
            <div><span>Criar</span><strong>clique próximo de <MathLabel tex={"C_s"} /> ou <MathLabel tex={"C_f"} /></strong></div>
            <div><span>Mover</span><strong>arraste o marcador da sonda</strong></div>
            <div><span>Sincroniza</span><strong>Variedade e Estados</strong></div>
          </>
        ) : (
          <>
            <div><span>Criar</span><strong>clique em <MathLabel tex={"\\mathcal C_s"} /> ou <MathLabel tex={"\\mathcal C_f"} /></strong></div>
            <div><span>Prender</span><strong>Ctrl + arrastar em H, R, K ou J</strong></div>
            <div><span>Soltar</span><strong>arrastar sem Ctrl</strong></div>
          </>
        )}
      </div>
    </div>
  )
}
