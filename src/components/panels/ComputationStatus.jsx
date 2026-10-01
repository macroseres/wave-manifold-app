import { useState } from 'react'
import { cancelComputations, retryComputations, useComputationStatus } from '../../hooks/computationStatus.js'
export default function ComputationStatus({ dragging }) {
  const { tasks, recent } = useComputationStatus()
  const [expanded, setExpanded] = useState(false)
  const last = recent[0]
  return <aside className="computation-status" aria-label="Estado dos cálculos">
    <div role="status" aria-live="polite">{dragging ? 'Prévia de arraste · refinamento ao soltar' : tasks.length
      ? `Calculando ${tasks.length} tarefa(s)…` : last ? `Cálculo ${last.status} · ${(last.duration / 1000).toFixed(2)} s` : 'Pronto'}</div>
    {tasks.length > 0 && <button onClick={cancelComputations}>Cancelar cálculos</button>}
    {!tasks.length && last && (last.status === 'cancelado' || last.status === 'erro') && <button onClick={retryComputations}>Tentar novamente</button>}
    {recent.length > 0 && <button onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>Tempos</button>}
    {expanded && <ul>{recent.map((item, i) => <li key={i}>{item.label}: {item.status}, {(item.duration / 1000).toFixed(2)} s</li>)}</ul>}
  </aside>
}
