import { useEffect, useState } from 'react'
import { defaultView } from '../../config/viewDefaults'
import { waveColors } from '../../config/waveColors'
import { displayCoordinateTex, formatNumber } from '../../ui/display'
import {
  parameterPointMeta,
  schaefferShearerCases,
  defaultSchaefferShearerScales,
  drawingDefaultForCase,
  initialSchaefferShearerCasePresets,
  initialParameterWindow,
  constrainPointToCase,
} from './schaefferShearerConfig'
import { ensureMathJaxLoaded, typesetMathJax } from './mathJaxTypeset'

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const roundParameterValue = (value) => Number(value.toFixed(4))

function buildModeLabels({ activeView, solutionModeEnabled, inspectionModeEnabled, autoRotate3D }) {
  const activeViewLabel = {
    '3d': 'Variedade 3D',
    state: 'Espaço de estados',
    solution: 'Solução',
    params: 'Parâmetros',
  }[activeView] ?? 'Variedade 3D'

  const activeModeLabel = solutionModeEnabled
    ? 'Modo solução'
    : inspectionModeEnabled
      ? 'Modo inspeção'
      : autoRotate3D
        ? 'Rotação automática'
        : null

  const activeModeClass = solutionModeEnabled
    ? 'solution'
    : inspectionModeEnabled
      ? 'inspection'
      : autoRotate3D
        ? 'rotate'
        : 'free'

  return { activeViewLabel, activeModeLabel, activeModeClass }
}

