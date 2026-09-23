export function ensureMathJaxLoaded() {
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
  script.onload = () => typesetMathJax()
  document.head.appendChild(script)
}

export function typesetMathJax() {
  if (typeof window === 'undefined') return
  if (window.MathJax?.typesetPromise) {
    window.MathJax.typesetPromise()
  }
}
