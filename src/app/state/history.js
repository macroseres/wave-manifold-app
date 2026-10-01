import { experimentSnapshot, isExperimentKey } from '../experiments/experimentFormat.js'

export const HISTORY_LIMIT = 40
export function createHistory(state) { return { present: state, past: [], future: [] } }
export function historyReducer(history, action, reducer) {
  if (action.type === 'undo' || action.type === 'redo') {
    const undo = action.type === 'undo'
    const source = undo ? history.past : history.future
    if (!source.length || history.present.draggingCharacteristicPoint) return history
    const previous = source[source.length - 1]
    const current = { ...experimentSnapshot(history.present), cameraRestore: history.present.cameraRestore }
    const present = { ...history.present, ...previous, inspectedCurvePoint: null, hoveredInspectionPoint: null,
      hoverTooltipPosition: null, solutionDiagnostics: [], solutionArcSamplesByBranch: { slow: [], fast: [] },
      frozenSelectedByBranch: null, dragPreviewByBranch: null }
    return { present, past: undo ? source.slice(0, -1) : [...history.past, current].slice(-HISTORY_LIMIT),
      future: undo ? [...history.future, current].slice(-HISTORY_LIMIT) : source.slice(0, -1) }
  }
  const present = reducer(history.present, action)
  if (present === history.present) return history
  if (action.type === 'set' && !isExperimentKey(action.key)) return { ...history, present }
  const before = experimentSnapshot(history.present)
  if (action.type !== 'loadExperiment' && JSON.stringify(before) === JSON.stringify(experimentSnapshot(present))) return { ...history, present }
  const checkpoint = { ...before, cameraRestore: action.previousCamera
    ? { ...action.previousCamera, revision: action.revision - 1 } : history.present.cameraRestore }
  return { present, past: [...history.past, checkpoint].slice(-HISTORY_LIMIT), future: [] }
}
