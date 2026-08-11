import { parameterPalette } from '../../../components/panel/schaefferShearerConfig.js'

function clipSegmentToRect(rect, x0, y0, x1, y1) {
  const bounds = [
    [-1, 0, x0],
    [1, 0, rect.width - x0],
    [0, -1, y0],
    [0, 1, rect.height - y0],
  ]
  const dx = x1 - x0
  const dy = y1 - y0
  let u0 = 0
  let u1 = 1

  for (const [px, py, q] of bounds) {
    const p = px * dx + py * dy
    if (Math.abs(p) < 1e-12) {
      if (q < 0) return null
      continue
    }
    const r = q / p
    if (p < 0) {
      if (r > u1) return null
      if (r > u0) u0 = r
    } else {
      if (r < u0) return null
      if (r < u1) u1 = r
    }
  }

  return [x0 + u0 * dx, y0 + u0 * dy, x0 + u1 * dx, y0 + u1 * dy]
}

export function drawGridAndAxes(ctx, { rect, plotWindow, mapX, axisX, axisY }) {
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)'
  ctx.lineWidth = 1
  const gridSteps = 10
  for (let i = 0; i <= gridSteps; i += 1) {
    const x = (rect.width * i) / gridSteps
    const y = (rect.height * i) / gridSteps
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, rect.height); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(rect.width, y); ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.84)'
  ctx.lineWidth = 1.15
  ctx.beginPath(); ctx.moveTo(0, axisY); ctx.lineTo(rect.width, axisY); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(axisX, 0); ctx.lineTo(axisX, rect.height); ctx.stroke()

  drawVerticalAsymptote(ctx, { rect, plotWindow, mapX }, -1)
  drawVerticalAsymptote(ctx, { rect, plotWindow, mapX }, 1)
  drawXAxisNumber(ctx, { rect, plotWindow, mapX, axisY }, -1, '-1')
  drawXAxisNumber(ctx, { rect, plotWindow, mapX, axisY }, 1, '1')
}

function drawVerticalAsymptote(ctx, { rect, plotWindow, mapX }, b1) {
  if (b1 < plotWindow.b1Min || b1 > plotWindow.b1Max) return
  const x = mapX(b1)
  ctx.save()
  ctx.setLineDash([6, 6])
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)'
  ctx.lineWidth = 1.4
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, rect.height); ctx.stroke()
  ctx.restore()
}

function drawXAxisNumber(ctx, { rect, plotWindow, mapX, axisY }, b1, label) {
  if (b1 < plotWindow.b1Min || b1 > plotWindow.b1Max) return
  const x = mapX(b1)
  const y = axisY > rect.height - 24 ? axisY - 9 : axisY + 18
  ctx.save()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
  ctx.font = '12px Arial, Helvetica, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x - 14, y)
  ctx.restore()
}

export function drawParameterCurves(ctx, { rect, plotWindow, mapX, mapY, visibleCurves }) {
  const drawParametricBranch = ({ sign, start, end, color, fn }) => {
    if (end < start) return
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.shadowColor = color
    ctx.shadowBlur = 7
    ctx.beginPath()

    let previous = null
    const samples = 900
    for (let i = 0; i <= samples; i += 1) {
      const b1 = start + (i * (end - start)) / samples
      const b2 = sign * fn(b1)
      if (!Number.isFinite(b2)) { previous = null; continue }
      const x = mapX(b1)
      const y = mapY(b2)
      if (previous) {
        const clipped = clipSegmentToRect(rect, previous.x, previous.y, x, y)
        if (clipped) { ctx.moveTo(clipped[0], clipped[1]); ctx.lineTo(clipped[2], clipped[3]) }
      }
      previous = { x, y }
    }
    ctx.stroke()
    ctx.restore()
  }

  const drawC1Branch = (sign) => drawParametricBranch({
    sign,
    start: Math.max(1, plotWindow.b1Min),
    end: plotWindow.b1Max,
    color: parameterPalette.curves.c1,
    fn: (b1) => 2 * Math.sqrt(Math.max(0, b1 - 1)),
  })
  const drawC2Branch = (sign) => drawParametricBranch({
    sign,
    start: plotWindow.b1Min,
    end: Math.min(plotWindow.b1Max, -1 - 1e-5),
    color: parameterPalette.curves.c2,
    fn: (b1) => Math.sqrt(Math.max(0, -4 / (b1 + 1))),
  })
  const drawC3Branch = (sign) => drawParametricBranch({
    sign,
    start: plotWindow.b1Min,
    end: plotWindow.b1Max,
    color: parameterPalette.curves.c3,
    fn: (b1) => {
      const denom = b1 + 1
      if (Math.abs(denom) < 1e-8) return Number.NaN
      const value = ((b1 - 1) * (b1 + 2) * (b1 + 2)) / denom
      return value >= 0 ? Math.sqrt(value) : Number.NaN
    },
  })

  if (visibleCurves.c1) { drawC1Branch(1); drawC1Branch(-1) }
  if (visibleCurves.c2) { drawC2Branch(1); drawC2Branch(-1) }
  if (visibleCurves.c3) { drawC3Branch(1); drawC3Branch(-1) }
}

export function drawParameterMarkers(ctx, { plotWindow, mapX, mapY, parameterPoint, isParameterPointHovered }) {
  const drawAxisPoint = (b1, b2) => {
    if (b1 < plotWindow.b1Min || b1 > plotWindow.b1Max || b2 < plotWindow.b2Min || b2 > plotWindow.b2Max) return
    const x = mapX(b1); const y = mapY(b2)
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#000000'
    ctx.beginPath(); ctx.arc(x, y, 1.7, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }

  const drawParameterPoint = ({ b1, b2 }) => {
    if (b1 < plotWindow.b1Min || b1 > plotWindow.b1Max || b2 < plotWindow.b2Min || b2 > plotWindow.b2Max) return
    const x = mapX(b1); const y = mapY(b2)
    const radius = isParameterPointHovered ? 10 : 8
    ctx.save()
    ctx.fillStyle = isParameterPointHovered ? 'rgba(95, 100, 116, 1)' : 'rgba(78, 82, 96, 0.98)'
    ctx.strokeStyle = isParameterPointHovered ? 'rgba(250, 204, 21, 0.98)' : 'rgba(255, 255, 255, 0.96)'
    ctx.lineWidth = isParameterPointHovered ? 2.6 : 2
    ctx.shadowColor = isParameterPointHovered ? 'rgba(250, 204, 21, 0.55)' : 'rgba(0, 0, 0, 0.42)'
    ctx.shadowBlur = isParameterPointHovered ? 10 : 4
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.restore()
  }

  drawAxisPoint(-2, 0)
  drawAxisPoint(-1, 0)
  drawAxisPoint(0, 0)
  drawAxisPoint(1, 0)
  drawParameterPoint(parameterPoint)
}
