import { useMemo, useState } from 'react'
import { PhasePortraitContext } from './PhasePortraitContext.js'
import { selectedStatesPortrait } from '../../entities/phasePortrait/flow.js'

export default function PhasePortraitProvider({ state, selection, children }) {
  const [enabledViews, setEnabledViews] = useState({ '3d': false, state: false })
  const [compositeEnabled, setCompositeEnabled] = useState(false)
  const [compositeOptions, setCompositeOptions] = useState({ singularities: true, separatrices: false, eigenDirections: false })
  const [rarefactionOptions, setRarefactionOptions] = useState({ singularities: true, separatrices: false, eigenDirections: false })
  const [viscousOptions, setViscousOptions] = useState({
    equilibria: true, nullclines: false, eigenDirections: false, invariantManifolds: true, connectionOnly: false,
  })
  const { activeView, showCharacteristic, params } = state
  const entries = selection.displayedSelectedEntries
  const viscous = useMemo(() => selectedStatesPortrait(entries, params), [entries, params])
  const valid = activeView === '3d' ? showCharacteristic : activeView === 'state' && Boolean(viscous)
  const enabled = Boolean(enabledViews[activeView])
  const value = { enabled: enabled && valid, checked: enabled && valid,
    compositeEnabled, setCompositeEnabled, rarefactionOptions,
    compositeOptions, setCompositeOption: (key, checked) => setCompositeOptions(previous => ({ ...previous, [key]: checked })),
    setRarefactionOption: (key, checked) => setRarefactionOptions(previous => ({ ...previous, [key]: checked })),
    references: { coincidence: state.showCoincidence, inflection: state.showInflectionSlow && state.showInflectionFast,
      sonics: state.showSonicLeft && state.showSonicRight },
    setEnabled: checked => setEnabledViews(previous => ({ ...previous, [activeView]: checked })),
    valid, viscous, activeView, params, viscousOptions, inspectionModeEnabled: state.inspectionModeEnabled,
    setViscousOption: (key, checked) => setViscousOptions(previous => ({ ...previous, [key]: checked })) }
  return <PhasePortraitContext.Provider value={value}>{children}</PhasePortraitContext.Provider>
}
