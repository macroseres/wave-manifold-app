import { BACKWARD_HUGONIOT } from '../hugoniot/directions.js'
import { findHugoniotSonicAnchors } from './internal/pipelineGeometry.js'
import { buildSlowPipeline, buildFastPipeline, SOLUTION_ARC_LOCAL, SOLUTION_ARC_NONLOCAL } from './branches/branchPipelines.js'

export { SOLUTION_ARC_LOCAL, SOLUTION_ARC_NONLOCAL }

export function buildSolutionPipeline({ entries = [], params, view, resolution = 40 }) {
  const slowEntry = entries.find((entry) => entry.branch === 'slow') ?? null
  const fastEntry = entries.find((entry) => entry.branch === 'fast') ?? null
  const fastSonicRarefactionAnchors = findHugoniotSonicAnchors({
    entry: fastEntry,
    params,
    view,
    resolution,
    direction: BACKWARD_HUGONIOT,
    sonicTarget: 'right',
  })
  const slow = buildSlowPipeline({ entry: slowEntry, params, view, resolution })
  const fast = buildFastPipeline({ entry: fastEntry, sonicRarefactionAnchors: fastSonicRarefactionAnchors, params, view, resolution })
  const reflected = buildFastPipeline({ entry: fastEntry, sonicRarefactionAnchors: fastSonicRarefactionAnchors, params, view, resolution, reflected: true })
  const activeSolutionPieces = [
    ...slow.activeSolutionPieces,
    ...fast.activeSolutionPieces,
    ...reflected.activeSolutionPieces,
  ]
  return {
    slow,
    fast,
    reflected,
    activeSolutionPieces,
    diagnosticPoints: [
      ...slow.diagnosticPoints,
      ...fast.diagnosticPoints,
      ...reflected.diagnosticPoints,
    ],
  }
}
