import { waveColors } from '../../config/waveColors.js'
import { drawViscousPortrait } from '../phasePortrait/drawing.js'
import {
  branchCharacteristicWindow,
  characteristicBoundaryZAtFraction,
  projectedStateForTZ,
} from '../../geometry/stateSpaceProjection.js'

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

function clipLineToRect(a, b, rect, margin = 2) {
  const xMin = -margin
  const xMax = rect.width + margin
  const yMin = -margin
  const yMax = rect.height + margin
  const dx = b.x - a.x
  const dy = b.y - a.y
  let t0 = 0
  let t1 = 1
  for (const [p, q] of [[-dx, a.x - xMin], [dx, xMax - a.x], [-dy, a.y - yMin], [dy, yMax - a.y]]) {
    if (Math.abs(p) < 1e-14) {
      if (q < 0) return null
      continue
    }
    const ratio = q / p
    if (p < 0) t0 = Math.max(t0, ratio)
    else t1 = Math.min(t1, ratio)
    if (t0 > t1) return null
  }
  return [
    { x: a.x + t0 * dx, y: a.y + t0 * dy },
    { x: a.x + t1 * dx, y: a.y + t1 * dy },
  ]
}

function drawBoundary(ctx, { branch, color, view, params, toScreen, rect }) {
  const win = branchCharacteristicWindow(view, branch)
  if (!win.valid) return
  const compactZMin = characteristicBoundaryZAtFraction(win, 0)
  const compactZMax = characteristicBoundaryZAtFraction(win, 1)
  const edges = [
    { fixed: 't', value: win.tMin },
    { fixed: 't', value: win.tMax },
    { fixed: 'z', value: compactZMin },
    { fixed: 'z', value: compactZMax },
  ]
  ctx.save()
  ctx.fillStyle = color
  ctx.globalAlpha = 0.52
  for (const edge of edges) {
    // tau=0 é desenhada uma única vez pela equação implícita da
    // coincidência; omitir esta aresta evita duas aproximações sobrepostas.
    if (edge.fixed === 't' && Math.abs(edge.value) < 1e-14) continue
    ctx.beginPath()
    let previousScreen = null
    let distanceSinceDot = 0
    const dotSpacing = 6.5
    const steps = 640
    for (let i = 0; i <= steps; i += 1) {
      const a = i / steps
      const t = edge.fixed === 't' ? edge.value : win.tMin + a * (win.tMax - win.tMin)
      const z = edge.fixed === 'z' ? edge.value : characteristicBoundaryZAtFraction(win, a)
      const projected = projectedStateForTZ(t, z, params, branch)
      if (!projected) { previousScreen = null; distanceSinceDot = 0; continue }
      const screen = toScreen(projected.state, rect)
      if (previousScreen) {
        const clipped = clipLineToRect(previousScreen, screen, rect)
        if (clipped) {
          const [start, end] = clipped
          const dx = end.x - start.x
          const dy = end.y - start.y
          const length = Math.hypot(dx, dy)
          let distance = distanceSinceDot > 0 ? dotSpacing - distanceSinceDot : 0
          while (distance <= length) {
            const ratio = length > 1e-12 ? distance / length : 0
            const x = start.x + ratio * dx
            const y = start.y + ratio * dy
            ctx.moveTo(x + 0.9, y)
            ctx.arc(x, y, 0.9, 0, 2 * Math.PI)
            distance += dotSpacing
          }
          distanceSinceDot = (distanceSinceDot + length) % dotSpacing
        } else {
          distanceSinceDot = 0
        }
      }
      previousScreen = screen
    }
    ctx.fill()
  }
  ctx.restore()
}

function drawProjectedSegments(ctx, {
  segments,
  color,
  lineWidth = 1.35,


  alpha = 0.98,
  toScreen,
  rect,
}) {
  if (!segments?.length) return
  ctx.save()
  ctx.strokeStyle = color
  ctx.globalAlpha = alpha
  ctx.lineWidth = lineWidth
  ctx.setLineDash([])
  ctx.beginPath()
  for (const segment of segments) {
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
  }
  ctx.stroke()
  ctx.restore()
}

