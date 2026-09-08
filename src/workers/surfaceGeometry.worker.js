import { generateSurfaceBuffers } from '../geometry/surfaceGeneration.js'

self.onmessage = ({ data: payload }) => {
  try {
    const data = generateSurfaceBuffers(payload)
    const transfer = Object.values(data).flatMap(item => [item.position.buffer, item.normal.buffer, item.index.buffer])
    self.postMessage({ ok: true, data }, transfer)
  } catch (error) {
    self.postMessage({ ok: false, error: error?.message ?? String(error) })
  }
}
