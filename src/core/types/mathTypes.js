// Compatibility facade. Domain implementation lives in entities/.
export * from '../../entities/shared/types/mathTypes.js'
// Legacy entry point; new code uses the domain names directly.
export {
  normalizeWavePoint as toVec3,
  normalizeWaveSegment as toVec3Segment,
  normalizeWaveSegments as toVec3Segments,
  createWaveCurve as makeWaveCurve,
  createWaveLeaf as makeWaveLeaf,
  createWaveBifoliation as makeWaveBifoliation,
} from '../../entities/shared/types/mathTypes.js'
