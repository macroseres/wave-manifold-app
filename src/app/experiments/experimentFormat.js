export const EXPERIMENT_FORMAT = 'wave-manifold-experiment'
export const SCHEMA_VERSION = 1
const persistent = new Set(['params', 'view', 'resolution', 'opacity', 'yScale', 'tauScale', 'zScale',
  'selectedByBranch', 'activeBranch', 'activeView', 'autoRotate3D', 'inspectionModeEnabled',
  'solutionModeEnabled', 'inspectionProbesByBranch', 'inspectionCurveVisibility', 'solutionCurveVisibility', 'portraitSettings', 'selectedCaseKey'])
export const isExperimentKey = key => persistent.has(key) || /^show[A-Z]/.test(key)

export function experimentSnapshot(state) {
  return structuredClone(Object.fromEntries(Object.entries(state).filter(([key]) => isExperimentKey(key))))
}

function validShape(value, sample) {
  if (typeof sample === 'number') return Number.isFinite(value)
  if (typeof sample === 'boolean' || typeof sample === 'string') return typeof value === typeof sample
  if (sample === null) return value === null || typeof value === 'string' || (value && typeof value === 'object')
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(sample).every(key => validShape(value[key], sample[key]))
}

export function validateSnapshot(input, defaults) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Configuração de experimento inválida.')
  const base = experimentSnapshot(defaults)
  for (const key of Object.keys(base)) {
    if (!(key in input)) continue
    if (!validShape(input[key], base[key])) throw new Error(`Valor inválido: ${key}.`)
    base[key] = structuredClone(input[key])
  }
  if (!['3d', 'state', 'solution', 'params'].includes(base.activeView)) throw new Error('Vista inválida.')
  if (![null, 'slow', 'fast'].includes(base.activeBranch)) throw new Error('Família inválida.')
  if (!['iv', 'ia', 'ib', 'ic', 'iia', 'iib', 'iic', 'iiia', 'iiib', 'iiic'].includes(base.selectedCaseKey)) throw new Error('Caso inválido.')
  if (!Number.isInteger(base.resolution) || base.resolution < 8 || base.resolution > 128) throw new Error('Resolução fora do intervalo 8–128.')
  if (base.opacity < 0 || base.opacity > 1) throw new Error('Opacidade inválida.')
  for (const key of ['yScale', 'tauScale', 'zScale']) {
    if (base[key] <= 0 || base[key] > 100) throw new Error('Escala inválida.')
  }
  for (const axis of ['t', 'y', 'z']) {
    if (base.view[`${axis}Min`] >= base.view[`${axis}Max`]) throw new Error('Limites da janela inválidos.')
  }
  for (const field of ['selectedByBranch', 'inspectionProbesByBranch']) {
    for (const branch of ['slow', 'fast']) {
      const point = base[field][branch]
      if (point === null) continue
      if (!point || !Number.isFinite(point.t) || !Number.isFinite(point.z)
        || (field === 'selectedByBranch' && (branch === 'slow' ? point.t <= 0 : point.t >= 0))) throw new Error(`Ponto inválido da família ${branch}.`)
      if (point.Y !== undefined && !Number.isFinite(point.Y)) throw new Error('Amplitude inválida da sonda.')
      base[field][branch] = { t: point.t, z: point.z, Y: field === 'selectedByBranch' ? 0 : point.Y ?? 0, branch }
      if (field === 'inspectionProbesByBranch') {
        if (point.attachedCurve !== undefined && point.attachedCurve !== null && typeof point.attachedCurve !== 'string') throw new Error('Vínculo inválido da sonda.')
        Object.assign(base[field][branch], { attachedCurve: point.attachedCurve ?? null,
          mode: point.attachedCurve ? 'solution-arc' : 'characteristic', isInspectionProbe: true })
      }
    }
  }
  return base
}

export function createExperiment(state, camera, appVersion, name = 'Experimento') {
  return { format: EXPERIMENT_FORMAT, schemaVersion: SCHEMA_VERSION, appVersion,
    name: name.trim().slice(0, 100) || 'Experimento', savedAt: new Date().toISOString(),
    state: experimentSnapshot(state), camera: camera ?? null }
}

export function readExperiment(text, defaults) {
  if (text.length > 1024 * 1024) throw new Error('O arquivo ultrapassa 1 MB.')
  const data = JSON.parse(text)
  if (data?.format !== EXPERIMENT_FORMAT || data.schemaVersion !== SCHEMA_VERSION) throw new Error('Formato ou versão de experimento não suportado.')
  const state = validateSnapshot(data.state, defaults)
  if (data.camera !== null && data.camera !== undefined) {
    for (const key of ['position', 'target', 'up', 'rotation']) {
      if (!Array.isArray(data.camera[key]) || data.camera[key].length !== 3
        || !data.camera[key].every(Number.isFinite)) throw new Error('Câmera inválida.')
    }
    if (Math.hypot(...data.camera.up) < 1e-8 || Math.hypot(...data.camera.position.map((x, i) => x - data.camera.target[i])) < 1e-8) throw new Error('Câmera degenerada.')
  }
  return { ...data, state }
}
