
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

  const left = Math.max(12, Math.min(position.x + 16, window.innerWidth - 304))
  const top = Math.max(12, Math.min(position.y + 16, window.innerHeight - 196))

  return (
    <div
      className="scene-hover-tooltip"
      style={{ left, top }}
      aria-hidden="true"
    >
      <div className="scene-hover-tooltip-title">{objectLabel(point)}</div>
      <div className="scene-hover-tooltip-row"><span>τ, Y, z</span><strong>({fmtTooltip(point.t)}, {fmtTooltip(point.Y ?? 0)}, {fmtTooltip(point.z)})</strong></div>
      <div className="scene-hover-tooltip-row"><span>U−</span><strong>({fmtTooltip(point.uMinus)}, {fmtTooltip(point.vMinus)})</strong></div>
      <div className="scene-hover-tooltip-row"><span>U+</span><strong>({fmtTooltip(point.uPlus)}, {fmtTooltip(point.vPlus)})</strong></div>
      <div className="scene-hover-tooltip-row"><span>s</span><strong>{fmtTooltip(point.s)}</strong></div>
    </div>
  )
}
