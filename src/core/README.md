# Compatibilidade do núcleo matemático

Esta pasta mantém reexportações para imports antigos. As implementações ficam em
`src/entities/`; código novo deve importar diretamente da entidade correspondente.

Os contratos `WavePoint`, `WaveCurve`, `WaveSurface`, `WaveLeaf` e
`WaveBifoliation` ficam em `src/entities/shared/types/mathTypes.js`.
Esse módulo usa `normalizeWavePoint`, `normalizeWaveSegment`,
`normalizeWaveSegments`, `createWaveCurve`, `createWaveLeaf` e
`createWaveBifoliation`. A fachada `core/types/mathTypes.js` preserva os aliases
antigos `toVec3*` e `makeWave*`.
