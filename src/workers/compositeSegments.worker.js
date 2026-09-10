import { buildCompositeSegments } from '../entities/waves/compositeBifoliation'

self.onmessage = (event) => {
  const { id, payload } = event.data ?? {}
  try {
    const {
      fixedState,
      params,
      view,
      samples,
      resolution,
      inflectionBranch,
      direction,
      sonicTarget,
      renderView,
    } = payload ?? {}
    const data = buildCompositeSegments(
      fixedState,
      params,
      view,
      samples,
      resolution,
      inflectionBranch,
      direction,
      sonicTarget,
      renderView,
    )
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
