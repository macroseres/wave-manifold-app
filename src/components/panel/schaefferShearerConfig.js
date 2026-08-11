import { defaultView } from '../../config/viewDefaults'

export const parameterPalette = {
  curves: {
    c1: '#a0a3a5',
    c2: '#facc15',
    c3: '#f472b6',
  },
  cases: {
    iv: 'rgba(239, 68, 68, 0.17)',
    iiia: 'rgba(37, 99, 235, 0.17)',
    iiib: 'rgba(124, 58, 237, 0.17)',
    iiic: 'rgba(6, 182, 212, 0.17)',
    iia: 'rgba(219, 39, 119, 0.17)',
    iib: 'rgba(192, 38, 211, 0.17)',
    iic: 'rgba(147, 51, 234, 0.17)',
    ia: 'rgba(249, 115, 22, 0.18)',
    ib: 'rgba(245, 158, 11, 0.18)',
    ic: 'rgba(202, 138, 4, 0.18)',
  },
  caseHighlights: {
    iv: 'rgba(239, 68, 68, 0.42)',
    iiia: 'rgba(37, 99, 235, 0.42)',
    iiib: 'rgba(124, 58, 237, 0.42)',
    iiic: 'rgba(6, 182, 212, 0.42)',
    iia: 'rgba(219, 39, 119, 0.42)',
    iib: 'rgba(192, 38, 211, 0.42)',
    iic: 'rgba(147, 51, 234, 0.42)',
    ia: 'rgba(249, 115, 22, 0.43)',
    ib: 'rgba(245, 158, 11, 0.43)',
    ic: 'rgba(202, 138, 4, 0.43)',
  },
  caseMuted: 'rgba(148, 163, 184, 0.045)',
}

export const parameterPointMeta = {
  label: 'ponto-parametro',
}

export const schaefferShearerCases = [
  { key: 'ia', label: 'I-A' },
  { key: 'ib', label: 'I-B' },
  { key: 'ic', label: 'I-C' },
  { key: 'iia', label: 'II-A' },
  { key: 'iib', label: 'II-B' },
  { key: 'iic', label: 'II-C' },
  { key: 'iiia', label: 'III-A' },
  { key: 'iiib', label: 'III-B' },
  { key: 'iiic', label: 'III-C' },
  { key: 'iv', label: 'IV' },
]

export const defaultSchaefferShearerScales = {
  yScale: 0.6,
  tScale: 3.0,
  zScale: 3.0,
}


export const schaefferShearerCaseDrawingDefaults = {
  iiia: {
    scales: { yScale: 0.6, tScale: 2.5, zScale: 2.5 },
    view: { ...defaultView, tMin: -1.5, tMax: 1.5, zMin: -2, zMax: 2 },
  },
}

export function drawingDefaultForCase(caseKey, preset) {
  const explicit = schaefferShearerCaseDrawingDefaults[caseKey]
  if (explicit) {
    return {
      scales: { ...explicit.scales },
      view: { ...explicit.view },
    }
  }
  return {
    scales: { ...(preset?.scales ?? defaultSchaefferShearerScales) },
    view: { ...(preset?.view ?? defaultView) },
  }
}

export const initialSchaefferShearerCasePresets = {
  iv: {
    params: { b1: 8, b2: 0.2 },
    scales: { ...defaultSchaefferShearerScales },
    view: { ...defaultView },
  },
  iiia: {
    params: { b1: 4, b2: 4 },
    scales: { ...schaefferShearerCaseDrawingDefaults.iiia.scales },
    view: { ...schaefferShearerCaseDrawingDefaults.iiia.view },
  },
  iiib: {
    params: { b1: 2, b2: 4 },
    scales: { ...defaultSchaefferShearerScales },
    view: { ...defaultView },
  },
  iiic: {
    params: { b1: 0.5, b2: 1 },
    scales: { ...defaultSchaefferShearerScales },
    view: { ...defaultView },
  },
  iia: {
    params: { b1: -0.5, b2: 1 },
    scales: { ...defaultSchaefferShearerScales },
    view: { ...defaultView },
  },
  iib: {
    params: { b1: -2.5, b2: 3 },
    scales: { ...defaultSchaefferShearerScales },
    view: { ...defaultView },
  },
  iic: {
    params: { b1: -4.5, b2: 2 },
    scales: { ...defaultSchaefferShearerScales },
    view: { ...defaultView },
  },
  ia: {
    params: { b1: -1.5, b2: 0.5 },
    scales: { ...defaultSchaefferShearerScales },
    view: { ...defaultView },
  },
  ib: {
    params: { b1: -2, b2: 1 },
    scales: { ...defaultSchaefferShearerScales },
    view: { ...defaultView },
  },
  ic: {
    params: { b1: -3, b2: 0.5 },
    scales: { ...defaultSchaefferShearerScales },
    view: { ...defaultView },
  },
}

export const initialParameterWindow = {
  b1Min: -5,
  b1Max: 10,
  b2Min: -5,
  b2Max: 5,
}

export const parameterPointBounds = {
  b1Min: -10,
  b1Max: 10,
  b2Min: -4,
  b2Max: 4,
}

export function c1Limit(b1) {
  return b1 >= 1 ? 2 * Math.sqrt(Math.max(0, b1 - 1)) : Number.NaN
}