export default function useOverlayPanelController(props) {
  const {
    params,
    setParams,
    view,
    setView,
    setYScale,
    setTScale,
    setZScale,
    showAxes,
    setShowAxes,
    showCharacteristic,
    setShowCharacteristic,
    showSonicRight,
    setShowSonicRight,
    showSonicLeft,
    setShowSonicLeft,
    showHopfPlus,
    setShowHopfPlus,
    showHopfMinus,
    setShowHopfMinus,
    showSaturated,
    showDoubleSonicMinusProjection,
    showHysteresisSelfIntersectionMinusProjection,
    showDoubleSonicPlusProjection,
    showHysteresisSelfIntersectionPlusProjection,
    showExtensionMinusMinusProjection,
    showExtensionPlusMinusProjection,
    showExtensionMinusPlusProjection,
    showExtensionPlusPlusProjection,
    showInflectionMinusProjection,
    showInflectionPlusProjection,
    showHysPlusMinusProjection,
    showCoincidenceMinusProjection,
    showRarefactionSlowMinusProjection,
    showRarefactionFastMinusProjection,
    showCompositeSlowMinusProjection,
    showCompositeFastMinusProjection,
    showCoincidencePlusProjection,
    showRarefactionSlowPlusProjection,
    showRarefactionFastPlusProjection,
    showCompositeSlowPlusProjection,
    showCompositeFastPlusProjection,
    showHysMinusMinusProjection,
    showHysPlusPlusProjection,
    showHugoniotMinusPlusProjection,
    showHugoniotPlusPlusProjection,
    showHugoniotMinusMinusProjection,
    showHugoniotPlusMinusProjection,
    showHysMinusPlusProjection,
    showSaturatedPlus,
    showHysteresisSelfIntersection,
    setShowSaturated,
    setShowDoubleSonicMinusProjection,
    setShowHysteresisSelfIntersectionMinusProjection,
    setShowDoubleSonicPlusProjection,
    setShowHysteresisSelfIntersectionPlusProjection,
    setShowExtensionMinusMinusProjection,
    setShowExtensionPlusMinusProjection,
    setShowExtensionMinusPlusProjection,
    setShowExtensionPlusPlusProjection,
    setShowInflectionMinusProjection,
    setShowInflectionPlusProjection,
    setShowHysPlusMinusProjection,
    setShowCoincidenceMinusProjection,
    setShowRarefactionSlowMinusProjection,
    setShowRarefactionFastMinusProjection,
    setShowCompositeSlowMinusProjection,
    setShowCompositeFastMinusProjection,
    setShowCoincidencePlusProjection,
    setShowRarefactionSlowPlusProjection,
    setShowRarefactionFastPlusProjection,
    setShowCompositeSlowPlusProjection,
    setShowCompositeFastPlusProjection,
    setShowHysMinusMinusProjection,
    setShowHysPlusPlusProjection,
    setShowHugoniotMinusPlusProjection,
    setShowHugoniotPlusPlusProjection,
    setShowHugoniotMinusMinusProjection,
    setShowHugoniotPlusMinusProjection,
    setShowHysMinusPlusProjection,
    setShowSaturatedPlus,
    setShowHysteresisSelfIntersection,
    showSaturatedCoincidence,
    setShowSaturatedCoincidence,
    showSaturatedCoincidencePlus,
    setShowSaturatedCoincidencePlus,
    showExtensionCoincidenceMinus,
    setShowExtensionCoincidenceMinus,
    showExtensionCoincidencePlus,
    setShowExtensionCoincidencePlus,
    showRarefactionSlow,
    setShowRarefactionSlow,
    showRarefactionFast,
    setShowRarefactionFast,
    showCompositeSlow,
    setShowCompositeSlow,
    showCompositeFast,
    setShowCompositeFast,
    showCompositeSaturatedSlow,
    setShowCompositeSaturatedSlow,
    showCompositeSaturatedFast,
    setShowCompositeSaturatedFast,
    showHugoniotMinus,
    setShowHugoniotMinus,
    showHugoniotPlus,
    setShowHugoniotPlus,
    showHysteresis,
    setShowHysteresis,
    showHysteresisLeft,
    setShowHysteresisLeft,
    showHysteresisRight,
    setShowHysteresisRight,
    showCoincidence,
    setShowCoincidence,
    showBifurcationRight,
    setShowBifurcationRight,
    showInflectionSlow,
    setShowInflectionSlow,
    showInflectionFast,
    setShowInflectionFast,
    showDoubleSonic,
    setShowDoubleSonic,
    selectedEntries = [],
    activeBranch,
    selectedCharacteristicPoint,
    selectedClickSource,
    selectedState,
    hugoniotIntersections,
    inspectedCurvePoint,
    hoveredInspectionPoint,
    clearSelectedState,
    activeView = '3d',
    autoRotate3D = false,
    inspectionModeEnabled = false,
    solutionModeEnabled = false,
    inspectionProbesByBranch = { slow: null, fast: null },
    inspectionCurveVisibility,
    setInspectionCurveVisibility,
    solutionCurveVisibility,
    setSolutionCurveVisibility,
  } = props

  const slowEntry = selectedEntries.find((entry) => entry.branch === 'slow') ?? null
  const fastEntry = selectedEntries.find((entry) => entry.branch === 'fast') ?? null
  const activeEntry = activeBranch === 'slow' ? slowEntry : activeBranch === 'fast' ? fastEntry : null
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [showDocumentation, setShowDocumentation] = useState(false)
  const [parameterWindow, setParameterWindow] = useState(initialParameterWindow)
  const [visibleParameterCurves, setVisibleParameterCurves] = useState({ c1: true, c2: true, c3: true })
  const [hoveredParameterCase, setHoveredParameterCase] = useState(null)
  const [selectedSchaefferShearerCase, setSelectedSchaefferShearerCase] = useState('iv')
  const [schaefferShearerCasePresets, setSchaefferShearerCasePresets] = useState(initialSchaefferShearerCasePresets)
  const activeParameterCase = hoveredParameterCase ?? selectedSchaefferShearerCase
  const { activeViewLabel, activeModeLabel, activeModeClass } = buildModeLabels({
    activeView,
    solutionModeEnabled,
    inspectionModeEnabled,
    autoRotate3D,
  })

  const updateSelectedSchaefferShearerPreset = (updater) => {
    setSchaefferShearerCasePresets((prev) => ({
      ...prev,
      [selectedSchaefferShearerCase]: updater(prev[selectedSchaefferShearerCase]),
    }))
  }

  const parameterPointBoundsForWindow = {
    b1Min: parameterWindow.b1Min,
    b1Max: parameterWindow.b1Max,
    b2Min: parameterWindow.b2Min,
    b2Max: parameterWindow.b2Max,
  }

  const updateParam = (name, value) => {
    const boundedValue = name === 'b1'
      ? roundParameterValue(clamp(value, parameterWindow.b1Min, parameterWindow.b1Max))
      : name === 'b2'
        ? roundParameterValue(clamp(value, parameterWindow.b2Min, parameterWindow.b2Max))
        : value
    setParams((prev) => ({ ...prev, [name]: boundedValue }))
    if (name === 'b1' || name === 'b2') {
      updateSelectedSchaefferShearerPreset((preset) => ({
        ...preset,
        params: { ...preset.params, [name]: boundedValue },
      }))
    }
  }

  const applySchaefferShearerCase = (caseKey) => {
    const preset = schaefferShearerCasePresets[caseKey]
    if (!preset) return
    const drawingDefault = drawingDefaultForCase(caseKey, preset)

    setSelectedSchaefferShearerCase(caseKey)
    setParams((prev) => ({ ...prev, b1: preset.params.b1, b2: preset.params.b2 }))
    setYScale(drawingDefault.scales.yScale)
    setTScale(drawingDefault.scales.tScale)
    setZScale(drawingDefault.scales.zScale)
    setView({ ...drawingDefault.view })
    setSchaefferShearerCasePresets((prev) => ({
      ...prev,
      [caseKey]: {
        ...prev[caseKey],
        scales: { ...drawingDefault.scales },
        view: { ...drawingDefault.view },
      },
    }))
  }

  const updateScale = (name, value, setter) => {
    setter(value)
    updateSelectedSchaefferShearerPreset((preset) => ({
      ...preset,
      scales: { ...preset.scales, [name]: value },
    }))
  }

  const updateView = (name, value) => {
    const next = { ...view, [name]: value }
    if (next.yMin >= next.yMax || next.tMin >= next.tMax || next.zMin >= next.zMax) return
    setView(next)
    updateSelectedSchaefferShearerPreset((preset) => ({ ...preset, view: { ...next } }))
  }

  const resetDrawingView = () => {
    setView(defaultView)
    updateSelectedSchaefferShearerPreset((preset) => ({ ...preset, view: { ...defaultView } }))
  }

  const resetCaseScales = () => {
    setYScale(defaultSchaefferShearerScales.yScale)
    setTScale(defaultSchaefferShearerScales.tScale)
    setZScale(defaultSchaefferShearerScales.zScale)
    updateSelectedSchaefferShearerPreset((preset) => ({
      ...preset,
      scales: { ...defaultSchaefferShearerScales },
    }))
  }

  const updateParameterWindow = (name, value) => {
    const next = { ...parameterWindow, [name]: value }
    if (next.b1Min >= next.b1Max || next.b2Min >= next.b2Max) return
    setParameterWindow(next)
    const nextB1 = roundParameterValue(clamp(params.b1, next.b1Min, next.b1Max))
    const nextB2 = roundParameterValue(clamp(params.b2, next.b2Min, next.b2Max))
    if (nextB1 !== params.b1 || nextB2 !== params.b2) {
      setParams((prev) => ({ ...prev, b1: nextB1, b2: nextB2 }))
      updateSelectedSchaefferShearerPreset((preset) => ({
        ...preset,
        params: { ...preset.params, b1: nextB1, b2: nextB2 },
      }))
    }
  }

  const resetParameterWindow = () => {
    setParameterWindow(initialParameterWindow)
    const nextB1 = roundParameterValue(clamp(params.b1, initialParameterWindow.b1Min, initialParameterWindow.b1Max))
    const nextB2 = roundParameterValue(clamp(params.b2, initialParameterWindow.b2Min, initialParameterWindow.b2Max))
    setParams((prev) => ({ ...prev, b1: nextB1, b2: nextB2 }))
    updateSelectedSchaefferShearerPreset((preset) => ({
      ...preset,
      params: { ...preset.params, b1: nextB1, b2: nextB2 },
    }))
  }

  const updateVisibleParameterCurve = (name, checked) => {
    setVisibleParameterCurves((prev) => ({ ...prev, [name]: checked }))
  }

  const currentParameterPoint = {
    label: parameterPointMeta.label,
    b1: Number.isFinite(params.b1) ? params.b1 : 0,
    b2: Number.isFinite(params.b2) ? params.b2 : 0,
  }

  const updateParameterPoint = ({ b1, b2 }) => {
    const constrained = constrainPointToCase({ b1, b2 }, selectedSchaefferShearerCase, parameterPointBoundsForWindow)
    const nextB1 = roundParameterValue(clamp(constrained.b1, parameterWindow.b1Min, parameterWindow.b1Max))
    const nextB2 = roundParameterValue(clamp(constrained.b2, parameterWindow.b2Min, parameterWindow.b2Max))
    setParams((prev) => ({ ...prev, b1: nextB1, b2: nextB2 }))
    updateSelectedSchaefferShearerPreset((preset) => ({
      ...preset,
      params: { ...preset.params, b1: nextB1, b2: nextB2 },
    }))
  }

  const projectionSetters = [
    setShowDoubleSonicMinusProjection,
    setShowHysteresisSelfIntersectionMinusProjection,
    setShowDoubleSonicPlusProjection,
    setShowHysteresisSelfIntersectionPlusProjection,
    setShowExtensionMinusMinusProjection,
    setShowExtensionPlusMinusProjection,
    setShowExtensionMinusPlusProjection,
    setShowExtensionPlusPlusProjection,
    setShowInflectionMinusProjection,
    setShowInflectionPlusProjection,
    setShowHysPlusMinusProjection,
    setShowCoincidenceMinusProjection,
    setShowRarefactionSlowMinusProjection,
    setShowRarefactionFastMinusProjection,
    setShowCompositeSlowMinusProjection,
    setShowCompositeFastMinusProjection,
    setShowCoincidencePlusProjection,
    setShowRarefactionSlowPlusProjection,
    setShowRarefactionFastPlusProjection,
    setShowCompositeSlowPlusProjection,
    setShowCompositeFastPlusProjection,
    setShowHysMinusMinusProjection,
    setShowHysPlusPlusProjection,
    setShowHugoniotMinusPlusProjection,
    setShowHugoniotPlusPlusProjection,
    setShowHugoniotMinusMinusProjection,
    setShowHugoniotPlusMinusProjection,
    setShowHysMinusPlusProjection,
  ]
  const sceneSetters = [
    setShowHopfPlus,
    setShowHopfMinus,
    setShowAxes,
    setShowCharacteristic,
    setShowSonicRight,
    setShowSonicLeft,
    setShowSaturated,
    setShowSaturatedPlus,
    setShowHysteresisSelfIntersection,
    setShowSaturatedCoincidence,
    setShowSaturatedCoincidencePlus,
    setShowExtensionCoincidenceMinus,
    setShowExtensionCoincidencePlus,
    setShowRarefactionSlow,
    setShowRarefactionFast,
    setShowCompositeSlow,
    setShowCompositeFast,
    setShowCompositeSaturatedSlow,
    setShowCompositeSaturatedFast,
    setShowHugoniotMinus,
    setShowHugoniotPlus,
    setShowHysteresisLeft ?? setShowHysteresis,
    setShowHysteresisRight ?? setShowHysteresis,
    setShowCoincidence,
    setShowBifurcationRight,
    setShowInflectionSlow,
    setShowInflectionFast,
    setShowDoubleSonic,
  ]

  const setAllVisualizationControls = (value) => {
    const visualizationSetters = activeView === 'state' ? projectionSetters : sceneSetters
    visualizationSetters.filter((setter) => typeof setter === 'function').forEach((setter) => setter(Boolean(value)))
  }

  const clearVisualizationControls = (event) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    setAllVisualizationControls(false)
  }

  const markVisualizationControls = (event) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    setAllVisualizationControls(true)
  }

  const rightInfoPanelProps = {
    activeView,
    activeEntry,
    formatNumber,
    hugoniotIntersections,
    inspectedCurvePoint,
    hoveredInspectionPoint,
    params,
    selectedClickSource,
    slowEntry,
    fastEntry,
    waveColors,
    inspectionModeEnabled,
    solutionModeEnabled,
    inspectionProbesByBranch,
    inspectionCurveVisibility,
    setInspectionCurveVisibility,
    solutionCurveVisibility,
    setSolutionCurveVisibility,
  }

  const visualizationPanelProps = {
    showHopfPlus,
    setShowHopfPlus,
    showHopfMinus,
    setShowHopfMinus,
    activeView,
    activeEntry,
    clearSelectedState,
    clearVisualizationControls,
    displayCoordinateTex,
    formatNumber,
    hugoniotIntersections,
    inspectedCurvePoint,
    hoveredInspectionPoint,
    selectedClickSource,
    markVisualizationControls,
    setShowAxes,
    setShowBifurcationRight,
    setShowCharacteristic,
    setShowCoincidence,
    setShowCompositeFast,
    setShowCompositeSlow,
    setShowCompositeSaturatedFast,
    setShowCompositeSaturatedSlow,
    setShowDoubleSonic,
    setShowHugoniotMinus,
    setShowHugoniotPlus,
    setShowHysteresis,
    setShowHysteresisLeft,
    setShowHysteresisRight,
    setShowInflectionFast,
    setShowInflectionSlow,
    setShowRarefactionFast,
    setShowRarefactionSlow,
    setShowSaturated,
    setShowDoubleSonicMinusProjection,
    setShowHysteresisSelfIntersectionMinusProjection,
    setShowDoubleSonicPlusProjection,
    setShowHysteresisSelfIntersectionPlusProjection,
    setShowExtensionMinusMinusProjection,
    setShowExtensionPlusMinusProjection,
    setShowExtensionMinusPlusProjection,
    setShowExtensionPlusPlusProjection,
    setShowInflectionMinusProjection,
    setShowInflectionPlusProjection,
    setShowHysPlusMinusProjection,
    setShowCoincidenceMinusProjection,
    setShowRarefactionSlowMinusProjection,
    setShowRarefactionFastMinusProjection,
    setShowCompositeSlowMinusProjection,
    setShowCompositeFastMinusProjection,
    setShowCoincidencePlusProjection,
    setShowRarefactionSlowPlusProjection,
    setShowRarefactionFastPlusProjection,
    setShowCompositeSlowPlusProjection,
    setShowCompositeFastPlusProjection,
    setShowHysMinusMinusProjection,
    setShowHysPlusPlusProjection,
    setShowHugoniotMinusPlusProjection,
    setShowHugoniotPlusPlusProjection,
    setShowHugoniotMinusMinusProjection,
    setShowHugoniotPlusMinusProjection,
    setShowHysMinusPlusProjection,
    setShowSaturatedPlus,
    setShowHysteresisSelfIntersection,
    setShowSaturatedCoincidence,
    setShowSaturatedCoincidencePlus,
    setShowExtensionCoincidenceMinus,
    setShowExtensionCoincidencePlus,
    setShowSonicLeft,
    setShowSonicRight,
    showAxes,
    showBifurcationRight,
    showCharacteristic,
    showCoincidence,
    showCompositeFast,
    showCompositeSlow,
    showCompositeSaturatedFast,
    showCompositeSaturatedSlow,
    showDoubleSonic,
    showHugoniotMinus,
    showHugoniotPlus,
    showHysteresis,
    showHysteresisLeft,
    showHysteresisRight,
    showInflectionFast,
    showInflectionSlow,
    showRarefactionFast,
    showRarefactionSlow,
    showSaturated,
    showDoubleSonicMinusProjection,
    showHysteresisSelfIntersectionMinusProjection,
    showDoubleSonicPlusProjection,
    showHysteresisSelfIntersectionPlusProjection,
    showExtensionMinusMinusProjection,
    showExtensionPlusMinusProjection,
    showExtensionMinusPlusProjection,
    showExtensionPlusPlusProjection,
    showInflectionMinusProjection,
    showInflectionPlusProjection,
    showHysPlusMinusProjection,
    showCoincidenceMinusProjection,
    showRarefactionSlowMinusProjection,
    showRarefactionFastMinusProjection,
    showCompositeSlowMinusProjection,
    showCompositeFastMinusProjection,
    showCoincidencePlusProjection,
    showRarefactionSlowPlusProjection,
    showRarefactionFastPlusProjection,
    showCompositeSlowPlusProjection,
    showCompositeFastPlusProjection,
    showHysMinusMinusProjection,
    showHysPlusPlusProjection,
    showHugoniotMinusPlusProjection,
    showHugoniotPlusPlusProjection,
    showHugoniotMinusMinusProjection,
    showHugoniotPlusMinusProjection,
    showHysMinusPlusProjection,
    showSaturatedPlus,
    showHysteresisSelfIntersection,
    showSaturatedCoincidence,
    showSaturatedCoincidencePlus,
    showExtensionCoincidenceMinus,
    showExtensionCoincidencePlus,
    showSonicLeft,
    showSonicRight,
    waveColors,
  }

  const parameterPlotX = (b1) => ((b1 - parameterWindow.b1Min) / Math.max(1e-12, parameterWindow.b1Max - parameterWindow.b1Min)) * 100
  const parameterPlotY = (b2) => ((parameterWindow.b2Max - b2) / Math.max(1e-12, parameterWindow.b2Max - parameterWindow.b2Min)) * 100
  const parameterAxisX = Math.max(0, Math.min(100, parameterPlotX(0)))
  const parameterAxisY = Math.max(0, Math.min(100, parameterPlotY(0)))

  useEffect(() => {
    ensureMathJaxLoaded()
    const timer = window.setTimeout(typesetMathJax, 80)
    return () => window.clearTimeout(timer)
  }, [selectedEntries, selectedCharacteristicPoint, selectedClickSource, selectedState, hugoniotIntersections, inspectedCurvePoint, params, activeView, showSettingsPanel, showDocumentation, inspectionModeEnabled, solutionModeEnabled, inspectionProbesByBranch])

  return {
    activeParameterCase,
    activeViewLabel,
    activeModeLabel,
    activeModeClass,
    currentParameterPoint,
    displayCoordinateTex,
    formatNumber,
    parameterAxisX,
    parameterAxisY,
    parameterPointBoundsForWindow,
    parameterWindow,
    rightInfoPanelProps,
    schaefferShearerCases,
    selectedSchaefferShearerCase,
    setHoveredParameterCase,
    setShowDocumentation,
    setShowSettingsPanel,
    showDocumentation,
    showSettingsPanel,
    updateParam,
    updateParameterPoint,
    updateParameterWindow,
    updateScale,
    updateView,
    updateVisibleParameterCurve,
    resetCaseScales,
    resetDrawingView,
    resetParameterWindow,
    visualizationPanelProps,
    visibleParameterCurves,
    applySchaefferShearerCase,
  }
}








