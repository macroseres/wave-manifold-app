const workerFactoryIds = new WeakMap()
let nextWorkerFactoryId = 0

// Function identity survives renaming and distinguishes factories with equal names.
export function createWorkerTaskKey(createWorker, payload) {
  if (!workerFactoryIds.has(createWorker)) {
    workerFactoryIds.set(createWorker, ++nextWorkerFactoryId)
  }
  const serializedPayload = JSON.stringify(payload, (_key, value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]]))
  })
  return `${workerFactoryIds.get(createWorker)}:${serializedPayload}`
}