function drawProbeProjection(ctx, { probeProjection, toScreen, rect }) {
  for (const branch of ['slow', 'fast']) {
    const projection = probeProjection?.[branch]
    if (!projection) continue
    drawProjectedSegments(ctx, { segments: projection.minusSegments, color: waveColors.hugoniotMinus, lineWidth: 1.35, toScreen, rect })
    drawProjectedSegments(ctx, { segments: projection.plusSegments, color: waveColors.hugoniotPlus, lineWidth: 1.35, toScreen, rect })
    drawProjectedSegments(ctx, {
      segments: projection.rarefactionSegments,
      color: branch === 'slow' ? waveColors.rarefactionSlow : waveColors.rarefactionFast,
      lineWidth: 1.35,
     
      toScreen,
      rect,
    })

  }
}

function drawProbeMarkers(ctx, { probeProjection, toScreen, rect }) {
  for (const branch of ['slow', 'fast']) {
    const projection = probeProjection?.[branch]
    if (!projection) continue
    const states = [
      { u: projection.point?.uMinus, v: projection.point?.vMinus },
      { u: projection.point?.uPlus, v: projection.point?.vPlus },
    ].filter((state, index, all) => Number.isFinite(state.u) && Number.isFinite(state.v) && (
      index === 0 || Math.hypot(state.u - all[0].u, state.v - all[0].v) > 1e-8
    ))
    for (const state of states) {
      const { x, y } = toScreen(state, rect)
      ctx.save()
      ctx.fillStyle = branch === 'slow' ? waveColors.characteristicSlow : waveColors.characteristicFast
      ctx.strokeStyle = '#facc15'
      ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(x, y, 9, 0, 2 * Math.PI); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.arc(x, y, 14, 0, 2 * Math.PI)
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#f8fafc'
      ctx.font = '600 12px system-ui, sans-serif'
      ctx.fillText(branch === 'slow' ? 'Pₛ' : 'Pᶠ', x + 13, y - 12)
      ctx.restore()
    }
  }
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
  // O hover altera somente o halo e a borda. Manter o raio constante evita
  // que U_L e U_R pareçam saltar quando o ponteiro cruza a área de captura.
  ctx.beginPath(); ctx.arc(x, y, 7, 0, 2 * Math.PI); ctx.fill(); ctx.stroke()
  ctx.restore()
}

