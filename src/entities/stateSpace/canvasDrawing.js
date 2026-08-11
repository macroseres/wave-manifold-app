import { waveColors } from '../../config/waveColors.js'
import { branchCharacteristicWindow, projectedStateForTZ } from '../../geometry/stateSpaceProjection.js'

function resizeCanvasForDpr(canvas) {
  const rect = canvas.getBoundingClientRect()
  const dpr = globalThis.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.round(rect.width * dpr))
  canvas.height = Math.max(1, Math.round(rect.height * dpr))
  return { rect, dpr }
}

function drawGrid(ctx, rect, axisU, axisV) {
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 10; i += 1) {
    const x = (rect.width * i) / 10
    const y = (rect.height * i) / 10
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, rect.height); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(rect.width, y); ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.82)'
  ctx.lineWidth = 1.1
  ctx.beginPath(); ctx.moveTo(0, axisV); ctx.lineTo(rect.width, axisV); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(axisU, 0); ctx.lineTo(axisU, rect.height); ctx.stroke()
}

function drawBoundary(ctx, { branch, color, view, params, toScreen, rect }) {
  const win = branchCharacteristicWindow(view, branch)
  if (!win.valid) return
  const edges = [
    { fixed: 't', value: win.tMin },
    { fixed: 't', value: win.tMax },
    { fixed: 'z', value: win.zMin },
    { fixed: 'z', value: win.zMax },
  ]
  ctx.save()
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.9
  ctx.lineWidth = 2
  ctx.setLineDash([5, 4])
  for (const edge of edges) {
    ctx.beginPath()
    let started = false
    const steps = 160
    for (let i = 0; i <= steps; i += 1) {
      const a = i / steps
      const t = edge.fixed === 't' ? edge.value : win.tMin + a * (win.tMax - win.tMin)
      const z = edge.fixed === 'z' ? edge.value : win.zMin + a * (win.zMax - win.zMin)
      const projected = projectedStateForTZ(t, z, params, branch)
      if (!projected) { started = false; continue }
      const { x, y } = toScreen(projected.state, rect)
      if (!started) { ctx.moveTo(x, y); started = true }
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.restore()
}

function drawProjectedSegments(ctx, { segments, color, lineWidth = 2.8, toScreen, rect }) {
  if (!segments?.length) return
  ctx.save()
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.98
  ctx.lineWidth = lineWidth
  ctx.setLineDash([])
  for (const segment of segments) {
    ctx.beginPath()
    let started = false
    for (const sample of segment) {
      const state = sample?.state
      if (!state || !Number.isFinite(state.u) || !Number.isFinite(state.v)) {
        started = false
        continue
      }
      const { x, y } = toScreen(state, rect)
      if (!started) { ctx.moveTo(x, y); started = true }
      else ctx.lineTo(x, y)
    }
    if (started) ctx.stroke()
  }
  ctx.restore()
}

function drawSelectedPoint(ctx, { branch, color, selectedMap, hoverBranch, draggingBranch, toScreen, rect }) {
  const entry = selectedMap[branch]
  const state = entry?.selectedState
  if (!state || !Number.isFinite(state.uMinus) || !Number.isFinite(state.vMinus)) return
  const { x, y } = toScreen({ u: state.uMinus, v: state.vMinus }, rect)
  ctx.save()
  const highlighted = hoverBranch === branch || draggingBranch === branch
  if (highlighted) {
    ctx.beginPath(); ctx.arc(x, y, 15, 0, 2 * Math.PI)
    ctx.fillStyle = 'rgba(250,204,21,0.22)'
    ctx.fill()
  }
  ctx.fillStyle = color
  ctx.strokeStyle = highlighted ? '#facc15' : '#ffffff'
  ctx.lineWidth = highlighted ? 3.5 : 2
  ctx.beginPath(); ctx.arc(x, y, highlighted ? 9 : 7, 0, 2 * Math.PI); ctx.fill(); ctx.stroke()
  ctx.restore()
}

export function drawStateSpaceCanvas(canvas, options) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { rect, dpr } = resizeCanvasForDpr(canvas)
  const { bounds, selectedMap, hoverBranch, draggingBranch, view, params, toScreen, implicitInflectionSegments, hysPlusProjectionSegments } = options
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, rect.width, rect.height)

  const axisU = bounds.uMin <= 0 && bounds.uMax >= 0
    ? ((0 - bounds.uMin) / Math.max(1e-12, bounds.uMax - bounds.uMin)) * rect.width
    : rect.width / 2
  const axisV = bounds.vMin <= 0 && bounds.vMax >= 0
    ? ((bounds.vMax - 0) / Math.max(1e-12, bounds.vMax - bounds.vMin)) * rect.height
    : rect.height / 2

  drawGrid(ctx, rect, axisU, axisV)
  drawBoundary(ctx, { branch: 'slow', color: waveColors.characteristicSlow, view, params, toScreen, rect })
  drawBoundary(ctx, { branch: 'fast', color: waveColors.characteristicFast, view, params, toScreen, rect })
  drawProjectedSegments(ctx, { segments: implicitInflectionSegments, color: waveColors.inflection ?? '#facc15', lineWidth: 3.4, toScreen, rect })
  drawProjectedSegments(ctx, { segments: hysPlusProjectionSegments.minus, color: '#c4b5fd', lineWidth: 2.8, toScreen, rect })
  drawProjectedSegments(ctx, { segments: hysPlusProjectionSegments.plus, color: '#bae6fd', lineWidth: 2.8, toScreen, rect })
  drawSelectedPoint(ctx, { branch: 'slow', color: waveColors.characteristicSlow, selectedMap, hoverBranch, draggingBranch, toScreen, rect })
  drawSelectedPoint(ctx, { branch: 'fast', color: waveColors.characteristicFast, selectedMap, hoverBranch, draggingBranch, toScreen, rect })
}

export function drawSolutionCanvas(canvas) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { rect, dpr } = resizeCanvasForDpr(canvas)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, rect.width, rect.height)

  const left = 36
  const right = rect.width - 24
  const top = 24
  const bottom = rect.height - 28

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 10; i += 1) {
    const x = left + ((right - left) * i) / 10
    const y = top + ((bottom - top) * i) / 10
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.82)'
  ctx.beginPath(); ctx.moveTo(left, bottom); ctx.lineTo(right, bottom); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bottom); ctx.stroke()
}
