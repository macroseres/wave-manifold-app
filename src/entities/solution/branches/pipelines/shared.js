import { solutionArcOrientation } from '../../../waves/orientation.js'

export const SOLUTION_ARC_LOCAL = 'local'
export const SOLUTION_ARC_NONLOCAL = 'nonlocal'

export const SLOW_H_ORIENTATION = solutionArcOrientation('slow', 'hugoniot')
export const SLOW_R_ORIENTATION = solutionArcOrientation('slow', 'rarefaction')
export const SLOW_K_ORIENTATION = solutionArcOrientation('slow', 'composite')
export const FAST_H_ORIENTATION = solutionArcOrientation('fast', 'hugoniot')
export const FAST_R_ORIENTATION = solutionArcOrientation('fast', 'rarefaction')
export const FAST_K_ORIENTATION = solutionArcOrientation('fast', 'composite')

export function buildEmptyBranchPipeline(branch) {
  return {
    branch,
    localRarefactionArc: null,
    localCompositeArc: null,
    localShockArc: null,
    nonlocalRarefactionArc: null,
    nonlocalCompositeArc: null,
    nonlocalShockArc: null,
    nonlocalShockFromLocalCompositeArc: null,
    nonlocalShockFromNonlocalCompositeArc: null,
    firstChainNonlocalShockArc: null,
    secondChainNonlocalShockArc: null,
    postCompositeHPlusArc: null,
    firstChain: null,
    secondChain: null,
    solutionChains: [],
    activeCompositeArc: null,
    activeShockArc: null,
    activeSaturationArc: null,
    activeSolutionPieces: [],
    diagnosticPoints: [],
  }
}

export function diagnosticsFromPieces(pieces) {
  return pieces.filter(Boolean).map((piece) => piece.diagnostics)
}
