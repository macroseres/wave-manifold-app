import { buildRarefactionSegmentsData } from '../entities/waves/rarefactionSegmentsData'

self.onmessage = (event) => {
  const { id, payload } = event.data ?? {}
  try {
    const data = buildRarefactionSegmentsData(payload)
    self.postMessage({ id, ok: true, data })
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error?.message ?? String(error),
      stack: error?.stack ?? '',
    })
  }
}