export function c2Limit(b1) {
  return b1 < -1 ? Math.sqrt(Math.max(0, -4 / (b1 + 1))) : Number.NaN
}

export function c3Limit(b1) {
  if (Math.abs(b1 + 1) < 1e-10) return Number.NaN
  const value = ((b1 - 1) * (b1 + 2) * (b1 + 2)) / (b1 + 1)
  return value >= 0 ? Math.sqrt(value) : Number.NaN
}

export function clipInterval(minValue, maxValue, bounds = parameterPointBounds) {
  const min = Math.max(bounds.b2Min, minValue)
  const max = Math.min(bounds.b2Max, maxValue)
  return max >= min ? [min, max] : null
}

export function caseIntervalsAtB1(caseKey, b1, bounds = parameterPointBounds) {
  const intervals = []
  const addSymmetricExterior = (limit) => {
    const upper = clipInterval(limit, bounds.b2Max, bounds)
    const lower = clipInterval(bounds.b2Min, -limit, bounds)
    if (lower) intervals.push(lower)
    if (upper) intervals.push(upper)
  }
  const addSymmetricInterior = (limit) => {
    const interval = clipInterval(-limit, limit, bounds)
    if (interval) intervals.push(interval)
  }
  const addSymmetricBand = (inner, outer) => {
    const upper = clipInterval(inner, outer, bounds)
    const lower = clipInterval(-outer, -inner, bounds)
    if (lower) intervals.push(lower)
    if (upper) intervals.push(upper)
  }

  if (caseKey === 'iv' && b1 > 1) {
    const limit = c1Limit(b1)
    if (Number.isFinite(limit)) addSymmetricInterior(limit)
  } else if (caseKey === 'iiia' && b1 > 1) {
    const inner = c1Limit(b1)
    const outer = c3Limit(b1)
    if (Number.isFinite(inner) && Number.isFinite(outer) && outer >= inner) addSymmetricBand(inner, outer)
  } else if (caseKey === 'iiib' && b1 > 1) {
    const limit = c3Limit(b1)
    if (Number.isFinite(limit)) addSymmetricExterior(limit)
  } else if (caseKey === 'iiic' && b1 > 0 && b1 < 1) {
    const interval = clipInterval(bounds.b2Min, bounds.b2Max, bounds)
    if (interval) intervals.push(interval)
  } else if (caseKey === 'iia' && b1 > -1 && b1 < 0) {
    const interval = clipInterval(bounds.b2Min, bounds.b2Max, bounds)
    if (interval) intervals.push(interval)
  } else if (caseKey === 'iib' && b1 < -1) {
    const limit = Math.max(c2Limit(b1), c3Limit(b1))
    if (Number.isFinite(limit)) addSymmetricExterior(limit)
  } else if (caseKey === 'iic' && b1 < -1) {
    const inner = c2Limit(b1)
    const outer = c3Limit(b1)
    if (Number.isFinite(inner) && Number.isFinite(outer) && outer >= inner) addSymmetricBand(inner, outer)
  } else if (caseKey === 'ia' && b1 > -2 && b1 < -1) {
    const limit = Math.min(c2Limit(b1), c3Limit(b1))
    if (Number.isFinite(limit)) addSymmetricInterior(limit)
  } else if (caseKey === 'ib' && b1 < -1) {
    const inner = c3Limit(b1)
    const outer = c2Limit(b1)
    if (Number.isFinite(inner) && Number.isFinite(outer) && outer >= inner) addSymmetricBand(inner, outer)
  } else if (caseKey === 'ic' && b1 < -2) {
    const limit = Math.min(c2Limit(b1), c3Limit(b1))
    if (Number.isFinite(limit)) addSymmetricInterior(limit)
  }

  return intervals
}

export function constrainPointToCase(point, caseKey, bounds = parameterPointBounds) {
  const target = {
    b1: Math.max(bounds.b1Min, Math.min(bounds.b1Max, point.b1)),
    b2: Math.max(bounds.b2Min, Math.min(bounds.b2Max, point.b2)),
  }
  const currentIntervals = caseIntervalsAtB1(caseKey, target.b1, bounds)
  for (const [min, max] of currentIntervals) {
    if (target.b2 >= min && target.b2 <= max) return target
  }

  let best = null
  const candidates = new Set([
    bounds.b1Min,
    bounds.b1Max,
    target.b1,
    -2,
    -1,
    0,
    1,
  ])
  const samples = 720
  for (let i = 0; i <= samples; i += 1) {
    candidates.add(bounds.b1Min + (i * (bounds.b1Max - bounds.b1Min)) / samples)
  }

  for (const candidateB1 of candidates) {
    const b1 = Math.max(bounds.b1Min, Math.min(bounds.b1Max, candidateB1))
    for (const [min, max] of caseIntervalsAtB1(caseKey, b1, bounds)) {
      const b2 = Math.max(min, Math.min(max, target.b2))
      const score = ((b1 - target.b1) / Math.max(1e-6, bounds.b1Max - bounds.b1Min)) ** 2
        + ((b2 - target.b2) / Math.max(1e-6, bounds.b2Max - bounds.b2Min)) ** 2
      if (!best || score < best.score) best = { b1, b2, score }
    }
  }

  return best ? { b1: best.b1, b2: best.b2 } : target
}
