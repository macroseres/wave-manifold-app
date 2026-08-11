import { prepareParameterCanvas, createParameterMapProjection } from './drawing/canvasContext.js'
import { drawParameterRegions } from './drawing/regions.js'
import { drawGridAndAxes, drawParameterCurves, drawParameterMarkers } from './drawing/overlays.js'

export function drawParameterCanvas(canvas, { plotWindow, visibleCurves, hoveredCase, parameterPoint, isParameterPointHovered }) {
  const canvasState = prepareParameterCanvas(canvas)
  if (!canvasState) return

  const { ctx, rect } = canvasState
  const projection = createParameterMapProjection(rect, plotWindow)
  const drawingContext = { rect, plotWindow, ...projection }

  ctx.save()
  drawParameterRegions(ctx, { ...drawingContext, hoveredCase })
  drawGridAndAxes(ctx, drawingContext)
  drawParameterCurves(ctx, { ...drawingContext, visibleCurves })
  drawParameterMarkers(ctx, { ...drawingContext, parameterPoint, isParameterPointHovered })
  ctx.restore()
}
