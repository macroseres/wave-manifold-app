
import { projectPointMinus, projectPointPlus } from '../entities/geometry/stateProjections.js'
import { solveSonicBranchSeparatorPoint } from '../entities/surfaceImplicit/sonic.js'
import { hugoniotMinusImplicit } from './hugoniotStateImplicit.js'
import { buildParametricHugoniot } from './hugoniotStateParametric.js'
import { coincidenceStateImplicit } from './coincidenceStateImplicit.js'
import { visualZToPhysical } from './zCompactification.js'

const CHARACTERISTIC_Z_HAT_MARGIN = 1e-4

export { hugoniotMinusImplicit } from './hugoniotStateImplicit.js'

export function inflectionImplicitJ(u, v, params) {
  const b1 = params?.b1
  const b2 = params?.b2
  const c = params?.c
  if (![u, v, b1, b2, c].every(Number.isFinite)) return Number.NaN

  const b12 = b1 * b1
  const b13 = b12 * b1
  const b22 = b2 * b2
  const b24 = b22 * b22
  const c2 = c * c
  const c3 = c2 * c

  return (
    b13 * (b1 + 1) * b2 * u * u * u
    + 3 * b12 * (b1 + 1) * (b22 + 1) * u * u * v
    + b12 * (b1 + 1) * c * u * u
    + 3 * b1 * b2 * ((b1 + 1) * b22 + 3 * b1 + 4) * u * v * v
    + b1 * b2 * (5 * b1 + 9) * c * u * v
    + b1 * b2 * c2 * u
    + (b12 + (b1 + 1) * b24 + (6 * b1 + 8) * b22 + 8 * b1 + 16) * v * v * v
    + (b12 + 4 * b1 * b22 + 10 * b1 + 6 * b22 + 24) * c * v * v
    + (2 * b1 + 9) * c2 * v
    + c3
  )
}

export function interpolateImplicitState(a, b) {
  const denom = a.value - b.value
  const alpha = Number.isFinite(denom) && Math.abs(denom) > 1e-14
    ? Math.max(0, Math.min(1, a.value / denom))
    : 0.5
  return {
    state: {
      u: a.u + alpha * (b.u - a.u),
      v: a.v + alpha * (b.v - a.v),
    },
    manifold: { t: 0, Y: 0, z: 0, branch: 'implicit-inflection' },
  }
}

function buildImplicitStateSegments(bounds, resolution, evaluate) {
  if (!bounds || typeof evaluate !== 'function') return []
  const { uMin, uMax, vMin, vMax } = bounds
  if (![uMin, uMax, vMin, vMax].every(Number.isFinite) || uMax <= uMin || vMax <= vMin) return []

  const du = (uMax - uMin) / resolution
  const dv = (vMax - vMin) / resolution
  const grid = Array.from({ length: resolution + 1 }, (_, i) => {
    const u = uMin + i * du
    return Array.from({ length: resolution + 1 }, (_, j) => {
      const v = vMin + j * dv
      return { u, v, value: evaluate(u, v) }
    })
  })

  const segments = []
  for (let i = 0; i < resolution; i += 1) {
    for (let j = 0; j < resolution; j += 1) {
      const p00 = grid[i][j]
      const p10 = grid[i + 1][j]
      const p11 = grid[i + 1][j + 1]
      const p01 = grid[i][j + 1]
      const corners = [p00, p10, p11, p01]
      if (!corners.every((p) => Number.isFinite(p.value))) continue

      const hits = []
      const edges = [[p00, p10], [p10, p11], [p11, p01], [p01, p00]]
      for (const [a, b] of edges) {
        if (Math.abs(a.value) < 1e-12) hits.push({ state: { u: a.u, v: a.v }, manifold: { t: 0, Y: 0, z: 0, branch: 'implicit-inflection' } })
        if (a.value * b.value < 0) hits.push(interpolateImplicitState(a, b))
      }

      const unique = []
      for (const h of hits) {
        if (!unique.some((q) => Math.hypot(q.state.u - h.state.u, q.state.v - h.state.v) < 1e-8)) unique.push(h)
      }
      if (unique.length === 2) segments.push(unique)
      else if (unique.length === 4) {
        segments.push([unique[0], unique[1]])
        segments.push([unique[2], unique[3]])
      }
    }
  }
  return segments
}

export function buildImplicitInflectionStateSegments(bounds, params, resolution = 180) {
  if (!params) return []
  return buildImplicitStateSegments(bounds, resolution, (u, v) => inflectionImplicitJ(u, v, params))
}

