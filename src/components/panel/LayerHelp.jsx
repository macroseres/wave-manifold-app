import React, { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import DocumentationViewer from './DocumentationViewer'

// Only one explanation may be visible across all panel rows.
let dismissActiveHelp = null

export default function LayerHelp({ children, helper }) {
  const anchor = useRef(null)
  const timer = useRef(null)
  const id = useId()
  const [position, setPosition] = useState(null)
  const [docs, setDocs] = useState(false)
  const close = () => { clearTimeout(timer.current); setPosition(null) }
  const keep = () => clearTimeout(timer.current)
  const leave = () => {
    keep()
    timer.current = setTimeout(() => setPosition(null), 160)
  }
  const show = (event) => {
    keep()
    const rect = anchor.current.getBoundingClientRect()
    const width = Math.min(400, window.innerWidth - 24)
    const maxHeight = Math.min(420, window.innerHeight - 24)
    // Mouse hover starts beside the pointer; keyboard focus uses the row.
    // Keep the popup stationary so its documentation button stays reachable.
    const x = event.type === 'mouseenter' ? event.clientX : rect.left
    const y = event.type === 'mouseenter' ? event.clientY : rect.bottom
    const left = x + width + 24 <= window.innerWidth ? x + 12 : Math.max(12, x - width - 12)
    const nextPosition = { left, top: Math.max(12, Math.min(y + 12, window.innerHeight - maxHeight - 12)), width }
    timer.current = setTimeout(() => {
      dismissActiveHelp?.()
      dismissActiveHelp = close
      setPosition(nextPosition)
    }, event.type === 'mouseenter' ? 280 : 0)
  }
  useEffect(() => {
    const hide = () => { clearTimeout(timer.current); setPosition(null) }
    const dismiss = event => { if (event.key === 'Escape') hide() }
    const scroll = event => { if (!event.target.closest?.('.layer-help-popover')) hide() }
    window.addEventListener('keydown', dismiss)
    window.addEventListener('scroll', scroll, true)
    const resize = hide
    window.addEventListener('resize', resize)
    return () => {
      clearTimeout(timer.current)
      window.removeEventListener('keydown', dismiss)
      window.removeEventListener('scroll', scroll, true)
      window.removeEventListener('resize', resize)
    }
  }, [])
  return <>
    <div ref={anchor} onMouseEnter={show} onMouseLeave={leave} onFocus={show} onBlur={leave} aria-describedby={position ? id : undefined}>
      {children}
    </div>
    {position && createPortal(<div id={id} className="layer-help-popover" style={position} onMouseEnter={keep} onMouseLeave={leave} onFocus={keep} onBlur={leave}>
      <header className="layer-help-title">{helper.title}</header>
      <div className="layer-help-description">{helper.description}</div>
      <footer className="layer-help-footer"><button type="button" onClick={() => { close(); setDocs(true) }}>Abrir documentação →</button></footer>
    </div>, document.body)}
    {docs && createPortal(<DocumentationViewer open initialChapter={helper.documentation} onClose={() => {
      setDocs(false)
      anchor.current?.querySelector('input')?.focus()
    }} />, document.body)}
  </>
}
