import { pointObjectFromCoords, hasUsableSegments } from './solutionModeGeometry.js'



function segmentsToSnapSamples(segments, curve, reflected = false) {
  return (segments ?? []).flatMap((segment) => (
    (segment ?? [])
      .map(pointObjectFromCoords)
      .filter(Boolean)
      .map((point) => {
        const base = point.coords ?? [point.t, point.Y ?? 0, point.z]
        const coords = reflected ? [base[0], -base[1], base[2]] : base
        return { coords, curve }
      })
  ))
}

export function solutionSnapSamplesFromPipelineBranch(pipelineBranch, branch, visibility = {}, reflected = false) {
  const branchVisibility = visibility?.[reflected ? 'reflected' : branch] ?? {}
  const hSign = branch === 'slow' ? '-' : '+'
  const out = []
  const localShock = pipelineBranch?.localShockArc
  const nonlocalShock = pipelineBranch?.nonlocalShockArc
  const nonlocalShockFromLocalComposite = pipelineBranch?.firstChainNonlocalShockArc ?? pipelineBranch?.nonlocalShockFromLocalCompositeArc
  const nonlocalShockFromNonlocalComposite = pipelineBranch?.secondChainNonlocalShockArc ?? pipelineBranch?.nonlocalShockFromNonlocalCompositeArc
  const localRarefaction = pipelineBranch?.localRarefactionArc
  const nonlocalRarefaction = pipelineBranch?.nonlocalRarefactionArc
  const localComposite = pipelineBranch?.localCompositeArc
  const nonlocalComposite = pipelineBranch?.nonlocalCompositeArc
  if (branchVisibility.hugoniotLocal !== false) {
    out.push(...segmentsToSnapSamples(localShock?.segments, `A_{loc}(H_${hSign})`, reflected))
  }
  if (branchVisibility.hugoniotNonlocal !== false) {
    out.push(...segmentsToSnapSamples(nonlocalShockFromLocalComposite?.segments, `Primeira cadeia: A_{nloc}(H_${hSign}|K_{loc})`, reflected))
    out.push(...segmentsToSnapSamples(nonlocalShockFromNonlocalComposite?.segments, `Segunda cadeia: A_{nloc}(H_${hSign}|K_{nloc})`, reflected))
    if (!hasUsableSegments(nonlocalShockFromLocalComposite?.segments) && !hasUsableSegments(nonlocalShockFromNonlocalComposite?.segments)) {
      out.push(...segmentsToSnapSamples(nonlocalShock?.segments, `A_{nloc}(H_${hSign})`, reflected))
    }
  }
  if (branchVisibility.rarefactionLocal !== false) {
    out.push(...segmentsToSnapSamples(localRarefaction?.segments, `A_{loc}(R_${hSign})`, reflected))
  }
  if (branchVisibility.rarefactionNonlocal !== false) {
    out.push(...segmentsToSnapSamples(nonlocalRarefaction?.segments, `A_{nloc}(R_${hSign})`, reflected))
  }
  if (branchVisibility.composite !== false) {
    out.push(...segmentsToSnapSamples(localComposite?.segments, `Primeira cadeia: A_{loc}(K_${hSign})`, reflected))
    out.push(...segmentsToSnapSamples(nonlocalComposite?.segments, `Segunda cadeia: A_{nloc}(K_${hSign})`, reflected))
  }
  return out
}