export function buildImplicitCoincidenceStateSegments(bounds, params, resolution = 220) {
  if (!params) return []
  return buildImplicitStateSegments(bounds, resolution, (u, v) => coincidenceStateImplicit(u, v, params))
}

export function buildImplicitHugoniotMinusStateSegments(bounds, fixedLeftState, params, resolution = 220) {
  if (!fixedLeftState || !params) return []
  const parametric = buildParametricHugoniot(bounds, fixedLeftState, params, resolution)
  if (parametric) return parametric
  return buildImplicitStateSegments(
    bounds,
    resolution,
    (u, v) => hugoniotMinusImplicit(u, v, fixedLeftState, params),
  )
}

function buildSonicSeparatorStateProjection(bounds, params, side, projectionSide, samples) {
  if (!bounds || !params) return []
  const clipBounds = expandedStateBounds(bounds, 0.06)
  const span = Math.max(1, bounds.uMax - bounds.uMin, bounds.vMax - bounds.vMin)
  const maxJump = 0.2 * span
  const segments = []
  let current = []
  let previous = null

  const flush = () => {
    if (current.length >= 2) segments.push(current)
    current = []
  }

  for (let i = 0; i < samples; i += 1) {
    const fraction = i / Math.max(1, samples - 1)
    const zHat = -1 + CHARACTERISTIC_Z_HAT_MARGIN
      + fraction * (2 - 2 * CHARACTERISTIC_Z_HAT_MARGIN)
    const z = visualZToPhysical(zHat)
    const manifold = solveSonicBranchSeparatorPoint(side, z, params)
    const projected = manifold
      ? projectionSide === 'plus' ? projectPointPlus(manifold, params) : projectPointMinus(manifold, params)
      : null
    if (!projected || !Number.isFinite(projected.u) || !Number.isFinite(projected.v)) {
      flush(); previous = null; continue
    }

    const sample = { manifold, state: { u: projected.u, v: projected.v } }
    const inside = stateInsideBounds(sample.state, clipBounds)
    const previousInside = previous ? stateInsideBounds(previous.state, clipBounds) : false
    if (!inside) {
      if (current.length && previousInside) current.push(sample)
      flush(); previous = sample; continue
    }

    if (!current.length && previous && !previousInside) current.push(previous)
    const last = current[current.length - 1]
    if (last && Math.hypot(sample.state.u - last.state.u, sample.state.v - last.state.v) > maxJump) {
      flush()
    }
    current.push(sample)
    previous = sample
  }
  flush()
  return segments
}

export function buildSonicRightSeparatorMinusProjection(bounds, params, samples = 3200) {
  return buildSonicSeparatorStateProjection(bounds, params, 'right', 'minus', samples)
}

export function buildSonicRightSeparatorPlusProjection(bounds, params, samples = 3200) {
  return buildSonicSeparatorStateProjection(bounds, params, 'right', 'plus', samples)
}

export function buildSonicLeftSeparatorPlusProjection(bounds, params, samples = 3200) {
  return buildSonicSeparatorStateProjection(bounds, params, 'left', 'plus', samples)
}

export function buildSonicLeftSeparatorMinusProjection(bounds, params, samples = 3200) {
  return buildSonicSeparatorStateProjection(bounds, params, 'left', 'minus', samples)
}

export function buildCharacteristicProjectionSamples(view, params, branch, samplesT = 181, samplesZ = 181) {
  const win = branchCharacteristicWindow(view, branch)
  if (!win.valid) return []

  const points = []
  const addProjectedPoint = (t, z) => {
    const manifold = { t, Y: 0, z, branch }
    const state = projectPointMinus(manifold, params)
    if (state && Number.isFinite(state.u) && Number.isFinite(state.v)) {
      points.push({ manifold, state })
    }
  }

  // Amostragem do domínio inteiro da característica no view atual.
  // Os limites do espaço de estados devem acompanhar exatamente os limites
  // configurados para o caso Schaeffer selecionado.
  for (let i = 0; i < samplesT; i += 1) {
    const t = win.tMin + (i / Math.max(1, samplesT - 1)) * (win.tMax - win.tMin)
    for (let j = 0; j < samplesZ; j += 1) {
      const z = win.zMin + (j / Math.max(1, samplesZ - 1)) * (win.zMax - win.zMin)
      addProjectedPoint(t, z)
    }
  }

  // Reforço nas quatro bordas. A imagem projetada pode ter extremos sobre
  // t=tMin, t=tMax, z=zMin ou z=zMax; por isso a caixa 2D não pode depender
  // apenas de pontos internos ou de uma amostra antiga.
  const edgeSteps = Math.max(samplesT, samplesZ, 241)
  for (let i = 0; i <= edgeSteps; i += 1) {
    const a = i / Math.max(1, edgeSteps)
    const t = win.tMin + a * (win.tMax - win.tMin)
    const z = win.zMin + a * (win.zMax - win.zMin)
    addProjectedPoint(win.tMin, z)
    addProjectedPoint(win.tMax, z)
    addProjectedPoint(t, win.zMin)
    addProjectedPoint(t, win.zMax)
  }

  return points
}

