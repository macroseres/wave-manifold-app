import { useEffect, useRef, useState } from 'react'
import GlobalPortraitWorker from '../workers/globalPortrait.worker?worker'

export function useGlobalPortrait(params, view, resolution, composite, enabled) {
  const key = enabled ? JSON.stringify({ params, view, resolution }) : ''
  const cache = useRef(new Map())
  const [result, setResult] = useState(null)
  useEffect(() => {
    if (!key) return undefined
    const cached = cache.current.get(key)
    if (cached && (!composite || cached.hasComposite)) { setResult({ key, ...cached, complete: true }); return undefined }
    const worker = new GlobalPortraitWorker()
    let cancelled = false
    worker.onmessage = ({ data }) => {
      if (cancelled) return
      if (data.data) {
        cache.current.set(key, data)
        if (cache.current.size > 3) cache.current.delete(cache.current.keys().next().value)
      }
      setResult({ key, ...data })
      if (data.complete || data.error) worker.terminate()
    }
    worker.onerror = () => { if (!cancelled) setResult({ key, error: 'Não foi possível calcular o retrato.' }); worker.terminate() }
    worker.postMessage({ ...JSON.parse(key), composite, previous: cached?.data })
    return () => { cancelled = true; worker.terminate() }
  }, [key, composite])
  return { data: result?.key === key ? result.data : null,
    loading: Boolean(key && (result?.key !== key || !result?.complete)), error: result?.key === key ? result.error : null }
}
