import { useCallback, useMemo } from 'react'

import { computeStateFromCharacteristicPoint, waveSpeed } from '../../entities/characteristic/equations'
import {
  BACKWARD_HUGONIOT,
  computeHugoniotIntersections,
  FORWARD_HUGONIOT,
} from '../../entities/hugoniot/equations'
import { computeWavePointDiagnostics } from '../../entities/shared/diagnostics/wavePointDiagnostics'
import { waveColors } from '../../config/waveColors'

const CHARACTERISTIC_BRANCHES = ['slow', 'fast']

function inferCharacteristicBranch(point) {
  return point?.branch ?? (point?.t < 0 ? 'fast' : point?.t > 0 ? 'slow' : 'neutral')
}

function branchLabels(branch, direction) {
  return {
    kind: branch === 'fast' ? 'C^f' : branch === 'slow' ? 'C^s' : 'C',
    branchLabel: branch === 'fast' ? 'característica rápida' : branch === 'slow' ? 'característica lenta' : 'característica',
    waveLabel: direction === BACKWARD_HUGONIOT ? 'H_+' : 'H_-',
  }
}

export function buildSelectionEntries(sourceByBranch, params, calcView, includeIntersections = true) {
  return CHARACTERISTIC_BRANCHES
    .map((branch) => {
      const point = sourceByBranch?.[branch]
      if (!point) return null

      const state = computeStateFromCharacteristicPoint(point.t, point.z, params)
      const direction = branch === 'fast' ? BACKWARD_HUGONIOT : FORWARD_HUGONIOT
      const fixedState = direction === BACKWARD_HUGONIOT
        ? { t: state?.t, Y: state?.Y, z: state?.z, uPlus: state?.uMinus, vPlus: state?.vMinus }
        : state
      const seed = {
        ...point,
        ...branchLabels(point.branch, direction),
        uMinus: state?.uMinus,
        vMinus: state?.vMinus,
        uPlus: state?.uMinus,
        vPlus: state?.vMinus,
        visibleInWindow: true,
        isClicked: true,
      }

      return {
        branch,
        direction,
        point,
        state: fixedState,
        selectedState: state,
        seed,
        color: branch === 'fast' ? waveColors.characteristicFast : waveColors.characteristicSlow,
        lineWidth: 1.35,
        hugoniotIntersections: includeIntersections
          ? computeHugoniotIntersections(fixedState, params, calcView, point, 'characteristic', direction)
          : null,
      }
    })
    .filter(Boolean)
}

