const stateDistance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
const curveDrawingCache = new WeakMap()

function curveDrawing(points, toScreen, rect) {
  const cached = curveDrawingCache.get(points)
  if (cached?.toScreen === toScreen && cached.width === rect.width && cached.height === rect.height) return cached
  const screenPoints = points.map(p => toScreen({ u: p[0], v: p[1] }, rect))
  const cumulative = [0]
  const path = typeof Path2D === 'function' ? new Path2D() : null
  screenPoints.forEach((p, i) => {
    if (i) {
      path?.lineTo(p.x, p.y)
      cumulative.push(cumulative[i - 1] + Math.hypot(p.x - screenPoints[i - 1].x, p.y - screenPoints[i - 1].y))
    } else path?.moveTo(p.x, p.y)
  })
  const value = { toScreen, width: rect.width, height: rect.height, screenPoints, cumulative, path }
  curveDrawingCache.set(points, value)
  return value
}

function drawSegments(ctx, segments, screen, color, dash = []) {
  if (!segments?.length) return
  ctx.save()
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.9
  ctx.lineWidth = 1.35
  ctx.setLineDash(dash)
  ctx.beginPath()
  for (const [a, b] of segments) {
    const p = screen(a), q = screen(b)
    ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y)
  }
  ctx.stroke()
  ctx.restore()
}

