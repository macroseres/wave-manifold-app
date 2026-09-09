import { useRef, useState } from 'react'

export function zoomStateBounds(bounds, factor) {
  const u = (bounds.uMin + bounds.uMax) / 2, v = (bounds.vMin + bounds.vMax) / 2
  const du = (bounds.uMax - bounds.uMin) * factor / 2, dv = (bounds.vMax - bounds.vMin) * factor / 2
  return { uMin: u - du, uMax: u + du, vMin: v - dv, vMax: v + dv }
}

export function useStateViewport(baseBounds) {
  const [history, setHistory] = useState([])
  const [mode, setMode] = useState('select')
  const [preview, setPreview] = useState(null)
  const [showLabels, setShowLabels] = useState(true)
  const gesture = useRef(null)
  const bounds = history.at(-1) ?? baseBounds
  const commit = next => {
    if (Object.values(next).every(Number.isFinite) && next.uMax - next.uMin > 1e-10 && next.vMax - next.vMin > 1e-10) {
      setHistory(previous => [...(previous.length ? previous : [baseBounds]), next].slice(-30))
    }
  }
  const down = event => {
    if (event.button !== 0 || mode === 'select') return false
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const start = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    gesture.current = { rect, start, bounds, mode }
    setPreview({ start, end: start, mode })
    event.currentTarget.setPointerCapture(event.pointerId)
    return true
  }
  const move = event => {
    const g = gesture.current
    if (!g) return false
    const end = { x: Math.max(0, Math.min(g.rect.width, event.clientX - g.rect.left)), y: Math.max(0, Math.min(g.rect.height, event.clientY - g.rect.top)) }
    setPreview({ start: g.start, end, mode: g.mode })
    return true
  }
  const up = event => {
    const g = gesture.current
    if (!g) return false
    gesture.current = null
    setPreview(null)
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    if (event.type === 'pointercancel') return true
    const x = Math.max(0, Math.min(g.rect.width, event.clientX - g.rect.left)), y = Math.max(0, Math.min(g.rect.height, event.clientY - g.rect.top))
    const du = g.bounds.uMax - g.bounds.uMin, dv = g.bounds.vMax - g.bounds.vMin
    if (g.mode === 'pan') {
      const u = (g.start.x - x) / g.rect.width * du, v = (y - g.start.y) / g.rect.height * dv
      if (Math.hypot(x - g.start.x, y - g.start.y) > 3) commit({ uMin: g.bounds.uMin + u, uMax: g.bounds.uMax + u, vMin: g.bounds.vMin + v, vMax: g.bounds.vMax + v })
    } else if (Math.abs(x - g.start.x) > 8 && Math.abs(y - g.start.y) > 8) {
      commit({ uMin: g.bounds.uMin + Math.min(x, g.start.x) / g.rect.width * du,
        uMax: g.bounds.uMin + Math.max(x, g.start.x) / g.rect.width * du,
        vMin: g.bounds.vMax - Math.max(y, g.start.y) / g.rect.height * dv,
        vMax: g.bounds.vMax - Math.min(y, g.start.y) / g.rect.height * dv })
    }
    return true
  }
  const cancel = () => { gesture.current = null; setPreview(null) }
  return { bounds, mode, setMode, preview, showLabels, setShowLabels, down, move, up, cancel,
    zoom: factor => commit(zoomStateBounds(bounds, factor)),
    reset: () => { cancel(); setHistory([]) },
    undo: () => { cancel(); setHistory(previous => previous.slice(0, -1)) }, canUndo: history.length > 0,
    transform: preview?.mode === 'pan' ? `translate(${preview.end.x - preview.start.x}px, ${preview.end.y - preview.start.y}px)` : undefined }
}
