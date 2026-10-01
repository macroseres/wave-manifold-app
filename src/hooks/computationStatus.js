import { useSyncExternalStore } from 'react'
const tasks = new Map()
const listeners = new Set()
let sequence = 0
let epoch = 0
let snapshot = { tasks: [], recent: [], epoch }
const emit = () => { snapshot = { ...snapshot, tasks: [...tasks.values()].map(({ id, label }) => ({ id, label })), epoch }; listeners.forEach(fn => fn()) }
const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn) }
export const useComputationStatus = () => useSyncExternalStore(subscribe, () => snapshot)
export const useComputationEpoch = () => useSyncExternalStore(subscribe, () => epoch)
export function startComputation(label, cancel) {
  const id = ++sequence, started = performance.now()
  tasks.set(id, { id, label, cancel })
  emit()
  let ended = false
  return status => {
    if (ended) return
    ended = true
    tasks.delete(id)
    snapshot = { ...snapshot, recent: [{ label, status, duration: Math.round(performance.now() - started) }, ...snapshot.recent].slice(0, 5) }
    emit()
  }
}
export function cancelComputations() { [...tasks.values()].forEach(task => task.cancel()) }
export function retryComputations() { epoch += 1; emit() }