export function drawViscousPortrait(ctx, portrait, toScreen, rect) {
  if (!portrait) return
  const screen = p => toScreen({ u: p[0], v: p[1] }, rect)
  const options = { equilibria: true, nullclines: false, eigenDirections: false,
    invariantManifolds: true, connectionOnly: false, ...(portrait.options ?? {}) }
  ctx.save()
  ctx.beginPath(); ctx.rect(0, 0, rect.width, rect.height); ctx.clip()

  if (options.nullclines && portrait.nullclines) {
    drawSegments(ctx, portrait.nullclines.first, screen, '#a78bfa', [7, 5])
    drawSegments(ctx, portrait.nullclines.second, screen, '#fb7185', [3, 5])
  }

  const isLeftCurve = curve => curve.equilibrium && stateDistance(curve.equilibrium, portrait.left) < 1e-6
  const isRightCurve = curve => curve.equilibrium && stateDistance(curve.equilibrium, portrait.right) < 1e-6
  const visibleCurves = portrait.curves.filter(curve => {
    if (options.connectionOnly) return curve.kind === 'connection'
      || (curve.kind === 'separatrix' && ((isLeftCurve(curve) && curve.stability === 'unstable') || (isRightCurve(curve) && curve.stability === 'stable')))
    if (curve.kind === 'separatrix' && !options.invariantManifolds) return false
    return true
  })
  const order = { orbit: 0, separatrix: 1, connection: 2 }
  const arrowPositions = []
  for (const curve of [...visibleCurves].sort((a, b) => order[a.kind] - order[b.kind])) {
    const manifoldColor = curve.stability === 'stable' ? '#a78bfa' : '#fbbf24'
    ctx.strokeStyle = curve.kind === 'connection' ? '#4ade80' : curve.kind === 'separatrix' ? manifoldColor : '#22d3ee'
    ctx.globalAlpha = curve.kind === 'orbit' ? 0.72 : 1
    ctx.lineWidth = curve.kind === 'orbit' ? 1.1 : 2.3
    ctx.setLineDash([])
    const { screenPoints, cumulative, path } = curveDrawing(curve.points, toScreen, rect)
    if (path) ctx.stroke(path)
    else {
      ctx.beginPath()
      screenPoints.forEach((q, i) => { if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y) })
      ctx.stroke()
    }
    const totalLength = cumulative.at(-1)
    if (totalLength > 28) for (const fraction of totalLength > 220 ? [0.28, 0.58, 0.82] : [0.42, 0.72]) {
      const target = totalLength * fraction
      let i = 1
      while (i < cumulative.length - 1 && cumulative[i] < target) i++
      const p = screenPoints[Math.max(0, i - 1)], q = screenPoints[i]
      const dx = q.x - p.x, dy = q.y - p.y, n = Math.hypot(dx, dy)
      if (n < 1e-6) continue
      if (curve.kind === 'orbit' && arrowPositions.some(a => Math.hypot(a.x - q.x, a.y - q.y) < 26)) continue
      if ([portrait.left, portrait.right, ...(portrait.equilibriumPoints ?? [])].some(eq => {
        const e = screen(eq); return Math.hypot(e.x - q.x, e.y - q.y) < 20
      })) continue
      arrowPositions.push(q)
      ctx.beginPath()
      for (const sign of [-1, 1]) {
        ctx.moveTo(q.x, q.y)
        ctx.lineTo(q.x - 7 * dx / n + sign * 3 * dy / n, q.y - 7 * dy / n - sign * 3 * dx / n)
      }
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1

  if (options.eigenDirections) for (const item of portrait.equilibriumData ?? []) {
    const q = screen(item.state)
    for (const { value, vector } of item.directions ?? []) {
      const length = 30
      // Convert the state-space direction through toScreen so anisotropic view scaling is respected.
      const probe = screen([item.state[0] + vector[0], item.state[1] + vector[1]])
      const dx = probe.x - q.x, dy = probe.y - q.y, n = Math.hypot(dx, dy)
      if (n < 1e-9) continue
      ctx.save(); ctx.strokeStyle = value < 0 ? '#a78bfa' : '#fbbf24'; ctx.lineWidth = 2; ctx.globalAlpha = 0.95
      ctx.beginPath(); ctx.moveTo(q.x - length * dx / n, q.y - length * dy / n); ctx.lineTo(q.x + length * dx / n, q.y + length * dy / n); ctx.stroke(); ctx.restore()
    }
  }

  if (options.equilibria) for (const item of portrait.equilibriumData ?? []) {
    const equilibrium = item.state, q = screen(equilibrium)
    const isLeft = stateDistance(equilibrium, portrait.left) < 1e-7
    const isRight = stateDistance(equilibrium, portrait.right) < 1e-7
    ctx.save()
    ctx.strokeStyle = isLeft ? '#facc15' : isRight ? '#fb7185' : '#4ade80'
    ctx.fillStyle = 'rgba(2, 6, 23, 0.78)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(q.x, q.y, isLeft ? 9 : 8, 0, 2 * Math.PI); ctx.fill(); ctx.stroke()
    if (!isLeft) { ctx.beginPath(); ctx.moveTo(q.x - 4, q.y); ctx.lineTo(q.x + 4, q.y); ctx.moveTo(q.x, q.y - 4); ctx.lineTo(q.x, q.y + 4); ctx.stroke() }
    ctx.fillStyle = '#e2e8f0'; ctx.font = '11px sans-serif'
    ctx.fillText(item.classification.type, q.x + 10, q.y - 9)
    ctx.restore()
  }

  ;[portrait.left, portrait.right].forEach((p, i) => {
    const q = screen(p)
    ctx.fillStyle = i ? '#fb7185' : '#facc15'; ctx.strokeStyle = '#020617'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(q.x, q.y, 6, 0, 2 * Math.PI); ctx.fill(); ctx.stroke()
    ctx.font = 'bold 13px sans-serif'
    const label = portrait.selectedStates
      ? i ? portrait.adjustedRight ? (portrait.rightIsEquilibrium ? 'U_R* (equilíbrio)' : 'U_R*') : portrait.rightIsEquilibrium ? 'U_R' : 'U_R (não equilíbrio)' : 'U_L'
      : i ? 'U₊ (choque)' : 'U₋ (choque)'
    ctx.fillText(label, q.x + 9, q.y + (i ? 18 : -9))
  })
  ctx.restore()
}
