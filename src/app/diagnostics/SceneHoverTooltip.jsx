import React from 'react'

function fmtTooltip(value) {
  return Number.isFinite(value) ? value.toFixed(5) : '-'
}

function objectLabel(point) {
  return point?.hoverLabel
    ?? point?.endpointLabel
    ?? point?.curveType
    ?? point?.attachedCurve
    ?? point?.kind
    ?? point?.intersectionLabel
    ?? 'objeto 3D'
}

export default function SceneHoverTooltip({ point, position }) {
  if (!point || !position) return null

  return (
    <div
      className="scene-hover-tooltip"
      style={{ left: position.x + 14, top: position.y + 14 }}
      aria-hidden="true"
    >
      <div className="scene-hover-tooltip-title">{objectLabel(point)}</div>
      <div className="scene-hover-tooltip-row"><span>τ,Y,z</span><strong>({fmtTooltip(point.t)}, {fmtTooltip(point.Y ?? 0)}, {fmtTooltip(point.z)})</strong></div>
      <div className="scene-hover-tooltip-row"><span>U-</span><strong>({fmtTooltip(point.uMinus)}, {fmtTooltip(point.vMinus)})</strong></div>
      <div className="scene-hover-tooltip-row"><span>U+</span><strong>({fmtTooltip(point.uPlus)}, {fmtTooltip(point.vPlus)})</strong></div>
      <div className="scene-hover-tooltip-row"><span>s</span><strong>{fmtTooltip(point.s)}</strong></div>
    </div>
  )
}
