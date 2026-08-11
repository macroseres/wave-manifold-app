import React, { useEffect, useMemo } from 'react'
import { buildSolutionPipeline } from '../../entities/solution'
import {
  BranchAdmissibleArcs,
  SlowAdmissibleSaturations,
  FastReflectionSlowSaturationIntersectionPoint,
  solutionSnapSamplesFromPipelineBranch,
} from '../../entities/solution/rendering/SolutionBranchRender'

const emptySolutionBranch = {
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
  firstChain: null,
  secondChain: null,
  solutionChains: [],
  hPlusProjectionArc: null,
  activeRarefactionArc: null,
  activeCompositeArc: null,
  activeShockArc: null,
  activeSaturationArc: null,
  activeSolutionPieces: [],
  diagnosticPoints: [],
}

const emptySolutionPipeline = {
  slow: emptySolutionBranch,
  fast: emptySolutionBranch,
  reflected: emptySolutionBranch,
  activeSolutionPieces: [],
  diagnosticPoints: [],
}

function SolutionModeCurves({
  enabled = false,
  entries = [],
  params,
  view,
  resolution = 40,
  visibility = {},
  markerScale = [1, 1, 1],
  onHoverPoint = null,
  onCreateInspectionProbe = null,
  onSolutionSnapSamples = null,
  onSolutionDiagnostics = null,
}) {
  const slowEntry = entries.find((entry) => entry.branch === 'slow') ?? null
  const fastEntry = entries.find((entry) => entry.branch === 'fast') ?? null
  const solutionPipeline = useMemo(() => {
    if (!enabled) return emptySolutionPipeline
    return buildSolutionPipeline({
      entries,
      params,
      view,
      resolution,
    })
  }, [enabled, entries, params, view, resolution])

  const solutionSnapSamples = useMemo(() => {
    return {
      slow: solutionSnapSamplesFromPipelineBranch(solutionPipeline.slow, 'slow', visibility, false),
      fast: [
        ...solutionSnapSamplesFromPipelineBranch(solutionPipeline.fast, 'fast', visibility, false),
        ...solutionSnapSamplesFromPipelineBranch(solutionPipeline.reflected, 'fast', visibility, true),
      ],
    }
  }, [solutionPipeline, visibility])

  useEffect(() => {
    onSolutionSnapSamples?.(solutionSnapSamples)
    return () => onSolutionSnapSamples?.({ slow: [], fast: [] })
  }, [solutionSnapSamples, onSolutionSnapSamples])

  useEffect(() => {
    onSolutionDiagnostics?.(solutionPipeline.diagnosticPoints ?? [])
    return () => onSolutionDiagnostics?.([])
  }, [solutionPipeline, onSolutionDiagnostics])

  if (!enabled) return null

  return (
    <group renderOrder={18}>
      <BranchAdmissibleArcs
        entry={slowEntry}
        params={params}
        view={view}
        resolution={resolution}
        visibility={visibility}
        markerScale={markerScale}
        onHoverPoint={onHoverPoint}
        onCreateInspectionProbe={onCreateInspectionProbe}
        pipelineBranch={solutionPipeline.slow}
      />
      <SlowAdmissibleSaturations
        entry={slowEntry}
        params={params}
        view={view}
        resolution={resolution}
        visibility={visibility}
        pipelineBranch={solutionPipeline.slow}
      />
      <FastReflectionSlowSaturationIntersectionPoint
        slowEntry={slowEntry}
        fastEntry={fastEntry}
        params={params}
        view={view}
        resolution={resolution}
        markerScale={markerScale}
        visibility={visibility}
        onHoverPoint={onHoverPoint}
        onCreateInspectionProbe={onCreateInspectionProbe}
        solutionPipeline={solutionPipeline}
      />
      <BranchAdmissibleArcs
        entry={fastEntry}
        params={params}
        view={view}
        resolution={resolution}
        visibility={visibility}
        markerScale={markerScale}
        onHoverPoint={onHoverPoint}
        onCreateInspectionProbe={onCreateInspectionProbe}
        pipelineBranch={solutionPipeline.fast}
      />
      {fastEntry ? (
          <BranchAdmissibleArcs
            entry={fastEntry}
            params={params}
            view={view}
            resolution={resolution}
            reflected={true}
            visibility={visibility}
            markerScale={markerScale}
            onHoverPoint={onHoverPoint}
            onCreateInspectionProbe={onCreateInspectionProbe}
            pipelineBranch={solutionPipeline.reflected}
          />
      ) : null}
    </group>
  )
}

export default React.memo(SolutionModeCurves)
