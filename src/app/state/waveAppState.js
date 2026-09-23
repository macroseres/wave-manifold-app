import { useCallback, useMemo, useReducer } from 'react'

import { readCaseDrawings } from '../../components/panels/schaefferCaseStorage.js'
import { drawingDefaultForCase, parametersDefaultForCase } from '../../components/panels/schaefferShearerConfig.js'

const initialCaseDrawing = drawingDefaultForCase('iv')

export const initialSolutionCurveVisibility = {
  slow: {
    hugoniotLocal: true,
    hugoniotNonlocal: true,
    rarefactionLocal: true,
    rarefactionNonlocal: true,
    composite: true,
    compositeLocal: true,
    compositeNonlocal: true,
    involvedRarefactionCurve: false,
    involvedCompositeCurve: false,
    satInvolvedRarefactionCurve: false,
    satHugoniotLocal: false,
    satHugoniotNonlocal: false,
    satRarefactionLocal: false,
    satRarefactionNonlocal: false,
    satComposite: false,
    chosenHPlusIntersection: false,
    chosenHMinusRarefaction: false,
  },
  fast: {
    hugoniotLocal: false,
    hugoniotNonlocal: false,
    rarefactionLocal: false,
    rarefactionNonlocal: false,
    composite: false,
    compositeLocal: false,
    compositeNonlocal: false,
    involvedRarefactionCurve: false,
    involvedCompositeCurve: false,
  },
  reflected: {
    hugoniotLocal: false,
    hugoniotNonlocal: false,
    rarefactionLocal: false,
    rarefactionNonlocal: false,
    composite: false,
    compositeLocal: false,
    compositeNonlocal: false,
    involvedRarefactionCurve: false,
    involvedCompositeCurve: false,
  },
}

const initialInspectionCurveVisibility = {
  slow: {
    hugoniotMinus: true,
    hugoniotPlus: true,
    rarefaction: true,
  },
  fast: {
    hugoniotMinus: true,
    hugoniotPlus: true,
    rarefaction: true,
  },
}

export const initialWaveAppState = {
  params: parametersDefaultForCase('iv'),
  view: initialCaseDrawing.view,
  ...initialCaseDrawing.scales,
  resolution: initialCaseDrawing.resolution,
  opacity: 0.75,
  showAxes: true,
  showCharacteristic: true,
  showSonicRight: false,
  showSonicLeft: false,
  showHopfPlus: false,
  showHopfMinus: false,
  showSaturated: false,
  showSaturatedPlus: false,
  showHysteresisSelfIntersection: false,
  showLeftHysteresisSelfIntersection: false,
  showSaturatedCoincidence: false,
  showSaturatedCoincidencePlus: false,
  showExtensionCoincidenceMinus: false,
  showExtensionCoincidencePlus: false,
  showRarefactionSlow: false,
  showRarefactionFast: false,
  showCompositeSlow: false,
  showCompositeFast: false,
  showCompositeSaturatedSlow: false,
  showCompositeSaturatedFast: false,
  showHugoniotMinus: false,
  showHugoniotPlus: false,
  showHysteresisLeft: false,
  showHysteresisRight: false,
  showDoubleSonicMinusProjection: false,
  showHysteresisSelfIntersectionMinusProjection: false,
  showDoubleSonicPlusProjection: false,
  showHysteresisSelfIntersectionPlusProjection: false,
  showExtensionMinusMinusProjection: false,
  showExtensionPlusMinusProjection: false,
  showExtensionMinusPlusProjection: false,
  showExtensionPlusPlusProjection: false,
  showInflectionMinusProjection: false,
  showInflectionPlusProjection: false,
  showHysPlusMinusProjection: false,
  showCoincidenceMinusProjection: false,
  showRarefactionSlowMinusProjection: false,
  showRarefactionFastMinusProjection: false,
  showCompositeSlowMinusProjection: false,
  showCompositeFastMinusProjection: false,
  showCoincidencePlusProjection: false,
  showRarefactionSlowPlusProjection: false,
  showRarefactionFastPlusProjection: false,
  showCompositeSlowPlusProjection: false,
  showCompositeFastPlusProjection: false,
  showHysMinusMinusProjection: false,
  showHysPlusPlusProjection: false,
  showHugoniotMinusPlusProjection: false,
  showHugoniotPlusPlusProjection: false,
  showHugoniotMinusMinusProjection: false,
  showHugoniotPlusMinusProjection: false,
  showHysMinusPlusProjection: false,
  showCoincidence: true,
  showBifurcationLeft: false,
  showSaturatedLeftMinus: false,
  showSaturatedLeftPlus: false,
  showBifurcationRight: false,
  showInflectionSlow: false,
  showInflectionFast: false,
  showDoubleSonic: false,
  selectedByBranch: { slow: null, fast: null },
  activeBranch: null,
  inspectedCurvePoint: null,
  hoveredInspectionPoint: null,
  hoverTooltipPosition: null,
  activeView: '3d',
  zoomSignal: 0,
  autoRotate3D: false,
  controlsEnabled: true,
  draggingCharacteristicPoint: false,
  frozenSelectedByBranch: null,
  dragPreviewByBranch: null,
  inspectionModeEnabled: false,
  solutionModeEnabled: false,
  inspectionProbesByBranch: { slow: null, fast: null },
  inspectionCurveVisibility: initialInspectionCurveVisibility,
  solutionCurveVisibility: initialSolutionCurveVisibility,
  solutionArcSamplesByBranch: { slow: [], fast: [] },
  solutionDiagnostics: [],
}