export function useCharacteristicSelection({
  params,
  calcView,
  selectedByBranch,
  activeBranch,
  frozenSelectedByBranch,
  dragPreviewByBranch,
  draggingCharacteristicPoint,
  setSelectedByBranch,
  setActiveBranch,
  setInspectedCurvePoint,
  setDraggingCharacteristicPoint,
  setFrozenSelectedByBranch,
  setDragPreviewByBranch,
  setOrbitControlsEnabled,
  clearSelection,
}) {
  const displayedSelectedByBranch = dragPreviewByBranch ?? selectedByBranch

  const displayedSelectedEntries = useMemo(() => (
    buildSelectionEntries(
      displayedSelectedByBranch,
      params,
      calcView,
      !dragPreviewByBranch && !draggingCharacteristicPoint,
    )
  ), [calcView, displayedSelectedByBranch, dragPreviewByBranch, draggingCharacteristicPoint, params])

  const curveEntries = useMemo(() => (
    buildSelectionEntries(frozenSelectedByBranch ?? selectedByBranch, params, calcView, false)
  ), [calcView, frozenSelectedByBranch, params, selectedByBranch])

  const activeSelection = useMemo(() => {
    if (!activeBranch) return displayedSelectedEntries[displayedSelectedEntries.length - 1] ?? null
    return displayedSelectedEntries.find((entry) => entry.branch === activeBranch) ?? displayedSelectedEntries[displayedSelectedEntries.length - 1] ?? null
  }, [activeBranch, displayedSelectedEntries])

  const commitSelectedCharacteristicPoint = useCallback((point) => {
    if (!point?.branch) return
    const branch = point.branch
    const selected = {
      ...point,
      Y: 0,
      s: Number.isFinite(point.s) ? point.s : waveSpeed(point.t, point.z, params),
      branch,
    }

    setSelectedByBranch((prev) => {
      const current = prev?.[branch]
      if (
        current &&
        Math.abs((current.t ?? 0) - (selected.t ?? 0)) < 1e-8 &&
        Math.abs((current.z ?? 0) - (selected.z ?? 0)) < 1e-8
      ) {
        return prev
      }
      return { ...prev, [branch]: selected }
    })
    setActiveBranch(branch)

    const state = computeStateFromCharacteristicPoint(point.t, point.z, params)
    if (state && branch === 'fast') {
      setInspectedCurvePoint(computeWavePointDiagnostics({ ...selected, uPlus: state.uMinus, vPlus: state.vMinus }, params))
    } else {
      setInspectedCurvePoint(computeWavePointDiagnostics(state ? { ...selected, uMinus: state.uMinus, vMinus: state.vMinus } : selected, params))
    }
  }, [params, setActiveBranch, setInspectedCurvePoint, setSelectedByBranch])

  const previewSelectedCharacteristicPoint = useCallback((point) => {
    if (!point?.branch) return
    const branch = point.branch
    const selected = {
      ...point,
      Y: 0,
      s: Number.isFinite(point.s) ? point.s : waveSpeed(point.t, point.z, params),
      branch,
    }

    setDragPreviewByBranch((prev) => {
      const base = prev ?? selectedByBranch
      const current = base?.[branch]
      if (
        current &&
        Math.abs((current.t ?? 0) - (selected.t ?? 0)) < 1e-8 &&
        Math.abs((current.z ?? 0) - (selected.z ?? 0)) < 1e-8
      ) {
        return prev ?? base
      }
      return { ...base, [branch]: selected }
    })
    setActiveBranch(branch)
  }, [params, selectedByBranch, setActiveBranch, setDragPreviewByBranch])

  const updateSelectedCharacteristicPoint = useCallback((point, options = {}) => {
    const branch = inferCharacteristicBranch(point)
    const normalized = { ...point, branch }

    if (options.dragging && !options.final) {
      previewSelectedCharacteristicPoint(normalized)
      return
    }

    commitSelectedCharacteristicPoint(normalized)
    if (options.final) {
      setFrozenSelectedByBranch(null)
      setDragPreviewByBranch(null)
    }
  }, [commitSelectedCharacteristicPoint, previewSelectedCharacteristicPoint, setDragPreviewByBranch, setFrozenSelectedByBranch])

  const handleSelectCharacteristicPoint = useCallback((point, options = {}) => {
    const branch = inferCharacteristicBranch(point)
    if (options.dragging && !options.final && !draggingCharacteristicPoint) {
      setOrbitControlsEnabled(false)
      setDraggingCharacteristicPoint(true)
      setFrozenSelectedByBranch(selectedByBranch)
      setDragPreviewByBranch(selectedByBranch)
    }
    if (options.final) {
      setOrbitControlsEnabled(true)
      setDraggingCharacteristicPoint(false)
      setFrozenSelectedByBranch(null)
      setDragPreviewByBranch(null)
    }
    updateSelectedCharacteristicPoint({ ...point, branch }, options)
  }, [draggingCharacteristicPoint, selectedByBranch, setDragPreviewByBranch, setDraggingCharacteristicPoint, setFrozenSelectedByBranch, setOrbitControlsEnabled, updateSelectedCharacteristicPoint])

  const handleCharacteristicMarkerDragChange = useCallback((dragging) => {
    setOrbitControlsEnabled(!dragging)
    setDraggingCharacteristicPoint(dragging)
    setFrozenSelectedByBranch(dragging ? selectedByBranch : null)
    setDragPreviewByBranch(dragging ? selectedByBranch : null)
  }, [selectedByBranch, setDragPreviewByBranch, setDraggingCharacteristicPoint, setFrozenSelectedByBranch, setOrbitControlsEnabled])

  const handleCharacteristicMarkerHoverChange = useCallback((hovering) => {
    if (draggingCharacteristicPoint) return
    setOrbitControlsEnabled(!hovering)
  }, [draggingCharacteristicPoint, setOrbitControlsEnabled])

  return {
    displayedSelectedByBranch,
    displayedSelectedEntries,
    curveEntries,
    activeSelection,
    selectedCharacteristicPoint: activeSelection?.point ?? null,
    selectedClickSource: activeSelection ? 'characteristic' : null,
    selectedState: activeSelection?.selectedState ?? activeSelection?.state ?? null,
    hugoniotIntersections: activeSelection?.hugoniotIntersections ?? null,
    onSelectCharacteristicPoint: handleSelectCharacteristicPoint,
    onMoveSelectedPoint: updateSelectedCharacteristicPoint,
    onMarkerDragChange: handleCharacteristicMarkerDragChange,
    onMarkerHoverChange: handleCharacteristicMarkerHoverChange,
    clearSelection,
  }
}