export function drawStateSpaceCanvas(canvas, options) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { rect, dpr } = resizeCanvasForDpr(canvas)
  const { rarefactionFastSegments, fastCompositeProjectionSegments, implicitHugoniotPlusSegments, showHugoniotPlusPlusProjection, showHugoniotMinusMinusProjection, selfIntersectionProjection, bounds, selectedMap, hoverBranch, draggingBranch, view, params, toScreen, implicitInflectionSegments, implicitCoincidenceSegments, showCoincidence, implicitHugoniotMinusSegments, sonicRightSeparatorMinusSegments, sonicRightSeparatorPlusSegments, sonicLeftSeparatorPlusSegments, sonicLeftSeparatorMinusSegments, doubleSonicMinusSegments, doubleSonicPlusSegments, hysPlusProjectionSegments, rarefactionSlowSegments, compositeProjectionSegments, probeProjection } = options
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
  // A coincidência também é a borda comum das duas características.
  // Primeiro desenhamos sua versão-guia com o mesmo estilo discreto.
  drawProjectedSegments(ctx, {
    segments: implicitCoincidenceSegments,
    color: waveColors.coincidenceState,
    lineWidth: 1.35,

    alpha: 0.46,
    toScreen,
    rect,
  })
  // Se E estiver habilitada, a curva matemática é destacada separadamente
  // sobre a fronteira-guia.
  if (showCoincidence) {
    drawProjectedSegments(ctx, {
      segments: implicitCoincidenceSegments,
      color: waveColors.coincidenceState,
      lineWidth: 1.35,
      toScreen,
      rect,
    })
  }
  drawProjectedSegments(ctx, { segments: implicitInflectionSegments, color: waveColors.inflection ?? '#facc15', lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: sonicRightSeparatorMinusSegments, color: waveColors.extensionCoincidencePlus, lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: sonicRightSeparatorPlusSegments, color: waveColors.extensionCoincidencePlus, lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: sonicLeftSeparatorPlusSegments, color: waveColors.extensionCoincidenceMinus, lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: sonicLeftSeparatorMinusSegments, color: waveColors.extensionCoincidenceMinus, lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: selfIntersectionProjection?.plus, color: waveColors.hysteresisSelfIntersection, lineWidth: 1.35, toScreen, rect })
  ctx.save()
  ctx.fillStyle = waveColors.hysteresisSelfIntersection
  for (const point of selfIntersectionProjection?.points ?? []) {
    const { x, y } = toScreen(point, rect)
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, 2 * Math.PI)
    ctx.fill()
  }
  ctx.restore()
  drawProjectedSegments(ctx, { segments: doubleSonicMinusSegments, color: waveColors.doubleSonic, lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: doubleSonicPlusSegments, color: waveColors.doubleSonic, lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: implicitHugoniotMinusSegments, color: waveColors.hugoniotMinus, lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: rarefactionFastSegments, color: waveColors.rarefactionFast, lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: implicitHugoniotPlusSegments, color: waveColors.hugoniotPlus, lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: fastCompositeProjectionSegments?.minus, color: waveColors.compositeFast, lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: fastCompositeProjectionSegments?.plus, color: waveColors.compositeFast, lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: rarefactionSlowSegments, color: waveColors.rarefactionSlow, lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: compositeProjectionSegments?.minus, color: waveColors.compositeSlow, lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: compositeProjectionSegments?.plus, color: waveColors.compositeSlow, lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: hysPlusProjectionSegments.minus, color: waveColors.hysPlusMinusProjection, lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: hysPlusProjectionSegments.plus, color: waveColors.hysPlusPlusProjection, lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: hysPlusProjectionSegments.leftMinus, color: waveColors.hysMinusMinusProjection, lineWidth: 1.35, toScreen, rect })
  drawProjectedSegments(ctx, { segments: hysPlusProjectionSegments.leftPlus, color: waveColors.hysMinusPlusProjection, lineWidth: 1.35, toScreen, rect })
  drawProbeProjection(ctx, { probeProjection, toScreen, rect })
  drawSelectedPoint(ctx, { branch: 'slow', color: waveColors.characteristicSlow, selectedMap, hoverBranch, draggingBranch, toScreen, rect })
  drawSelectedPoint(ctx, { branch: 'fast', color: waveColors.characteristicFast, selectedMap, hoverBranch, draggingBranch, toScreen, rect })
  if (showHugoniotMinusMinusProjection) {
    const selected = selectedMap.slow?.selectedState
    const state = selected && { u: selected.uMinus, v: selected.vMinus }
    if (state && Number.isFinite(state.u) && Number.isFinite(state.v)) {
      const { x, y } = toScreen(state, rect)
      ctx.save()
      ctx.strokeStyle = waveColors.hugoniotMinus
      ctx.lineWidth = 1.35
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.arc(x, y, 11, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.restore()
    }
  }
  if (showHugoniotPlusPlusProjection) {
    const selected = selectedMap.fast?.selectedState
    const state = selected && { u: selected.uMinus, v: selected.vMinus }
    if (state && Number.isFinite(state.u) && Number.isFinite(state.v)) {
      const { x, y } = toScreen(state, rect)
      ctx.save()
      ctx.strokeStyle = waveColors.hugoniotPlus
      ctx.lineWidth = 1.35
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.arc(x, y, 11, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.restore()
    }
  }
  drawProbeMarkers(ctx, { probeProjection, toScreen, rect })
  drawViscousPortrait(ctx, options.phasePortrait, toScreen, rect)
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








