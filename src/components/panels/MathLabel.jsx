import { useEffect, useRef } from 'react'

function ensureMathJaxLoaded() {
  if (typeof window === 'undefined') return

  window.MathJax = window.MathJax || {
    tex: {
      inlineMath: [['\\(', '\\)'], ['$', '$']],
      displayMath: [['\\[', '\\]']],
    },
    svg: { fontCache: 'global' },
    startup: { typeset: false },
  }

  if (document.getElementById('mathjax-script')) return

  const script = document.createElement('script')
  script.id = 'mathjax-script'
  script.async = true
  script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js'
  document.head.appendChild(script)
}

function typesetElement(element) {
  if (typeof window === 'undefined' || !element) return

  if (window.MathJax?.typesetPromise) {
    window.MathJax.typesetPromise([element]).catch(() => {})
    return
  }

  window.setTimeout(() => {
    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([element]).catch(() => {})
    }
  }, 120)
}

export default function MathLabel({ tex }) {
  const ref = useRef(null)

  useEffect(() => {
    ensureMathJaxLoaded()
    typesetElement(ref.current)
  }, [tex])

  return <span ref={ref} className="mathjax-label">{`\\(${tex}\\)`}</span>
}