export function expandedStateBounds(bounds, factor = 0.04) {
  if (!bounds) return null
  const uSpan = Math.max(1e-9, bounds.uMax - bounds.uMin)
  const vSpan = Math.max(1e-9, bounds.vMax - bounds.vMin)
  return {
    uMin: bounds.uMin - factor * uSpan,
    uMax: bounds.uMax + factor * uSpan,
    vMin: bounds.vMin - factor * vSpan,
    vMax: bounds.vMax + factor * vSpan,
  }
}

export function stateInsideBounds(state, bounds) {
  if (!state || !bounds) return true
  return (
    state.u >= bounds.uMin && state.u <= bounds.uMax
    && state.v >= bounds.vMin && state.v <= bounds.vMax
  )
}

export function hysZSearchWindow(view, bounds) {
  const viewRadius = Math.max(
    1,
    Math.abs(view?.zMin ?? 0),
    Math.abs(view?.zMax ?? 0),
  )
  const stateRadius = bounds
    ? Math.max(
        1,
        Math.abs(bounds.uMin),
        Math.abs(bounds.uMax),
        Math.abs(bounds.vMin),
        Math.abs(bounds.vMax),
        bounds.uMax - bounds.uMin,
        bounds.vMax - bounds.vMin,
      )
    : 1

  const radius = Math.min(80, Math.max(12, 6 * viewRadius, 4 * stateRadius))
  return { zMin: -radius, zMax: radius }
}

export function branchCharacteristicWindow(view, branch) {
  // A coincidência tau=0 pertence ao fecho dos dois ramos e é a fronteira
  // comum exata entre eles. Não abrimos mais um intervalo artificial em zero.
  const tMin = branch === 'fast' ? view.tMin : Math.max(0, view.tMin)
  const tMax = branch === 'fast' ? Math.min(0, view.tMax) : view.tMax
  return {
    tMin,
    tMax,
    zMin: view.zMin,
    zMax: view.zMax,
    zHatMin: -1,
    zHatMax: 1,
    valid: tMax > tMin && view.zMax > view.zMin,
  }
}

// A fronteira compactificada inclui z-hat = +/-1, que corresponde a z infinito.
// Para avaliá-la numericamente usamos pontos imediatamente interiores, mas o
// parâmetro continua percorrendo uniformemente todo o intervalo [-1, 1].
export function characteristicBoundaryZAtFraction(window, fraction) {
  const a = clamp(fraction, 0, 1)
  const zHat = window.zHatMin + a * (window.zHatMax - window.zHatMin)
  const safeZHat = clamp(
    zHat,
    window.zHatMin + CHARACTERISTIC_Z_HAT_MARGIN,
    window.zHatMax - CHARACTERISTIC_Z_HAT_MARGIN,
  )
  return visualZToPhysical(safeZHat)
}

export function stateFromScreenPoint(pointer, bounds) {
  if (!pointer?.rect) return null
  return {
    u: bounds.uMin + (pointer.x / Math.max(1e-12, pointer.rect.width)) * (bounds.uMax - bounds.uMin),
    v: bounds.vMax - (pointer.y / Math.max(1e-12, pointer.rect.height)) * (bounds.vMax - bounds.vMin),
  }
}

export function clamp(value, minValue, maxValue) {
  return Math.max(minValue, Math.min(maxValue, value))
}

export function projectedStateForTZ(t, z, params, branch) {
  const manifold = { t, Y: 0, z, branch }
  const state = projectPointMinus(manifold, params)
  return state && Number.isFinite(state.u) && Number.isFinite(state.v)
    ? { manifold, state }
    : null
}

