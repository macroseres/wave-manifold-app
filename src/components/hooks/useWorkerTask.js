import { useEffect, useMemo, useRef, useState } from 'react'

function stableStringify(value) {
  return JSON.stringify(value, (_key, inner) => {
    if (!inner || typeof inner !== 'object' || Array.isArray(inner)) return inner
    return Object.keys(inner).sort().reduce((acc, key) => {
      acc[key] = inner[key]
      return acc
    }, {})
  })
}

const GLOBAL_CACHE_LIMIT = 32
const globalCache = new Map()
const pendingTasks = new Map()

function remember(key, data) {
  globalCache.set(key, data)
  if (globalCache.size > GLOBAL_CACHE_LIMIT) {
    const oldest = globalCache.keys().next().value
    globalCache.delete(oldest)
  }
}

function workerNamespace(createWorker) {
  return createWorker?.name || 'worker'
}

export function useWorkerTask(createWorker, payload, enabled = true) {
  const [state, setState] = useState({ data: null, loading: false, error: null })
  const requestIdRef = useRef(0)
  const key = useMemo(() => {
    if (!enabled) return ''
    return `${workerNamespace(createWorker)}:${stableStringify(payload)}`
  }, [createWorker, payload, enabled])

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null })
      return undefined
    }

    if (globalCache.has(key)) {
      setState({ data: globalCache.get(key), loading: false, error: null })
      return undefined
    }

    let cancelled = false
    const id = requestIdRef.current + 1
    requestIdRef.current = id
    setState((previous) => ({ data: previous.data, loading: true, error: null }))

    const existing = pendingTasks.get(key)
    if (existing) {
      const listener = (result) => {
        if (cancelled) return
        if (result.ok) {
          setState({ data: result.data, loading: false, error: null })
        } else {
          setState({ data: null, loading: false, error: result.error ?? 'Worker error' })
        }
      }
      existing.listeners.add(listener)
      return () => {
        cancelled = true
        existing.listeners.delete(listener)
      }
    }

    const worker = createWorker()
    const listeners = new Set()
    pendingTasks.set(key, { worker, listeners })

    const finish = (result) => {
      const pending = pendingTasks.get(key)
      pendingTasks.delete(key)

      if (result.ok) remember(key, result.data)

      if (!cancelled) {
        if (result.ok) {
          setState({ data: result.data, loading: false, error: null })
        } else {
          setState({ data: null, loading: false, error: result.error ?? 'Worker error' })
        }
      }

      pending?.listeners.forEach((listener) => listener(result))
      worker.terminate()
    }

    worker.onmessage = (event) => {
      const message = event.data ?? {}
      if (message.id !== id) return
      if (message.ok) {
        finish({ ok: true, data: message.data })
      } else {
        console.error('Worker task failed:', message.error, message.stack)
        finish({ ok: false, error: message.error ?? 'Worker error' })
      }
    }

    worker.onerror = (error) => {
      console.error('Worker task crashed:', error)
      finish({ ok: false, error: error?.message ?? 'Worker crashed' })
    }

    worker.postMessage({ id, payload })

    return () => {
      cancelled = true
    }
  }, [createWorker, enabled, key, payload])

  return state
}
