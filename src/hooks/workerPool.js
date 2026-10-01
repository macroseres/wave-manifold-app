// A task belongs to its subscribers. Obsolete tasks release their worker immediately.
export function createWorkerPool({ onStart = () => () => {}, remember = () => {} } = {}) {
  const tasks = new Map()
  let id = 0
  return {
    subscribe(key, createWorker, payload, listener) {
      let task = tasks.get(key)
      if (!task) {
        const worker = createWorker()
        task = { worker, listeners: new Set(), id: ++id }
        tasks.set(key, task)
        const finish = (result, status) => {
          if (tasks.get(key) !== task) return
          tasks.delete(key)
          worker.terminate()
          task.done(status)
          if (result?.ok) remember(key, result.data)
          if (result) task.listeners.forEach(fn => fn(result))
        }
        task.done = onStart('Curvas', () => finish({ ok: false, error: 'Cálculo cancelado.' }, 'cancelado'))
        worker.onmessage = ({ data }) => { if (data.id === task.id) finish(data, data.ok ? 'concluído' : 'erro') }
        worker.onerror = error => finish({ ok: false, error: error.message || 'Falha no cálculo.' }, 'erro')
        task.finish = finish
        // The first listener must be subscribed before a synchronous error is reported.
        task.listeners.add(listener)
        try { worker.postMessage({ id: task.id, payload }) }
        catch (error) { finish({ ok: false, error: error.message }, 'erro') }
      } else task.listeners.add(listener)
      return () => {
        task.listeners.delete(listener)
        if (!task.listeners.size) task.finish(null, 'cancelado')
      }
    },
    get size() { return tasks.size },
  }
}
