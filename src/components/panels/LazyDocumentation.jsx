import { lazy, Suspense } from 'react'
const DocumentationViewer = lazy(() => import('./DocumentationViewer.jsx'))
export default function LazyDocumentation(props) {
  if (!props.open) return null
  return <Suspense fallback={<div className="wm-docs-backdrop" role="status">Carregando manual…</div>}>
    <DocumentationViewer {...props} />
  </Suspense>
}
