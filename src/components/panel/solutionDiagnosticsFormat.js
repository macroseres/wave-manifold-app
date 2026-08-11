export function formatDiagnosticSpeed(value) {
  return Number.isFinite(value) ? value.toFixed(4) : 'n/a'
}

export function formatDiagnosticState(item, formatNumber) {
  const state = item?.state
  if (!state) return item?.stateRole ?? 'n/a'
  const u = item.stateRole === 'U_+' ? state.uPlus : state.uMinus
  const v = item.stateRole === 'U_+' ? state.vPlus : state.vMinus
  if (!Number.isFinite(u) || !Number.isFinite(v)) return item.stateRole ?? 'n/a'
  return `${item.stateRole}=(${formatNumber(u)}, ${formatNumber(v)})`
}

export function diagnosticLabel(item) {
  const family = {
    rarefaction: 'Rarefação',
    composite: 'Composta',
    shock: 'Choque',
  }[item?.family] ?? item?.family ?? 'Peça'
  const locality = item?.locality === 'nonlocal' ? 'não-local' : 'local'
  const branch = item?.branch === 'reflected' ? 'rápida refletida' : item?.branch === 'fast' ? 'rápida' : 'lenta'
  return `${family} ${branch} (${locality})`
}
