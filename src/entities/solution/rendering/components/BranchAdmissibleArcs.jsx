import { ZCompactifiedLine as Line } from '../../../../app/scene/ZCompactification'
import { FORWARD_HUGONIOT, BACKWARD_HUGONIOT } from '../../../hugoniot/directions.js'
import AdmissibleArcCurve from '../../../../components/curves/AdmissibleArcCurve.jsx'
import { CompositeSlowCurve, CompositeFastCurve } from '../../../../components/curves/CompositeCurve.jsx'
import RarefactionArcCurve from '../../../../components/curves/RarefactionArcCurve.jsx'
import { solutionArcOrientation, speedModeFromOrientation } from '../../../waves/orientation.js'
import { coordsOf, pointObjectFromCoords, initialAnchorsFromSegments, hasUsableSegments } from '../solutionModeGeometry.js'
import { solutionColors } from '../solutionColors.js'
import HoverableSolutionPoint from './HoverableSolutionPoint.jsx'

export function BranchAdmissibleArcs({
  entry,
  params,
  view,
  resolution,
  reflected = false,
  visibility = {},
  markerScale = [1, 1, 1],
  onHoverPoint = null,
  onCreateInspectionProbe = null,
  pipelineBranch = null,
}) {
  const isSlow = entry?.branch === 'slow'
  if (!entry?.state || !entry?.seed) return null

  const branchKey = reflected ? 'reflected' : entry.branch
  const branchVisibility = visibility?.[branchKey] ?? {}
  const prefix = reflected ? 'reflected' : entry.branch
  const lineWidth = 1.35

  const hugoniotDirection = isSlow ? FORWARD_HUGONIOT : BACKWARD_HUGONIOT
  const orientationBranch = isSlow ? 'slow' : 'fast'
  const primaryHOrientation = solutionArcOrientation(orientationBranch, 'hugoniot')
  const nonlocalHOrientation = pipelineBranch?.nonlocalShockArc?.orientation ?? primaryHOrientation
  const primaryROrientation = solutionArcOrientation(orientationBranch, 'rarefaction')
  const compositeOrientation = solutionArcOrientation(orientationBranch, 'composite')
  const localCompositeOrientation = pipelineBranch?.localCompositeArc?.orientation ?? compositeOrientation
  const nonlocalCompositeOrientation = pipelineBranch?.nonlocalCompositeArc?.orientation ?? compositeOrientation

  const firstChainNonlocalShockArc = pipelineBranch?.firstChainNonlocalShockArc ?? pipelineBranch?.nonlocalShockFromLocalCompositeArc ?? null
  const secondChainNonlocalShockArc = pipelineBranch?.secondChainNonlocalShockArc ?? pipelineBranch?.nonlocalShockFromNonlocalCompositeArc ?? null
  const hPlusProjectionArc = pipelineBranch?.hPlusProjectionArc ?? pipelineBranch?.secondChain?.auxiliaryShockArc ?? null
  const postCompositeHPlusArc = pipelineBranch?.postCompositeHPlusArc ?? pipelineBranch?.secondChain?.postCompositeAuxiliaryShockArc ?? null
  const showLocalShockArc = hasUsableSegments(pipelineBranch?.localShockArc?.segments)
  const showLegacyNonlocalShockArc = !hasUsableSegments(firstChainNonlocalShockArc?.segments) && !hasUsableSegments(secondChainNonlocalShockArc?.segments) && hasUsableSegments(pipelineBranch?.nonlocalShockArc?.segments)
  const showFirstChainNonlocalShockArc = hasUsableSegments(firstChainNonlocalShockArc?.segments)
  const showSecondChainNonlocalShockArc = hasUsableSegments(secondChainNonlocalShockArc?.segments)
  const showHPlusProjectionArc = hasUsableSegments(hPlusProjectionArc?.segments)
  const showPostCompositeHPlusArc = hasUsableSegments(postCompositeHPlusArc?.segments)
  const showLocalCompositeArc = hasUsableSegments(pipelineBranch?.localCompositeArc?.segments)
  // Primeira cadeia and segunda cadeia are different valid solution paths.
  const showNonlocalCompositeArc = hasUsableSegments(pipelineBranch?.nonlocalCompositeArc?.segments)

  const localCompositeVisible = branchVisibility.compositeLocal !== false
  const nonlocalCompositeVisible = branchVisibility.compositeNonlocal !== false
  const auxiliaryHPlusVisible = branchVisibility.auxiliaryHPlus !== false
  const involvedRarefactionVisible = branchVisibility.involvedRarefactionCurve !== false
  const involvedCompositeVisible = branchVisibility.involvedCompositeCurve === true
  const nonlocalCompositeSegments = pipelineBranch?.nonlocalCompositeArc?.metadata?.pairs ?? []
  const activeNonlocalCompositeSegments = nonlocalCompositeSegments.filter(({ segments }) => segments.length > 0)
  const involvedRarefactionCurveSegments = pipelineBranch?.nonlocalRarefactionArc?.metadata?.curveSegments ?? []
  // K_nl mostra somente o componente conexo da curva composta que passa pelo
  // ponto de inflexao J_nloc. Ele continua independente do arco admissivel
  // A_nloc(K), que pode ser posteriormente cortado por um evento de parada.
  const involvedCompositeCurveSegments = nonlocalCompositeSegments.flatMap((item) => item.involvedCompositeSegments ?? item.compositeCurveSegments ?? [])
  const nonlocalShockStarts = (secondChainNonlocalShockArc?.metadata?.starts ?? [])
    .concat((pipelineBranch?.nonlocalShockArc?.metadata?.anchors ?? []).map((anchor) => ({ anchor, fixedState: entry?.state })))
  const directNonlocalRarefactionSegments = pipelineBranch?.nonlocalRarefactionArc?.segments ?? []
  const nonlocalRarefactionEndPoints = directNonlocalRarefactionSegments
    .map((segment) => segment?.[segment.length - 1] ?? null)
    .filter(Boolean)
  const nonlocalRarefactionStartPoint = pipelineBranch?.nonlocalRarefactionArc?.metadata?.nonlocalRarefactionStartPoint
    ?? pipelineBranch?.nonlocalRarefactionArc?.metadata?.hPlusCsPoint
    ?? pipelineBranch?.nonlocalRarefactionArc?.anchor
    ?? null
  const nonlocalRarefactionStartCoords = coordsOf(nonlocalRarefactionStartPoint)
  const compositeStartAnchor = initialAnchorsFromSegments(pipelineBranch?.localCompositeArc?.segments ?? [])[0] ?? null
  const localCompositeStopPoint = pipelineBranch?.localCompositeArc?.metadata?.stopPoint ?? null

  const hugoniotLocalColor = reflected
    ? solutionColors.reflectedHLocal
    : isSlow ? solutionColors.slowHLocal : solutionColors.fastHLocal
  const hugoniotNonlocalColor = reflected
    ? solutionColors.reflectedHNonlocal
    : isSlow ? solutionColors.slowHNonlocal : solutionColors.fastHNonlocal
  const rarefactionLocalColor = reflected
    ? solutionColors.reflectedRLocal
    : isSlow ? solutionColors.slowRLocal : solutionColors.fastRLocal
  const rarefactionNonlocalColor = reflected
    ? solutionColors.reflectedRNonlocal
    : isSlow ? solutionColors.slowRNonlocal : solutionColors.fastRNonlocal
  const compositeColor = reflected
    ? solutionColors.reflectedK
    : isSlow ? solutionColors.slowK : solutionColors.fastK

  return (
    <group>
      <AdmissibleArcCurve
        key={`${prefix}-A-H-${entry.seed.t}-${entry.seed.z}`}
        family="hugoniot"
        fixedState={entry.state}
        direction={hugoniotDirection}
        color={hugoniotLocalColor}
        params={params}
        view={view}
        resolution={resolution}
        visible={showLocalShockArc && branchVisibility.hugoniotLocal !== false}
        lineWidth={lineWidth}
        markerBoundaryView={view}
        markerScale={markerScale}
        reflectDagger={reflected}
        admissibleOrientation={primaryHOrientation}
        anchorPoint={entry.seed}
        onCreateInspectionProbe={onCreateInspectionProbe}
        branch={entry.branch}
        arcLabel={`A_{loc}(H_${isSlow ? '-' : '+'})`}
        segmentsOverride={pipelineBranch?.localShockArc?.segments ?? []}
      />
      {(
        <AdmissibleArcCurve
          key={`${prefix}-A-H-nonlocal-from-Kloc-${entry.seed.t}-${entry.seed.z}`}
          family="hugoniot"
          fixedState={firstChainNonlocalShockArc?.state ?? entry.state}
          direction={hugoniotDirection}
          color={hugoniotNonlocalColor}
          params={params}
          view={view}
          resolution={resolution}
          visible={showFirstChainNonlocalShockArc && branchVisibility.hugoniotNonlocal !== false}
          lineWidth={1.35}
          markerBoundaryView={view}
          markerScale={markerScale}
          showStartMarker={false}
          reflectDagger={reflected}
          admissibleOrientation={firstChainNonlocalShockArc?.orientation ?? primaryHOrientation}
          anchorPoint={firstChainNonlocalShockArc?.anchor ?? entry.seed}
          onCreateInspectionProbe={onCreateInspectionProbe}
          branch={entry.branch}
          arcLabel={`Primeira cadeia: A_{nloc}(H_${isSlow ? '-' : '+'}|K_{loc})`}
          segmentsOverride={firstChainNonlocalShockArc?.segments ?? []}
        />
      )}
      {(
        <AdmissibleArcCurve
          key={`${prefix}-A-H-nonlocal-from-Knloc-${entry.seed.t}-${entry.seed.z}`}
          family="hugoniot"
          fixedState={secondChainNonlocalShockArc?.state ?? entry.state}
          direction={hugoniotDirection}
          color={hugoniotNonlocalColor}
          params={params}
          view={view}
          resolution={resolution}
          visible={showSecondChainNonlocalShockArc && branchVisibility.hugoniotNonlocal !== false}
          lineWidth={1.35}
          markerBoundaryView={view}
          markerScale={markerScale}
          showStartMarker={true}
          reflectDagger={reflected}
          admissibleOrientation={secondChainNonlocalShockArc?.orientation ?? primaryHOrientation}
          anchorPoint={secondChainNonlocalShockArc?.anchor ?? entry.seed}
          onCreateInspectionProbe={onCreateInspectionProbe}
          branch={entry.branch}
          arcLabel={`Segunda cadeia: A_{nloc}(H_${isSlow ? '-' : '+'}|K_{nloc})`}
          segmentsOverride={secondChainNonlocalShockArc?.segments ?? []}
        />
      )}
      {showHPlusProjectionArc ? (
        <group>
          {(hPlusProjectionArc?.segments ?? []).map((segment, index) => {
            const points = (segment ?? []).map(coordsOf).filter(Boolean)
            return points.length >= 2 ? (
              <Line
                key={`${prefix}-H-plus-projection-${index}`}
                points={points}
                color={hugoniotNonlocalColor}
                lineWidth={1.35}
                dashed
                dashSize={0.055}
                gapSize={0.035}
                renderOrder={16}
                visible={auxiliaryHPlusVisible}
              />
            ) : null
          })}
        </group>
      ) : null}
      {showPostCompositeHPlusArc ? (
        <group>
          {(postCompositeHPlusArc?.segments ?? []).map((segment, index) => {
            const points = (segment ?? []).map(coordsOf).filter(Boolean)
            return points.length >= 2 ? (
              <Line
                key={`${prefix}-H-plus-after-K-nonlocal-${index}`}
                points={points}
                color={hugoniotNonlocalColor}
                lineWidth={1.35}
                dashed
                dashSize={0.055}
                gapSize={0.035}
                renderOrder={17}
                visible={auxiliaryHPlusVisible}
              />
            ) : null
          })}
        </group>
      ) : null}
      <AdmissibleArcCurve
        key={`${prefix}-A-H-nonlocal-pipeline-${entry.seed.t}-${entry.seed.z}`}
        family="hugoniot"
        fixedState={entry.state}
        direction={hugoniotDirection}
        color={hugoniotNonlocalColor}
        params={params}
        view={view}
        resolution={resolution}
        visible={showLegacyNonlocalShockArc && branchVisibility.hugoniotNonlocal !== false}
        lineWidth={1.35}
        markerBoundaryView={view}
        markerScale={markerScale}
        reflectDagger={reflected}
        admissibleOrientation={nonlocalHOrientation}
        anchorPoint={pipelineBranch?.nonlocalShockArc?.anchor ?? entry.seed}
        onCreateInspectionProbe={onCreateInspectionProbe}
        branch={entry.branch}
        arcLabel={`A_{nloc}(H_${isSlow ? '-' : '+'})`}
        segmentsOverride={pipelineBranch?.nonlocalShockArc?.segments ?? []}
      />
      {involvedRarefactionCurveSegments.map((segment, index) => {
        const points = (segment ?? []).map(coordsOf).filter(Boolean)
        return points.length >= 2 ? (
          <Line
            key={`${prefix}-R-env-${index}`}
            points={points}
            color={rarefactionNonlocalColor}
            lineWidth={1.15}
            renderOrder={12}
            visible={involvedRarefactionVisible}
          />
        ) : null
      })}
      {involvedCompositeCurveSegments.map((segment, index) => {
        const points = (segment ?? []).map(coordsOf).filter(Boolean)
        return points.length >= 2 ? (
          <Line
            key={`${prefix}-K-env-${index}`}
            points={points}
            color={compositeColor}
            lineWidth={1.15}
            renderOrder={13}
            visible={involvedCompositeVisible}
          />
        ) : null
      })}
      <RarefactionArcCurve
        key={`${prefix}-A-R-primary-${entry.seed.t}-${entry.seed.z}`}
        anchorPoint={entry.seed}
        params={params}
        view={view}
        resolution={resolution}
        visible={branchVisibility.rarefactionLocal !== false}
        color={rarefactionLocalColor}
        lineWidth={lineWidth}
        markerScale={markerScale}
        endpointPoint={compositeStartAnchor}
        speedMode={speedModeFromOrientation(primaryROrientation)}
        label={`A(R_${isSlow ? '-' : '+'})`}
        reflectDagger={reflected}
        branchSide={isSlow ? 'slow' : 'fast'}
        onCreateInspectionProbe={onCreateInspectionProbe}
        segmentsOverride={pipelineBranch?.localRarefactionArc?.segments ?? []}
      />
      {directNonlocalRarefactionSegments.map((segment, index) => {
        const points = (segment ?? []).map(coordsOf).filter(Boolean)
        return points.length >= 2 ? (
          <Line
            key={`${prefix}-A-R-nonlocal-direct-${index}`}
            points={points}
            color={rarefactionNonlocalColor}
            lineWidth={1.35}
            renderOrder={17}
            visible={branchVisibility.rarefactionNonlocal !== false}
          />
        ) : null
      })}
      {nonlocalRarefactionEndPoints.map((point, index) => {
        const position = coordsOf(point)
        if (!position || branchVisibility.rarefactionNonlocal === false) return null
        return (
          <HoverableSolutionPoint
            key={`${prefix}-R-nonlocal-end-${index}`}
            point={{
              ...pointObjectFromCoords(point),
              label: isSlow ? 'J_-^{nloc}' : 'J_+^{nloc}',
              endpointLabel: isSlow ? 'J_-^{nloc}' : 'J_+^{nloc}',
              attachedCurve: `A_{nloc}(R_${isSlow ? '-' : '+'})`,
              branch: entry.branch,
            }}
            position={position}
            color={rarefactionNonlocalColor}
            markerScale={markerScale}
            renderOrder={23}
            onHoverPoint={onHoverPoint}
            onCreateInspectionProbe={onCreateInspectionProbe}
            hoverLabel="ponto final do arco de rarefação não local"
          />
        )
      })}
      {isSlow && nonlocalRarefactionStartCoords && branchVisibility.rarefactionNonlocal !== false ? (
        <HoverableSolutionPoint
          point={{
            ...pointObjectFromCoords(nonlocalRarefactionStartPoint),
            label: 'H_+ \\cap C_s',
            endpointLabel: 'H_+ \\cap C_s',
            attachedCurve: 'A_{nloc}(R_-)',
            branch: 'slow',
          }}
          position={nonlocalRarefactionStartCoords}
          color={rarefactionNonlocalColor}
          markerScale={markerScale}
          renderOrder={22}
          onHoverPoint={onHoverPoint}
          onCreateInspectionProbe={onCreateInspectionProbe}
          hoverLabel="início de R_nloc em H_+ ∩ C_s"
        >
        </HoverableSolutionPoint>
      ) : null}
      {(isSlow ? (
        <CompositeSlowCurve
          key={`${prefix}-A-K-slow-${entry.seed.t}-${entry.seed.z}`}
          fixedState={entry.seed}
          params={params}
          view={view}
          resolution={resolution}
          visible={showLocalCompositeArc && localCompositeVisible}
          color={compositeColor}
          lineWidth={1.35}
          admissibleOrientation={localCompositeOrientation}
          showOrientationMarkers={true}
          markerBoundaryView={view}
          markerScale={markerScale}
          reflectDagger={reflected}
          onCreateInspectionProbe={onCreateInspectionProbe}
          branch={entry.branch}
          label="A_{loc}(K_-)"
          stopPoint={localCompositeStopPoint}
          segmentsOverride={pipelineBranch?.localCompositeArc?.segments ?? []}
        />
      ) : (
        <CompositeFastCurve
          key={`${prefix}-A-K-fast-${entry.seed.t}-${entry.seed.z}`}
          fixedState={entry.seed}
          params={params}
          view={view}
          resolution={resolution}
          visible={showLocalCompositeArc && localCompositeVisible}
          color={compositeColor}
          lineWidth={1.35}
          admissibleOrientation={localCompositeOrientation}
          showOrientationMarkers={true}
          markerBoundaryView={view}
          markerScale={markerScale}
          reflectDagger={reflected}
          onCreateInspectionProbe={onCreateInspectionProbe}
          branch={entry.branch}
          label="A_{loc}(K_+)"
          segmentsOverride={pipelineBranch?.localCompositeArc?.segments ?? []}
        />
      ))}
      {activeNonlocalCompositeSegments.map(({ anchor, segments, stopPoint }, index) => {
        const shockStart = stopPoint ?? nonlocalShockStarts.find((item) => item.sourceAnchor === anchor)?.anchor ?? null
        return (
        isSlow ? (
          <CompositeSlowCurve
            key={`${prefix}-A-K-slow-nonlocal-${index}-${anchor.t}-${anchor.z}`}
            fixedState={anchor}
            params={params}
            view={view}
            resolution={resolution}
            visible={showNonlocalCompositeArc && nonlocalCompositeVisible}
            color={compositeColor}
            lineWidth={1.35}
            admissibleOrientation={nonlocalCompositeOrientation}
            showOrientationMarkers={true}
            markerBoundaryView={view}
            markerScale={markerScale}
            reflectDagger={reflected}
            onCreateInspectionProbe={onCreateInspectionProbe}
            branch={entry.branch}
            label="A_{nloc}(K_-)"
            stopPoint={shockStart}
            segmentsOverride={segments}
          />
        ) : (
          <CompositeFastCurve
            key={`${prefix}-A-K-fast-nonlocal-${index}-${anchor.t}-${anchor.z}`}
            fixedState={anchor}
            params={params}
            view={view}
            resolution={resolution}
            visible={showNonlocalCompositeArc && nonlocalCompositeVisible}
            color={compositeColor}
            lineWidth={1.35}
            admissibleOrientation={nonlocalCompositeOrientation}
            showOrientationMarkers={true}
            markerBoundaryView={view}
            markerScale={markerScale}
            reflectDagger={reflected}
            onCreateInspectionProbe={onCreateInspectionProbe}
            branch={entry.branch}
            label="A_{nloc}(K_+)"
            stopPoint={shockStart}
            segmentsOverride={segments}
          />
        )
        )
      })}
    </group>
  )
}
