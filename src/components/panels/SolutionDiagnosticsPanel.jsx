import React from 'react'

export default function SolutionDiagnosticsPanel({
  diagnostics = [],
  diagnosticLabel,
  formatDiagnosticSpeed,
  formatDiagnosticState,
}) {
  if (!diagnostics.length) return null
  return (
    <div className="solution-diagnostics-panel">
      {diagnostics.map((item, index) => (
        <div className="solution-diagnostic-row" key={`${item.branch}-${item.family}-${item.locality}-${index}`}>
          <strong>{diagnosticLabel(item)}</strong>
          <span>{`s: ${formatDiagnosticSpeed(item.initialSpeed)} -> ${formatDiagnosticSpeed(item.finalSpeed)}`}</span>
          <span>{`sônica: ${item.sonicTarget ?? 'n/a'}`}</span>
          <span>{formatDiagnosticState(item)}</span>
        </div>
      ))}
    </div>
  )
}
