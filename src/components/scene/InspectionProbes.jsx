import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  POINT_RADIUS,
  HOVER_RING_RADIUS,
  HOVER_RING_TUBE,
  PROBE_HOVER_RING_COLOR,
  DRAG_TOLERANCE,
  branchColor,
  coordsOf,
  drawIntersectionMarkers,
  drawSegments,
  finite,
  flattenSegments,
  hoverColor,
  intersectionMarkerPoints,
  localFromPlaneEvent,
  nearestCurvePointFromRay,
  sampleComposite,
  sampleHugoniot,
  sampleInflection,
  sampleRarefaction,
  PROBE_Z_EXTENSION_MARGIN,
  withStates,
} from '../../entities/inspection/probeHelpers.jsx'
import { waveColors } from '../../config/waveColors'
import { FORWARD_HUGONIOT, BACKWARD_HUGONIOT } from '../../entities/hugoniot/directions'
import { physicalPointToVisual, physicalZToVisual } from '../../geometry/zCompactification'

function InspectionProbes({
  enabled,
  pointsByBranch,
  basePointsByBranch = null,
  setPointsByBranch,
  params,
  view,
  resolution = 40,
  markerScale = [1, 1, 1],
  sceneScale = [1, 1, 1],
  onDragChange,
  onHoverPoint,
  visibleCurves = null,
  solutionArcSamplesByBranch = null,
  freezeComputation = false,
  hoverDisabled = false,
}) {
  const rootRef = useRef(null)
  const dragRef = useRef(null)
  const suppressHoverRef = useRef(false)
  const markerRefs = useRef(new Map())
  const lastDragPointRef = useRef(null)
  const lastCurveDataRef = useRef({})
  const [hovered, setHovered] = useState(null)
  const samples = Math.max(220, Math.min(520, resolution * 7))

  const curveData = useMemo(() => {
    if (freezeComputation && lastCurveDataRef.current) {
      return lastCurveDataRef.current
    }

    const result = {}
    for (const branch of ['slow', 'fast']) {
      const point = pointsByBranch?.[branch]
      if (!enabled || !point) continue

      // H_- e H_+ passam pela sonda clicada.
      // Se a sonda já está presa em uma das Hugoniot globais, reaproveitamos
      // essa família já desenhada pelo ponto base C_s/C_f e desenhamos apenas
      // a Hugoniot oposta passando pela sonda.
      const pointWithStates = withStates(point, params)
      const attachedCurve = point.attachedCurve ?? null
      const skipMinusAtProbe = attachedCurve === 'H_-'
      const skipPlusAtProbe = attachedCurve === 'H_+'
      const minusSegments = skipMinusAtProbe
        ? []
        : sampleHugoniot({ point: pointWithStates, params, view, direction: FORWARD_HUGONIOT, samples, zExtensionMargin: PROBE_Z_EXTENSION_MARGIN })
      const plusSegments = skipPlusAtProbe
        ? []
        : sampleHugoniot({ point: pointWithStates, params, view, direction: BACKWARD_HUGONIOT, samples, zExtensionMargin: PROBE_Z_EXTENSION_MARGIN })

      // Para Ctrl+arrastar, o encaixe é feito somente em curvas 1D
      // globais/visíveis, construídas pelos pontos base bloqueados C_s/C_f.
      // A sonda não pode ficar presa nas curvas auxiliares que ela mesma gera.
      const branchVisibility = visibleCurves?.[branch] ?? {}
      const snapHugoniotVisible = branchVisibility.hugoniot !== false
      const hugoniotMinusVisible = branchVisibility.hugoniotMinus !== false
      const hugoniotPlusVisible = branchVisibility.hugoniotPlus !== false
      const rarefactionVisible = branchVisibility.rarefactionProbe !== false
      const snapRarefactionVisible = branchVisibility.rarefaction !== false
      const compositeVisible = branchVisibility.composite !== false
      const inflectionVisible = branchVisibility.inflection !== false

      // Regra de inspeção:
      // - se a sonda está fora da característica, ela só desenha H_- e H_+;
      // - se a sonda está na característica, desenha H_-, H_+ e a característica
      //   (rarefação) correspondente passando pela sonda;
      // - composta/inflexão da própria sonda não são desenhadas nem calculadas.
      const shouldDrawProbeRarefaction = point.mode === 'characteristic' || !point.attachedCurve || point.attachedCurve === 'J'
      const rarefactionSegments = rarefactionVisible && shouldDrawProbeRarefaction
        ? sampleRarefaction({ point: pointWithStates, params, view, branch, samples: Math.max(260, Math.min(720, resolution * 8)), zExtensionMargin: PROBE_Z_EXTENSION_MARGIN })
        : []
      const inflectionSegments = inflectionVisible
        ? sampleInflection({ params, view, branch, samples: Math.max(900, Math.min(1800, resolution * 24)) })
        : []

      const basePoint = basePointsByBranch?.[branch]
      const basePointWithStates = basePoint ? withStates(basePoint, params) : null
      const baseMinusSegments = basePointWithStates
        ? sampleHugoniot({ point: basePointWithStates, params, view, direction: FORWARD_HUGONIOT, samples })
        : []
      const basePlusSegments = basePointWithStates
        ? sampleHugoniot({ point: basePointWithStates, params, view, direction: BACKWARD_HUGONIOT, samples })
        : []
      const snapHugoniotMinusSegments = baseMinusSegments
      const snapHugoniotPlusSegments = basePlusSegments
      const snapRarefactionSegments = basePointWithStates && snapRarefactionVisible
        ? sampleRarefaction({ point: basePointWithStates, params, view, branch, samples: Math.max(260, Math.min(720, resolution * 8)) })
        : []
      const snapCompositeSegments = basePointWithStates && compositeVisible
        ? sampleComposite({ point: basePointWithStates, params, view, branch, samples: Math.max(260, Math.min(720, resolution * 8)), resolution })
        : []

      const intersectionMarkers = intersectionMarkerPoints({
        point,
        basePoint,
        branch,
        minusSegments,
        plusSegments,
        baseMinusSegments,
        basePlusSegments,
        rarefactionSegments: snapRarefactionSegments,
        compositeSegments: snapCompositeSegments,
        sceneScale,
      })

      const solutionArcSamples = (solutionArcSamplesByBranch?.[branch] ?? [])
        .filter((sample) => coordsOf(sample)?.every(finite))
      const snapSamples = [
        // Ctrl+arrastar deve prender a sonda nas curvas globais visíveis
        // do modo inspeção e também nos arcos admissíveis já desenhados
        // pelo modo solução quando os dois modos estão ativos juntos.
        ...(snapHugoniotVisible && hugoniotMinusVisible ? flattenSegments(snapHugoniotMinusSegments).map((coords) => ({ coords, curve: 'H_-' })) : []),
        ...(snapHugoniotVisible && hugoniotPlusVisible ? flattenSegments(snapHugoniotPlusSegments).map((coords) => ({ coords, curve: 'H_+' })) : []),
        ...(snapRarefactionVisible ? flattenSegments(snapRarefactionSegments).map((coords) => ({ coords, curve: 'R' })) : []),
        ...(compositeVisible ? flattenSegments(snapCompositeSegments).map((coords) => ({ coords, curve: 'K' })) : []),
        ...(inflectionVisible ? flattenSegments(inflectionSegments).map((coords) => ({ coords, curve: 'J' })) : []),
        ...solutionArcSamples,
      ]

      result[branch] = {
        minusSegments: hugoniotMinusVisible ? minusSegments : [],
        plusSegments: hugoniotPlusVisible ? plusSegments : [],
        rarefactionSegments,
        inflectionSegments,
        intersectionMarkers,
        samples: snapSamples,
      }
    }
    lastCurveDataRef.current = result
    return result
  }, [enabled, pointsByBranch, basePointsByBranch, params, view, samples, resolution, visibleCurves, solutionArcSamplesByBranch, freezeComputation, sceneScale])

  useEffect(() => () => {
    const frameId = dragRef.current?.frameId
    if (frameId) cancelAnimationFrame(frameId)
    onDragChange?.(false)
  }, [onDragChange])

  if (!enabled) return null

  const applyMarkerPosition = (point) => {
    if (!point?.branch) return
    const marker = markerRefs.current.get(point.branch)
    if (marker) marker.position.set(point.t, point.Y ?? 0, physicalZToVisual(point.z))
  }

  const scheduleMarkerPreview = (point) => {
    const drag = dragRef.current
    if (!drag) return
    lastDragPointRef.current = point
    if (drag.frameId) return
    drag.frameId = requestAnimationFrame(() => {
      drag.frameId = null
      applyMarkerPosition(lastDragPointRef.current)
    })
  }

  const flushMarkerPreview = () => {
    const drag = dragRef.current
    if (!drag?.frameId) return
    cancelAnimationFrame(drag.frameId)
    drag.frameId = null
    applyMarkerPosition(lastDragPointRef.current)
  }

  const commitPoint = (branch, next) => {
    if (!next) return
    setPointsByBranch((prev) => {
      const current = prev?.[branch]
      if (!current) return prev
      return { ...prev, [branch]: { ...current, ...next, branch } }
    })
  }

  const handlePointerDown = (point) => (event) => {
    const native = event.nativeEvent ?? event
    if ((native.button ?? event.button) !== 0) return
    suppressHoverRef.current = true
    setHovered(null)
    onHoverPoint?.(null)
    onDragChange?.(true)
    event.stopPropagation()
    event.preventDefault?.()
    native.stopPropagation?.()
    native.stopImmediatePropagation?.()
    dragRef.current = {
      branch: point.branch,
      startX: native.clientX,
      startY: native.clientY,
      dragging: false,
      frameId: null,
      ctrlKeyStart: Boolean(native.ctrlKey || event.ctrlKey),
    }
    lastDragPointRef.current = { ...point }
    event.target?.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (point) => (event) => {
    const drag = dragRef.current
    if (!drag || drag.branch !== point.branch) return
    const native = event.nativeEvent ?? event
    const dx = native.clientX - drag.startX
    const dy = native.clientY - drag.startY
    if (!drag.dragging && Math.hypot(dx, dy) <= DRAG_TOLERANCE) {
      event.stopPropagation()
      event.preventDefault?.()
      native.stopPropagation?.()
      native.stopImmediatePropagation?.()
      return
    }
    drag.dragging = true
    event.stopPropagation()
    event.preventDefault?.()
    native.stopPropagation?.()
    native.stopImmediatePropagation?.()

    const branch = drag.branch
    const ctrlDrag = Boolean(native.ctrlKey || event.ctrlKey || drag.ctrlKeyStart)
    const next = ctrlDrag
      ? nearestCurvePointFromRay({ event, root: rootRef.current, curveSamples: curveData?.[branch]?.samples, branch })
      : localFromPlaneEvent(event, rootRef.current, branch, view)
    if (!next) return
    scheduleMarkerPreview(withStates(next, params))
  }

  const handlePointerUp = (event) => {
    const drag = dragRef.current
    if (!drag) return
    const native = event.nativeEvent ?? event
    event.stopPropagation()
    event.preventDefault?.()
    native.stopPropagation?.()
    native.stopImmediatePropagation?.()
    flushMarkerPreview()
    event.target?.releasePointerCapture?.(event.pointerId)
    const finalPoint = lastDragPointRef.current
    dragRef.current = null
    lastDragPointRef.current = null
    suppressHoverRef.current = false
    if (drag.dragging && finalPoint) commitPoint(drag.branch, finalPoint)
    onDragChange?.(false)
  }

  return (
    <group ref={rootRef}>
      {Object.entries(pointsByBranch ?? {}).map(([branch, point]) => {
        if (!point) return null
        const branchCurves = curveData?.[branch] ?? {}
        return (
          <group key={`inspection-probe-${branch}`}>
            {drawSegments(branchCurves.minusSegments, waveColors.hugoniotMinus, `inspection-${branch}-hminus`, 1.35, true)}
            {drawSegments(branchCurves.plusSegments, waveColors.hugoniotPlus, `inspection-${branch}-hplus`, 1.35, true)}
            {point.mode === 'characteristic' || !point.attachedCurve
              ? drawSegments(branchCurves.rarefactionSegments, branchColor(branch), `inspection-${branch}-characteristic`, 1.35, true)
              : null}
            {drawIntersectionMarkers(branchCurves.intersectionMarkers, branchColor(branch), `inspection-${branch}-intersections`, markerScale, onHoverPoint, branch, hoverDisabled || suppressHoverRef.current || !!dragRef.current)}
            <group
              ref={(node) => {
                if (node) markerRefs.current.set(branch, node)
                else markerRefs.current.delete(branch)
              }}
              position={physicalPointToVisual([point.t, point.Y ?? 0, point.z])}
              scale={markerScale}
              renderOrder={22}
              onPointerDown={handlePointerDown(point)}
              onPointerMove={handlePointerMove(point)}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerOver={(event) => {
                event.stopPropagation()
                if (hoverDisabled || suppressHoverRef.current || dragRef.current) return
                setHovered(branch)
                onHoverPoint?.({ ...point, hoverLabel: branch === 'fast' ? 'sonda rápida' : 'sonda lenta' })
              }}
              onPointerOut={(event) => {
                event.stopPropagation()
                setHovered((current) => current === branch ? null : current)
                if (!hoverDisabled && !suppressHoverRef.current && !dragRef.current) onHoverPoint?.(null)
              }}
            >
              <mesh scale={hovered === branch ? 1.42 : 1}>
                <sphereGeometry args={[POINT_RADIUS, 28, 28]} />
                <meshStandardMaterial
                  color={hovered === branch ? hoverColor(branchColor(branch)).lerp(new THREE.Color(PROBE_HOVER_RING_COLOR), 0.18) : branchColor(branch)}
                  emissive={hovered === branch ? hoverColor(branchColor(branch)).lerp(new THREE.Color(PROBE_HOVER_RING_COLOR), 0.18) : new THREE.Color(branchColor(branch))}
                  emissiveIntensity={hovered === branch ? 1.05 : 0.48}
                  roughness={0.32}
                />
              </mesh>
              {hovered === branch ? (
                <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={25}>
                  <torusGeometry args={[HOVER_RING_RADIUS * 1.08, HOVER_RING_TUBE * 1.25, 12, 64]} />
                  <meshStandardMaterial
                    color={PROBE_HOVER_RING_COLOR}
                    emissive={PROBE_HOVER_RING_COLOR}
                    emissiveIntensity={1.2}
                    transparent
                    opacity={0.9}
                    depthTest={false}
                  />
                </mesh>
              ) : null}
            </group>
          </group>
        )
      })}
    </group>
  )
}

export default React.memo(InspectionProbes)
