import React, { useEffect, useMemo, useState } from 'react'
import introduction from '../../../docs/01-introducao-e-fundamentos.md?raw'
import interfaceFlow from '../../../docs/02-interface-e-fluxo-de-uso.md?raw'
import curves from '../../../docs/03-construcao-das-curvas.md?raw'
import surfaces from '../../../docs/04-construcao-das-superficies.md?raw'
import inspectionSolution from '../../../docs/05-inspecao-e-solucao.md?raw'
import computationDevelopment from '../../../docs/06-metodos-e-desenvolvimento.md?raw'
import { ensureMathJaxLoaded, typesetMathJax } from './mathJaxTypeset'

const chapters = [
  { id: 'introducao', title: 'Introdução e fundamentos', source: introduction },
  { id: 'interface', title: 'Interface e fluxo de uso', source: interfaceFlow },
  { id: 'curvas', title: 'Construção das curvas', source: curves },
  { id: 'superficies', title: 'Construção das superfícies', source: surfaces },
  { id: 'solucao', title: 'Inspeção e construção da solução', source: inspectionSolution },
  { id: 'metodos', title: 'Métodos computacionais e desenvolvimento', source: computationDevelopment },
]

function inlineMarkdown(text) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) return <a key={index} href={link[2]}>{link[1]}</a>
    return part
  })
}

function renderMarkdown(source) {
  const lines = source.trim().split(/\r?\n/)
  const nodes = []
  let list = []
  let listType = 'ul'
  let code = []
  let inCode = false
  let math = null

  const flushList = () => {
    if (!list.length) return
    const List = listType
    nodes.push(<List key={`list-${nodes.length}`}>{list.map((item, index) => <li key={index}>{inlineMarkdown(item)}</li>)}</List>)
    list = []
  }
  const flushCode = () => {
    if (!code.length) return
    nodes.push(<pre key={`code-${nodes.length}`}><code>{code.join('\n')}</code></pre>)
    code = []
  }

  lines.forEach((line) => {
    if (line.trim() === '\\[') {
      flushList()
      math = []
      return
    }
    if (line.trim() === '\\]' && math) {
      nodes.push(<div className="wm-docs-math" key={`math-${nodes.length}`}>{`\\[${math.join('\n')}\\]`}</div>)
      math = null
      return
    }
    if (math) {
      math.push(line)
      return
    }
    if (line.startsWith('```')) {
      if (inCode) flushCode()
      else flushList()
      inCode = !inCode
      return
    }
    if (inCode) {
      code.push(line)
      return
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      flushList()
      const level = Math.min(3, heading[1].length)
      const Tag = `h${level}`
      nodes.push(<Tag key={`heading-${nodes.length}`}>{inlineMarkdown(heading[2])}</Tag>)
      return
    }
    const item = line.match(/^([-*]|\d+\.)\s+(.+)$/)
    if (item) {
      const nextListType = item[1].endsWith('.') ? 'ol' : 'ul'
      if (list.length && nextListType !== listType) flushList()
      listType = nextListType
      list.push(item[2])
      return
    }
    flushList()
    if (line.trim()) nodes.push(<p key={`paragraph-${nodes.length}`}>{inlineMarkdown(line)}</p>)
  })
  flushList()
  flushCode()
  return nodes
}

export default function DocumentationViewer({ open, onClose }) {
  const [chapterIndex, setChapterIndex] = useState(0)
  const chapter = chapters[chapterIndex]
  const content = useMemo(() => renderMarkdown(chapter.source), [chapter])

  useEffect(() => {
    if (!open) return undefined
    ensureMathJaxLoaded()
    const timer = window.setTimeout(typesetMathJax, 50)
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [chapterIndex, onClose, open])

  if (!open) return null

  return (
    <div className="wm-docs-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="wm-docs-dialog" role="dialog" aria-modal="true" aria-label="Documentação do Wave Manifold Explorer">
        <header className="wm-docs-header">
          <div><span>Wave Manifold Explorer</span><strong>Documentação</strong></div>
          <button type="button" onClick={onClose} aria-label="Fechar documentação">×</button>
        </header>
        <div className="wm-docs-layout">
          <nav className="wm-docs-nav" aria-label="Capítulos da documentação">
            {chapters.map((item, index) => (
              <button key={item.id} type="button" className={index === chapterIndex ? 'active' : ''} onClick={() => setChapterIndex(index)}>
                <span>{index + 1}</span>{item.title}
              </button>
            ))}
          </nav>
          <article className="wm-docs-content">{content}</article>
        </div>
        <footer className="wm-docs-footer">
          <button type="button" disabled={chapterIndex === 0} onClick={() => setChapterIndex((index) => index - 1)}>← Anterior</button>
          <span>Capítulo {chapterIndex + 1} de {chapters.length}</span>
          <button type="button" disabled={chapterIndex === chapters.length - 1} onClick={() => setChapterIndex((index) => index + 1)}>Próximo →</button>
        </footer>
      </section>
    </div>
  )
}
