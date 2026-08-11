import React, { useEffect, useMemo, useState } from 'react'
import { Section } from './PanelPrimitives'
import { ProbeRow, HoverPointCard } from './rightInfo/inspectionCards'
import { ProbeCurveOptions } from './rightInfo/inspectionOptions'
import { SolutionCurveOptions } from './rightInfo/solutionOptions'
import { defaultCurveVisibility, defaultSolutionVisibility } from './rightInfo/panelDefaults'

function ModeTabs({ tabs, activeModeTab, setActiveModeTab }) {
  return (
    <div className="right-mode-tabs" role="tablist" aria-label="Modos do painel direito">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={activeModeTab === tab.key && tab.enabled}
          aria-disabled={!tab.enabled}
          className={`right-mode-tab ${activeModeTab === tab.key && tab.enabled ? 'active' : ''} ${tab.enabled ? '' : 'disabled'}`}
          style={{ '--tab-accent': tab.accent }}
          disabled={!tab.enabled}
          onClick={() => setActiveModeTab(tab.key)}
        >
          <span className="right-mode-tab-dot" aria-hidden="true" />
          <span className="right-mode-tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

function SolutionTab({ solutionCurveVisibility, setSolutionCurveVisibility }) {
  return (
    <div className="right-mode-content" role="tabpanel" aria-label="Modo Solucao">
      <Section title="Curvas da solucao" defaultOpen={true} accent="#38bdf8">
        <SolutionCurveOptions branch="slow" title="Parte lenta" visibility={solutionCurveVisibility} setVisibility={setSolutionCurveVisibility} />
        <SolutionCurveOptions branch="fast" title="Parte rapida" visibility={solutionCurveVisibility} setVisibility={setSolutionCurveVisibility} />
        <SolutionCurveOptions branch="reflected" title="Reflexo rapido" visibility={solutionCurveVisibility} setVisibility={setSolutionCurveVisibility} />
      </Section>
    </div>
  )
}

function InspectionTab({
  slowPoint,
  fastPoint,
  hoveredInspectionPoint,
  params,
  inspectionCurveVisibility,
  setInspectionCurveVisibility,
}) {
  return (
    <div className="right-mode-content" role="tabpanel" aria-label="Modo Inspecao">
      <Section title="Modo Inspecao" defaultOpen={true} accent="#facc15">
        <HoverPointCard point={hoveredInspectionPoint} params={params} />
        <div className="inspection-probe-stack">
          <ProbeRow label="Sonda lenta" point={slowPoint} params={params} />
          <ProbeRow label="Sonda rapida" point={fastPoint} params={params} />
        </div>
      </Section>
      <Section title="Opcoes da inspecao" defaultOpen={true} accent="#38bdf8">
        <ProbeCurveOptions branch="slow" title="Sonda lenta" visibility={inspectionCurveVisibility} setVisibility={setInspectionCurveVisibility} />
        <ProbeCurveOptions branch="fast" title="Sonda rapida" visibility={inspectionCurveVisibility} setVisibility={setInspectionCurveVisibility} />
      </Section>
    </div>
  )
}

function ShortcutSection() {
  return (
    <Section title="Atalhos" defaultOpen={false} accent="#64748b">
      <div className="shortcut-grid">
        <span>Rotacionar</span><strong>arrastar</strong>
        <span>Zoom</span><strong>scroll</strong>
        <span>Selecionar</span><strong>clique</strong>
        <span>Inspecao</span><strong>Ctrl + arrastar prende na curva</strong>
        <span>Inspecionar</span><strong>botao direito</strong>
      </div>
    </Section>
  )
}

export default function RightInfoPanel({
  inspectionModeEnabled = false,
  solutionModeEnabled = false,
  inspectionProbesByBranch = { slow: null, fast: null },
  inspectionCurveVisibility = defaultCurveVisibility,
  setInspectionCurveVisibility,
  solutionCurveVisibility = defaultSolutionVisibility,
  setSolutionCurveVisibility,
  hoveredInspectionPoint = null,
  params = null,
}) {
  const slowPoint = inspectionProbesByBranch?.slow ?? null
  const fastPoint = inspectionProbesByBranch?.fast ?? null
  const availableModeTabs = useMemo(() => ([
    { key: 'inspection', label: 'Inspecao', enabled: inspectionModeEnabled, accent: '#facc15' },
    { key: 'solution', label: 'Solucao', enabled: solutionModeEnabled, accent: '#22c55e' },
  ]), [inspectionModeEnabled, solutionModeEnabled])
  const firstEnabledMode = availableModeTabs.find((tab) => tab.enabled)?.key ?? 'inspection'
  const [activeModeTab, setActiveModeTab] = useState(firstEnabledMode)

  useEffect(() => {
    setActiveModeTab((current) => {
      const currentIsEnabled = availableModeTabs.some((tab) => tab.key === current && tab.enabled)
      return currentIsEnabled ? current : firstEnabledMode
    })
  }, [availableModeTabs, firstEnabledMode])

  const showInspectionTab = activeModeTab === 'inspection' && inspectionModeEnabled
  const showSolutionTab = activeModeTab === 'solution' && solutionModeEnabled

  return (
    <aside className="wm-right wm-panel">
      <ModeTabs tabs={availableModeTabs} activeModeTab={activeModeTab} setActiveModeTab={setActiveModeTab} />
      {!inspectionModeEnabled && !solutionModeEnabled ? <div className="right-mode-empty">Ative Inspecao ou Solucao para abrir os controles deste painel.</div> : null}
      {showSolutionTab ? <SolutionTab solutionCurveVisibility={solutionCurveVisibility} setSolutionCurveVisibility={setSolutionCurveVisibility} /> : null}
      {showInspectionTab ? (
        <InspectionTab
          slowPoint={slowPoint}
          fastPoint={fastPoint}
          hoveredInspectionPoint={hoveredInspectionPoint}
          params={params}
          inspectionCurveVisibility={inspectionCurveVisibility}
          setInspectionCurveVisibility={setInspectionCurveVisibility}
        />
      ) : null}
      <ShortcutSection />
    </aside>
  )
}
