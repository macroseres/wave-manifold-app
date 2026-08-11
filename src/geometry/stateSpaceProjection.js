import { solveInflectionSegments } from '../entities/inflection/index.js'
import { solveRightHysteresisPoint } from '../entities/hysteresis/index.js'
import { projectPointMinus, projectPointPlus } from '../entities/geometry/stateProjections.js'

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

export function buildImplicitInflectionStateSegments(bounds, params, resolution = 180) {
  if (!bounds || !params) return []
  const { uMin, uMax, vMin, vMax } = bounds
  if (![uMin, uMax, vMin, vMax].every(Number.isFinite) || uMax <= uMin || vMax <= vMin) return []

  const du = (uMax - uMin) / resolution
  const dv = (vMax - vMin) / resolution
  const grid = Array.from({ length: resolution + 1 }, (_, i) => {
    const u = uMin + i * du
    return Array.from({ length: resolution + 1 }, (_, j) => {
      const v = vMin + j * dv
      return { u, v, value: inflectionImplicitJ(u, v, params) }
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


export function buildInflectionProjectionSegments(view, params, branch) {
  const segments3d = solveInflectionSegments(params, view, 560, branch)
  return segments3d
    .map((segment) => segment
      .map(([t, Y, z]) => {
        const manifold = { t, Y: Y ?? 0, z, branch }
        const state = projectPointMinus(manifold, params)
        return state && Number.isFinite(state.u) && Number.isFinite(state.v)
          ? { manifold, state }
          : null
      })
      .filter(Boolean))
    .filter((segment) => segment.length >= 2)
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

export function buildHysPlusProjectionSegments(view, params, side = 'minus', bounds = null, samples = 5200) {
  if (!view || !params) return []

  const zWindow = hysZSearchWindow(view, bounds)
  if (!Number.isFinite(zWindow.zMin) || !Number.isFinite(zWindow.zMax) || zWindow.zMax <= zWindow.zMin) return []

  const clipBounds = expandedStateBounds(bounds, 0.06)
  const segments = []
  let current = []
  let previous = null
  const maxJump = 0.22 * Math.max(
    1,
    Math.abs(bounds?.uMax - bounds?.uMin || 0),
    Math.abs(bounds?.vMax - bounds?.vMin || 0),
  )

  const flush = () => {
    if (current.length >= 2) segments.push(current)
    current = []
  }

  for (let i = 0; i < samples; i += 1) {
    const z = zWindow.zMin + (i / Math.max(1, samples - 1)) * (zWindow.zMax - zWindow.zMin)
    const manifold = solveRightHysteresisPoint(z, params)
    if (!manifold) { flush(); previous = null; continue }

    const projected = side === 'plus'
      ? projectPointPlus(manifold, params)
      : projectPointMinus(manifold, params)
    const u = side === 'plus' ? projected?.uPlus : projected?.uMinus
    const v = side === 'plus' ? projected?.vPlus : projected?.vMinus
    if (!Number.isFinite(u) || !Number.isFinite(v) || Math.abs(u) > 1e6 || Math.abs(v) > 1e6) {
      flush(); previous = null; continue
    }

    const sample = { manifold: { ...manifold, branch: `hys-plus-${side}` }, state: { u, v } }
    const inside = stateInsideBounds(sample.state, clipBounds)
    const previousInside = previous ? stateInsideBounds(previous.state, clipBounds) : false

    if (!inside) {
      // Se estamos saindo da janela, guardamos o primeiro ponto externo.
      // Assim o traço é cortado pelo próprio canvas exatamente na fronteira,
      // em vez de parar antes dela.
      if (current.length && previousInside) current.push(sample)
      flush()
      previous = sample
      continue
    }

    if (!current.length && previous && !previousInside) current.push(previous)

    const last = current[current.length - 1]
    if (last) {
      const jump = Math.hypot(sample.state.u - last.state.u, sample.state.v - last.state.v)
      if (jump > maxJump) {
        flush()
        if (previous && !previousInside) current.push(previous)
      }
    }
    current.push(sample)
    previous = sample
  }
  flush()
  return segments
}

export function branchCharacteristicWindow(view, branch) {
  const zeroTauGap = Math.max(1e-5, 0.001 * Math.max(1, view.tMax - view.tMin))
  const tMin = branch === 'fast' ? view.tMin : Math.max(zeroTauGap, view.tMin)
  const tMax = branch === 'fast' ? Math.min(-zeroTauGap, view.tMax) : view.tMax
  return { tMin, tMax, zMin: view.zMin, zMax: view.zMax, valid: tMax > tMin && view.zMax > view.zMin }
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

export function refineCharacteristicProjectionFromState(target, view, params, branch) {
  const win = branchCharacteristicWindow(view, branch)
  if (!win.valid || !target) return null

  const { b1, b2 } = params
  const uScale = Math.max(1e-9, Math.abs(target.u), Math.abs(win.zMax - win.zMin))
  const vScale = Math.max(1e-9, Math.abs(target.v), Math.abs(win.zMax - win.zMin))

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

  const scoreAtZ = (z) => {
    const t = tFromZ(z)
    const projected = projectedStateForTZ(t, z, params, branch)
    if (!projected) return { score: Number.POSITIVE_INFINITY, t, z, projected: null }
    const du = (projected.state.u - target.u) / uScale
    const dv = (projected.state.v - target.v) / vScale
    return { score: du * du + dv * dv, t, z, projected }
  }

  let best = null
  const coarse = 80
  for (let i = 0; i <= coarse; i += 1) {
    const z = win.zMin + (i / coarse) * (win.zMax - win.zMin)
    const candidate = scoreAtZ(z)
    if (!best || candidate.score < best.score) best = candidate
  }

  let left = Math.max(win.zMin, best.z - (win.zMax - win.zMin) / coarse)
  let right = Math.min(win.zMax, best.z + (win.zMax - win.zMin) / coarse)
  for (let k = 0; k < 28; k += 1) {
    const m1 = left + (right - left) / 3
    const m2 = right - (right - left) / 3
    if (scoreAtZ(m1).score <= scoreAtZ(m2).score) right = m2
    else left = m1
  }

  const refined = scoreAtZ((left + right) / 2)
  return refined.projected ? refined.projected : best?.projected
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