function resolveUpdate(valueOrUpdater, currentValue) {
  return typeof valueOrUpdater === 'function' ? valueOrUpdater(currentValue) : valueOrUpdater
}

function waveAppReducer(state, action) {
  switch (action.type) {
    case 'set': {
      const next = resolveUpdate(action.value, state[action.key])
      if (Object.is(next, state[action.key])) return state
      return { ...state, [action.key]: next }
    }
    case 'patch':
      return { ...state, ...action.patch }
    case 'zoomIn':
      return { ...state, zoomSignal: state.zoomSignal + 1 }
    case 'zoomOut':
      return { ...state, zoomSignal: state.zoomSignal - 1 }
    case 'setHysteresis': {
      const checked = Boolean(action.value)
      return { ...state, showHysteresisLeft: checked, showHysteresisRight: checked }
    }
    case 'clearSelection':
      return {
        ...state,
        selectedByBranch: { slow: null, fast: null },
        activeBranch: null,
        inspectedCurvePoint: null,
        hoveredInspectionPoint: null,
        hoverTooltipPosition: null,
        dragPreviewByBranch: null,
        solutionDiagnostics: [],
      }
    case 'enableSolutionMode':
      return {
        ...state,
        solutionModeEnabled: Boolean(action.value),
        solutionCurveVisibility: action.value ? initialSolutionCurveVisibility : state.solutionCurveVisibility,
      }
    default:
      return state
  }
}

export function useWaveAppState() {
  const [state, dispatch] = useReducer(waveAppReducer, initialWaveAppState, (initialState) => {
    const saved = readCaseDrawings().iv
    return saved ? {
      ...initialState,
      ...saved.scales,
      resolution: saved.resolution,
      view: saved.view,
    } : initialState
  })

  const setField = useCallback((key) => (value) => {
    dispatch({ type: 'set', key, value })
  }, [])

  const actions = useMemo(() => {
    const nextActions = {
      dispatch,
      patch: (patch) => dispatch({ type: 'patch', patch }),
      zoomIn: () => dispatch({ type: 'zoomIn' }),
      zoomOut: () => dispatch({ type: 'zoomOut' }),
      clearSelection: () => dispatch({ type: 'clearSelection' }),
      setShowHysteresis: (value) => dispatch({ type: 'setHysteresis', value }),
      setSolutionModeEnabled: (value) => dispatch({ type: 'enableSolutionMode', value }),
    }

    for (const key of Object.keys(initialWaveAppState)) {
      const setterName = `set${key[0].toUpperCase()}${key.slice(1)}`
      if (!nextActions[setterName]) nextActions[setterName] = setField(key)
    }

    return nextActions
  }, [setField])

  return [state, actions]
}







