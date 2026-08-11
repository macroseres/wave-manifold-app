export function prepareParameterCanvas(canvas) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const rect = canvas.getBoundingClientRect()
  const dpr = globalThis.devicePixelRatio || 1
  const width = Math.max(1, Math.round(rect.width * dpr))
  const height = Math.max(1, Math.round(rect.height * dpr))

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, rect.width, rect.height)

  return { ctx, rect }
}

export function createParameterMapProjection(rect, plotWindow) {
  const mapX = (b1) => ((b1 - plotWindow.b1Min) / Math.max(1e-12, plotWindow.b1Max - plotWindow.b1Min)) * rect.width
  const mapY = (b2) => ((plotWindow.b2Max - b2) / Math.max(1e-12, plotWindow.b2Max - plotWindow.b2Min)) * rect.height
  return {
    mapX,
    mapY,
    axisX: Math.max(0, Math.min(rect.width, mapX(0))),
    axisY: Math.max(0, Math.min(rect.height, mapY(0))),
  }
}

export function clampY(rect, y) {
  return Math.max(0, Math.min(rect.height, y))
}

export function clampX(rect, x) {
  return Math.max(0, Math.min(rect.width, x))
}
