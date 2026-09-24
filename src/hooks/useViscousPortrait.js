import { useEffect, useMemo, useRef, useState } from 'react'
import ViscousPortraitWorker from '../workers/viscousPortrait.worker?worker'
import { retargetViscousPortrait } from '../entities/phasePortrait/viscousPortrait.js'

export function useViscousPortrait(selection, params, bounds, options, enabled) {
  // UR and display options do not change G(U). Only these primitives trigger integration.
  const key = enabled && selection ? JSON.stringify({ left: selection.left, speed: selection.speed,
    params: { a: params.a ?? 0, b1: params.b1, b2: params.b2, c: params.c },
    bounds: { uMin: bounds.uMin, uMax: bounds.uMax, vMin: bounds.vMin, vMax: bounds.vMax } }) : ''
  const cache = useRef(new Map())
  const [result, setResult] = useState(null)
  useEffect(() => {
    if (!key) { setResult(null); return undefined }
    if (cache.current.has(key)) { setResult({ key, data: cache.current.get(key) }); return undefined }
    let worker, cancelled = false
    const timer = setTimeout(() => {
      try {
        worker = new ViscousPortraitWorker()
        worker.onmessage = ({ data }) => {
          if (cancelled) return
          if (data.data) {
            cache.current.set(key, data.data)
            if (cache.current.size > 4) cache.current.delete(cache.current.keys().next().value)
          }
          setResult({ key, ...data })
          worker.terminate()
        }
        worker.onerror = () => {
          if (!cancelled) setResult({ key, error: 'Não foi possível calcular o retrato.' })
          worker.terminate()
        }
        worker.postMessage(JSON.parse(key))
      } catch (error) { if (!cancelled) setResult({ key, error: error.message }) }
    }, 90)
    return () => { cancelled = true; clearTimeout(timer); worker?.terminate() }
  }, [key])
  const data = key && result?.key === key ? result.data : null
  const portrait = useMemo(() => !enabled || !selection ? null
    : data ? retargetViscousPortrait(data, selection, options, bounds)
      : { ...selection, options, curves: [], equilibriumPoints: [], equilibriumData: [] },
  [enabled, selection, data, options, bounds])
  return { portrait, loading: Boolean(key && result?.key !== key), error: result?.key === key ? result.error : null }
}
