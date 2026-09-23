import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'

// Cache immutable CPU buffers, never shared GPU resources. Bound both bytes and
// entry count so toggling surfaces is cheap without retaining every parameter set.
const cache = new Map()
const MAX_BYTES = 24 * 1024 * 1024
let cacheBytes = 0
function remember(key, data) {
  const bytes = Object.values(data).reduce((sum, item) => sum + item.position.byteLength + item.normal.byteLength + item.index.byteLength, 0)
  if (bytes > MAX_BYTES) return
  if (cache.has(key)) cacheBytes -= cache.get(key).bytes
  cache.delete(key)
  cache.set(key, { data, bytes })
  cacheBytes += bytes
  while (cacheBytes > MAX_BYTES || cache.size > 6) {
    const oldest = cache.keys().next().value
    cacheBytes -= cache.get(oldest).bytes
    cache.delete(oldest)
  }
}

export function useSurfaceGeometry(type, params, view, resolution, visible = true, direction = 'minus') {
  const key = JSON.stringify({ type, params, view, resolution, direction })
  const [result, setResult] = useState(null)
  useEffect(() => {
    if (!visible) return undefined
    const entry = cache.get(key)
    if (entry) {
      cache.delete(key); cache.set(key, entry)
      setResult({ key, data: entry.data })
      return undefined
    }
    let cancelled = false
    const worker = new Worker(new URL('../workers/surfaceGeometry.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data: message }) => {
      if (cancelled) return
      if (message.ok) {
        remember(key, message.data)
        setResult({ key, data: message.data })
      } else {
        console.error('Surface generation failed:', message.error)
      }
      worker.terminate()
    }
    worker.onerror = (error) => {
      if (!cancelled) console.error('Surface worker failed:', error.message)
      worker.terminate()
    }
    worker.postMessage(JSON.parse(key))
    // Parameter changes, hiding and unmounting cancel obsolete work immediately.
    return () => { cancelled = true; worker.terminate() }
  }, [key, visible])

  const geometries = useMemo(() => {
    if (!visible || result?.key !== key) return null
    return Object.fromEntries(Object.entries(result.data).map(([name, data]) => {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(data.position, 3))
      geometry.setAttribute('normal', new THREE.BufferAttribute(data.normal, 3))
      geometry.setIndex(new THREE.BufferAttribute(data.index, 1))
      geometry.userData.zCompactified = true
      return [name, geometry]
    }))
  }, [key, result, visible])
  useEffect(() => () => {
    if (geometries) Object.values(geometries).forEach(geometry => geometry.dispose())
  }, [geometries])
  return geometries
}