export function refineCharacteristicProjectionFromState(target, view, params, branch, metricBounds = null) {
  const win = branchCharacteristicWindow(view, branch)
  if (!win.valid || !target) return null

  const { b1, b2 } = params
  const uScale = Math.max(1e-9, metricBounds?.uMax - metricBounds?.uMin || 0, Math.abs(target.u), 1)
  const vScale = Math.max(1e-9, metricBounds?.vMax - metricBounds?.vMin || 0, Math.abs(target.v), 1)

  const tFromZ = (z) => {
    const eq = projectPointMinus({ t: 0, Y: 0, z, branch }, params)
    if (!eq) return (win.tMin + win.tMax) / 2
    const a = 1 + b2 * z - z * z
    const bv = -b1 * z
    const au = a / uScale
    const av = bv / vScale
    const denom = au * au + av * av
    let t = (win.tMin + win.tMax) / 2
    if (denom >= 1e-18) {
      t = (au * ((target.u - eq.u) / uScale) + av * ((target.v - eq.v) / vScale)) / denom
    }
    return clamp(t, win.tMin, win.tMax)
  }

  const scoreAtZHat = (zHat) => {
    const z = visualZToPhysical(clamp(
      zHat,
      win.zHatMin + CHARACTERISTIC_Z_HAT_MARGIN,
      win.zHatMax - CHARACTERISTIC_Z_HAT_MARGIN,
    ))
    const t = tFromZ(z)
    const projected = projectedStateForTZ(t, z, params, branch)
    if (!projected) return { score: Number.POSITIVE_INFINITY, t, z, zHat, projected: null }
    const du = (projected.state.u - target.u) / uScale
    const dv = (projected.state.v - target.v) / vScale
    return { score: du * du + dv * dv, t, z, zHat, projected }
  }

  // O desenho da fronteira usa z-hat em [-1, 1]; o arrasto deve procurar no
  // mesmo domínio. Procurar linearmente em z físico deixava inacessíveis as
  // regiões visualmente presentes fora dos antigos zMin/zMax.
  const coarse = 240
  const coarseCandidates = []
  for (let i = 0; i <= coarse; i += 1) {
    const zHat = win.zHatMin + (i / coarse) * (win.zHatMax - win.zHatMin)
    coarseCandidates.push(scoreAtZHat(zHat))
  }

  let best = coarseCandidates.reduce((current, candidate) => (
    !current || candidate.score < current.score ? candidate : current
  ), null)
  const localMinima = coarseCandidates
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate, index }) => (
      index === 0
      || index === coarse
      || (candidate.score <= coarseCandidates[index - 1].score
        && candidate.score <= coarseCandidates[index + 1].score)
    ))
    .sort((a, b) => a.candidate.score - b.candidate.score)
    .slice(0, 8)

  const zHatStep = (win.zHatMax - win.zHatMin) / coarse
  for (const { candidate } of localMinima) {
    let left = Math.max(win.zHatMin, candidate.zHat - zHatStep)
    let right = Math.min(win.zHatMax, candidate.zHat + zHatStep)
    for (let k = 0; k < 30; k += 1) {
      const m1 = left + (right - left) / 3
      const m2 = right - (right - left) / 3
      if (scoreAtZHat(m1).score <= scoreAtZHat(m2).score) right = m2
      else left = m1
    }
    const refined = scoreAtZHat((left + right) / 2)
    if (!best || refined.score < best.score) best = refined
  }

  return best?.projected ?? null
}

export function projectionBounds(samples = []) {
  const values = []

  for (const sample of samples) {
    const state = sample?.state
    if (state && Number.isFinite(state.u) && Number.isFinite(state.v)) {
      values.push({ u: state.u, v: state.v })
    }
  }

  if (!values.length) {
    return { uMin: -1, uMax: 1, vMin: -1, vMax: 1 }
  }

  let uMin = Number.POSITIVE_INFINITY
  let uMax = Number.NEGATIVE_INFINITY
  let vMin = Number.POSITIVE_INFINITY
  let vMax = Number.NEGATIVE_INFINITY

  for (const { u, v } of values) {
    uMin = Math.min(uMin, u)
    uMax = Math.max(uMax, u)
    vMin = Math.min(vMin, v)
    vMax = Math.max(vMax, v)
  }

  // O espaço de estados deve ser derivado apenas da imagem projetada
  // do domínio atual da característica. Não incluímos padding nem pontos
  // selecionados, para que os limites fiquem sincronizados com a variedade.
  if (uMax - uMin < 1e-9) {
    uMin -= 0.5
    uMax += 0.5
  }
  if (vMax - vMin < 1e-9) {
    vMin -= 0.5
    vMax += 0.5
  }

  return { uMin, uMax, vMin, vMax }
}
