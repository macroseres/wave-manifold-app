import { parameterPalette } from '../../../components/panel/schaefferShearerConfig.js'
import { clampX, clampY } from './canvasContext.js'

function drawStrips(ctx, rect, plotWindow, callback) {
  const strips = Math.max(160, Math.round(rect.width))
  for (let i = 0; i < strips; i += 1) {
    const x0 = (rect.width * i) / strips
    const x1 = (rect.width * (i + 1)) / strips
    const b1 = plotWindow.b1Min + ((i + 0.5) * (plotWindow.b1Max - plotWindow.b1Min)) / strips
    callback({ x0, x1, b1 })
  }
}

function c1Limit(b1) {
  return 2 * Math.sqrt(Math.max(0, b1 - 1))
}

function c2Limit(b1) {
  return Math.sqrt(Math.max(0, -4 / (b1 + 1)))
}

function c3Limit(b1) {
  const value = ((b1 - 1) * (b1 + 2) * (b1 + 2)) / (b1 + 1)
  return value >= 0 ? Math.sqrt(value) : Number.NaN
}

function fillSymmetricBand(ctx, rect, mapY, x0, x1, limit) {
  const yTop = clampY(rect, mapY(limit))
  const yBottom = clampY(rect, mapY(-limit))
  if (yBottom > yTop) ctx.fillRect(x0, yTop, x1 - x0 + 1, yBottom - yTop)
}

function fillOuter(ctx, rect, mapY, x0, x1, limit) {
  const yUpper = clampY(rect, mapY(limit))
  const yLower = clampY(rect, mapY(-limit))
  if (yUpper > 0) ctx.fillRect(x0, 0, x1 - x0 + 1, yUpper)
  if (yLower < rect.height) ctx.fillRect(x0, yLower, x1 - x0 + 1, rect.height - yLower)
}

function fillBetweenLimits(ctx, rect, mapY, x0, x1, outerLimit, innerLimit) {
  const yUpperOuter = clampY(rect, mapY(outerLimit))
  const yUpperInner = clampY(rect, mapY(innerLimit))
  const yLowerInner = clampY(rect, mapY(-innerLimit))
  const yLowerOuter = clampY(rect, mapY(-outerLimit))
  if (yUpperInner > yUpperOuter) ctx.fillRect(x0, yUpperOuter, x1 - x0 + 1, yUpperInner - yUpperOuter)
  if (yLowerOuter > yLowerInner) ctx.fillRect(x0, yLowerInner, x1 - x0 + 1, yLowerOuter - yLowerInner)
}

function fillVerticalBand(ctx, rect, plotWindow, mapX, key, caseFill, leftBound, rightBound) {
  const left = Math.max(plotWindow.b1Min, leftBound)
  const right = Math.min(plotWindow.b1Max, rightBound)
  if (right <= left) return
  ctx.save()
  const x0 = clampX(rect, mapX(left))
  const x1 = clampX(rect, mapX(right))
  ctx.fillStyle = caseFill(key)
  ctx.fillRect(x0, 0, x1 - x0, rect.height)
  ctx.restore()
}

export function drawParameterRegions(ctx, { rect, plotWindow, mapX, mapY, hoveredCase }) {
  let highlightedCaseKey = null
  const caseFill = (key) => {
    if (highlightedCaseKey === key) return parameterPalette.caseHighlights[key] ?? parameterPalette.cases[key]
    if (hoveredCase) return parameterPalette.caseMuted
    return parameterPalette.cases[key]
  }

  const fillByCase = {
    iv: () => {
      ctx.save(); ctx.fillStyle = caseFill('iv')
      drawStrips(ctx, rect, plotWindow, ({ x0, x1, b1 }) => { if (b1 > 1) fillSymmetricBand(ctx, rect, mapY, x0, x1, c1Limit(b1)) })
      ctx.restore()
    },
    iiia: () => {
      ctx.save(); ctx.fillStyle = caseFill('iiia')
      drawStrips(ctx, rect, plotWindow, ({ x0, x1, b1 }) => {
        if (b1 <= 1) return
        const inner = c1Limit(b1); const outer = c3Limit(b1)
        if (Number.isFinite(outer) && outer > inner) fillBetweenLimits(ctx, rect, mapY, x0, x1, outer, inner)
      })
      ctx.restore()
    },
    iiib: () => {
      ctx.save(); ctx.fillStyle = caseFill('iiib')
      drawStrips(ctx, rect, plotWindow, ({ x0, x1, b1 }) => { const limit = c3Limit(b1); if (b1 > 1 && Number.isFinite(limit)) fillOuter(ctx, rect, mapY, x0, x1, limit) })
      ctx.restore()
    },
    iiic: () => fillVerticalBand(ctx, rect, plotWindow, mapX, 'iiic', caseFill, 0, 1),
    iia: () => fillVerticalBand(ctx, rect, plotWindow, mapX, 'iia', caseFill, -1, 0),
    iib: () => {
      ctx.save(); ctx.fillStyle = caseFill('iib')
      drawStrips(ctx, rect, plotWindow, ({ x0, x1, b1 }) => {
        if (b1 >= -1) return
        const l2 = c2Limit(b1); const l3 = c3Limit(b1)
        if (Number.isFinite(l2) && Number.isFinite(l3)) fillOuter(ctx, rect, mapY, x0, x1, Math.max(l2, l3))
      })
      ctx.restore()
    },
    iic: () => {
      ctx.save(); ctx.fillStyle = caseFill('iic')
      drawStrips(ctx, rect, plotWindow, ({ x0, x1, b1 }) => {
        if (b1 >= -1) return
        const l2 = c2Limit(b1); const l3 = c3Limit(b1)
        if (Number.isFinite(l2) && Number.isFinite(l3) && l3 > l2) fillBetweenLimits(ctx, rect, mapY, x0, x1, l3, l2)
      })
      ctx.restore()
    },
    ia: () => {
      ctx.save(); ctx.fillStyle = caseFill('ia')
      drawStrips(ctx, rect, plotWindow, ({ x0, x1, b1 }) => {
        if (b1 <= -2 || b1 >= -1) return
        const l2 = c2Limit(b1); const l3 = c3Limit(b1)
        if (Number.isFinite(l2) && Number.isFinite(l3)) fillSymmetricBand(ctx, rect, mapY, x0, x1, Math.min(l2, l3))
      })
      ctx.restore()
    },
    ib: () => {
      ctx.save(); ctx.fillStyle = caseFill('ib')
      drawStrips(ctx, rect, plotWindow, ({ x0, x1, b1 }) => {
        if (b1 >= -1) return
        const l2 = c2Limit(b1); const l3 = c3Limit(b1)
        if (Number.isFinite(l2) && Number.isFinite(l3) && l2 > l3) fillBetweenLimits(ctx, rect, mapY, x0, x1, l2, l3)
      })
      ctx.restore()
    },
    ic: () => {
      ctx.save(); ctx.fillStyle = caseFill('ic')
      drawStrips(ctx, rect, plotWindow, ({ x0, x1, b1 }) => {
        if (b1 >= -2) return
        const l2 = c2Limit(b1); const l3 = c3Limit(b1)
        if (Number.isFinite(l2) && Number.isFinite(l3)) fillSymmetricBand(ctx, rect, mapY, x0, x1, Math.min(l2, l3))
      })
      ctx.restore()
    },
  }

  Object.keys(parameterPalette.cases).forEach((key) => fillByCase[key]?.())
  if (hoveredCase) {
    highlightedCaseKey = hoveredCase
    fillByCase[hoveredCase]?.()
  }
}
