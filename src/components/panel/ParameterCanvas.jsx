import React, { useEffect, useRef, useState } from 'react'
import { caseIntervalsAtB1, constrainPointToCase, parameterPointMeta } from './schaefferShearerConfig'
import { drawParameterCanvas } from './parameterCanvasDrawing'

function ParameterCanvas({ plotWindow, visibleCurves, hoveredCase, selectedCase, parameterPoint, pointBounds, onParameterPointChange }) {
  const canvasRef = useRef(null)
  const draggingParameterPointRef = useRef(false)
  const pendingParameterPointRef = useRef(null)
  const frameRef = useRef(null)
  const [isParameterPointHovered, setIsParameterPointHovered] = useState(false)
  const [isDraggingParameterPoint, setIsDraggingParameterPoint] = useState(false)

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    const draw = () => drawParameterCanvas(canvas, {
      plotWindow,
      visibleCurves,
      hoveredCase,
      parameterPoint,
      isParameterPointHovered,
    })

    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [plotWindow, visibleCurves, hoveredCase, selectedCase, parameterPoint, isParameterPointHovered])

  const pointFromEvent = (event) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left))
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top))
    return {
      b1: plotWindow.b1Min + (x / Math.max(1e-12, rect.width)) * (plotWindow.b1Max - plotWindow.b1Min),
      b2: plotWindow.b2Max - (y / Math.max(1e-12, rect.height)) * (plotWindow.b2Max - plotWindow.b2Min),
    }
  }

  const parameterPointScreenDistance = (event) => {
    const canvas = canvasRef.current
    if (!canvas) return Number.POSITIVE_INFINITY
    const rect = canvas.getBoundingClientRect()
    const x = ((parameterPoint.b1 - plotWindow.b1Min) / Math.max(1e-12, plotWindow.b1Max - plotWindow.b1Min)) * rect.width
    const y = ((plotWindow.b2Max - parameterPoint.b2) / Math.max(1e-12, plotWindow.b2Max - plotWindow.b2Min)) * rect.height
    const pointerX = event.clientX - rect.left
    const pointerY = event.clientY - rect.top
    return Math.hypot(pointerX - x, pointerY - y)
  }

  const isPointInsideSelectedCase = (point) => {
    if (!point || !selectedCase) return false
    const intervals = caseIntervalsAtB1(selectedCase, point.b1, pointBounds)
    return intervals.some(([min, max]) => point.b2 >= min && point.b2 <= max)
  }

  const commitPendingParameterPoint = () => {
    frameRef.current = null
    const next = pendingParameterPointRef.current
    pendingParameterPointRef.current = null
    if (next) onParameterPointChange?.(next)
  }

  const scheduleParameterPointChange = (point, immediate = false) => {
    if (immediate) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      pendingParameterPointRef.current = null
      onParameterPointChange?.(point)
      return
    }

    pendingParameterPointRef.current = point
    if (!frameRef.current) {
      frameRef.current = requestAnimationFrame(commitPendingParameterPoint)
    }
  }

  const updateParameterPointFromEvent = (event, options = {}) => {
    const next = pointFromEvent(event)
    if (!next) return
    scheduleParameterPointChange(constrainPointToCase(next, selectedCase, pointBounds), options.immediate)
  }

  const handlePointerDown = (event) => {
    const next = pointFromEvent(event)
    const startsOnPoint = parameterPointScreenDistance(event) <= 18
    const startsInsideSelectedRegion = isPointInsideSelectedCase(next)
    if (!startsOnPoint && !startsInsideSelectedRegion) return

    event.preventDefault()
    draggingParameterPointRef.current = true
    setIsDraggingParameterPoint(true)
    setIsParameterPointHovered(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
    updateParameterPointFromEvent(event)
  }

  const handlePointerMove = (event) => {
    const hovering = parameterPointScreenDistance(event) <= 14
    setIsParameterPointHovered(hovering || draggingParameterPointRef.current)
    if (draggingParameterPointRef.current) updateParameterPointFromEvent(event)
  }

  const stopDraggingParameterPoint = (event) => {
    if (!draggingParameterPointRef.current) return
    draggingParameterPointRef.current = false
    setIsDraggingParameterPoint(false)
    updateParameterPointFromEvent(event, { immediate: true })
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    setIsParameterPointHovered(parameterPointScreenDistance(event) <= 14)
  }

  const handlePointerLeave = () => {
    if (!draggingParameterPointRef.current) setIsParameterPointHovered(false)
  }

  return (
    <canvas
      className="stage-param-canvas"
      ref={canvasRef}
      title={parameterPointMeta.label}
      style={{ cursor: isDraggingParameterPoint ? 'grabbing' : isParameterPointHovered ? 'grab' : 'default' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDraggingParameterPoint}
      onPointerCancel={stopDraggingParameterPoint}
      onPointerLeave={handlePointerLeave}
    />
  )
}

export default ParameterCanvas
