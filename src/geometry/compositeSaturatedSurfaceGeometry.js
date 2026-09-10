import * as THREE from 'three'
import { clipTriangleToBox } from './clipTriangleToBox.js'
import { FORWARD_HUGONIOT, BACKWARD_HUGONIOT, normalizeHugoniotDirection } from '../entities/hugoniot/directions'
import {
  sonicImplicitF,
  sonicLeftBranchIndicator,
  sonicLeftImplicitF,
  sonicRightBranchIndicator,
  solveDoubleSonicSegments,
} from '../entities/surfaceImplicit/index.js'
import { buildRarefactionBifoliation, selectLeafFromBifoliation } from '../entities/waves/basicBifoliations'
import { makeSaturatedHugoniotBifoliation } from '../entities/waves/saturatedBifoliation'
import { COMPOSITE, RAREFACTION } from '../config/numerics'
import { physicalZToVisual, visualZToPhysical } from './zCompactification'

function finite(value) {
  return Number.isFinite(value)
}

function normalizePoint(point) {
  if (!point) return null
  const t = point.t ?? point.coords?.[0]
  const Y = point.Y ?? point.coords?.[1] ?? 0
  const z = point.z ?? point.coords?.[2]
  if (![t, Y, z].every(finite)) return null
  return { ...point, t, Y, z, coords: [t, Y, z] }
}

function makeRarefactionParam(segment, view) {
  const clean = (segment ?? []).map(normalizePoint).filter(Boolean)
  if (clean.length < 2) return null
  const tScale = Math.max(1, view.tMax - view.tMin)
  const zScale = Math.max(1, view.zMax - view.zMin)
  const s = [0]
  for (let i = 1; i < clean.length; i += 1) {
    const ds = Math.hypot((clean[i].t - clean[i - 1].t) / tScale, (clean[i].z - clean[i - 1].z) / zScale)
    s.push(s[i - 1] + Math.max(ds, 1e-12))
  }
  const total = s[s.length - 1]
  if (!finite(total) || total <= 1e-12) return null

  const interpolate = (u) => {
    const target = u * total
    let lo = 0
    let hi = s.length - 1
    if (target <= 0) {
      lo = 0
      hi = 1
    } else if (target >= total) {
      lo = s.length - 2
      hi = s.length - 1
    } else {
      while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2)
        if (s[mid] <= target) lo = mid
        else hi = mid
      }
    }
    const denom = Math.max(1e-14, s[hi] - s[lo])
    const alpha = (target - s[lo]) / denom
    const a = clean[lo]
    const b = clean[hi]
    const t = a.t + alpha * (b.t - a.t)
    const z = a.z + alpha * (b.z - a.z)
    return { ...a, t, Y: 0, z, coords: [t, 0, z] }
  }

  return { points: clean, s, total, interpolate }
}

function compositeBounds() {
  return {
    uMin: -Math.max(0, COMPOSITE.U_MARGIN ?? 0),
    uMax: 1 + Math.max(0, COMPOSITE.U_MARGIN ?? 0),
    wMin: -Math.max(0, COMPOSITE.W_MARGIN ?? 0),
    wMax: 1 + Math.max(0, COMPOSITE.W_MARGIN ?? 0),
  }
}

function normalizedPointDistance(a, b, view) {
  if (!a || !b) return Number.POSITIVE_INFINITY
  const tScale = Math.max(1, view.tMax - view.tMin)
  const yScale = Math.max(1, view.yMax - view.yMin)
  const zScale = Math.max(1, view.zMax - view.zMin)
  const dz = view.compactifiedZ ? (physicalZToVisual(a.z) - physicalZToVisual(b.z)) / 2 : (a.z - b.z) / zScale
  return Math.hypot((a.t - b.t) / tScale, (a.Y - b.Y) / yScale, dz)
}


function uniqueSorted(values) {
  const clean = []
  for (const value of values ?? []) {
    if (!finite(value)) continue
    if (value < -1e-9 || value > 1 + 1e-9) continue
    const clamped = Math.min(1, Math.max(0, value))
    if (!clean.some((x) => Math.abs(x - clamped) < 1e-9)) clean.push(clamped)
  }
  clean.sort((a, b) => a - b)
  return clean
}

function limitFocuses(values, maxCount = 10) {
  const clean = uniqueSorted(values)
  if (clean.length <= maxCount) return clean
  const out = []
  for (let i = 0; i < maxCount; i += 1) {
    const index = Math.round((i / Math.max(1, maxCount - 1)) * (clean.length - 1))
    out.push(clean[index])
  }
  return uniqueSorted(out)
}

function makeClusteredUnitGrid(count, focusUnit = 0.5, clusterFraction = 0.45, clusterPower = 2.2) {
  const n = Math.max(2, Math.floor(count ?? 2))
  const uniform = []
  for (let i = 0; i <= n; i += 1) uniform.push(i / n)

  const focus = Math.min(1, Math.max(0, focusUnit))
  const extra = Math.max(8, Math.floor(n * Math.max(0, clusterFraction)))
  const clustered = []
  for (let k = -extra; k <= extra; k += 1) {
    const q = k / Math.max(1, extra)
    const signed = Math.sign(q) * Math.pow(Math.abs(q), Math.max(1.01, clusterPower))
    const radius = q < 0 ? focus : 1 - focus
    clustered.push(focus + signed * radius)
  }

  return uniqueSorted([...uniform, ...clustered, 0, 1])
}

function sonicTargetForDirection(direction) {
  return normalizeHugoniotDirection(direction) === BACKWARD_HUGONIOT
    ? { surface: 'right', branch: 'fast' }
    : { surface: 'left', branch: 'slow' }
}

function sonicValue(point, params, target) {
  if (!point) return null
  const value = target.surface === 'right'
    ? sonicImplicitF(point.Y, point.t, point.z, params)
    : sonicLeftImplicitF(point.Y, point.t, point.z, params)
  return finite(value) ? value : null
}

function sonicBranchMatches(point, params, target) {
  if (!point) return false
  const indicator = target.surface === 'right'
    ? sonicRightBranchIndicator(point.Y, point.t, point.z, params)
    : sonicLeftBranchIndicator(point.Y, point.t, point.z, params)
  if (!finite(indicator)) return false
  return target.branch === 'fast' ? indicator >= -1e-7 : indicator <= 1e-7
}

function doubleSonicZValues(params, view) {
  return solveDoubleSonicSegments(params, view)
    .map((segment) => segment?.[0]?.[2])
    .filter(finite)
}

function makeUGrid(rareParam, count, doubleSonicZs = []) {
  const baseCount = Math.max(2, Math.floor(count ?? 2))
  const candidates = []
  const points = rareParam?.points ?? []
  for (let k = 1; k < points.length; k += 1) {
    const a = points[k - 1]
    const b = points[k]
    if (!a || !b) continue
    const targetZs = [0, ...doubleSonicZs]
    for (const targetZ of targetZs) {
      if (!finite(targetZ)) continue
      if (!((a.z <= targetZ && b.z >= targetZ) || (a.z >= targetZ && b.z <= targetZ))) continue
      const denom = b.z - a.z
      const alpha = Math.abs(denom) < 1e-14 ? 0 : (targetZ - a.z) / denom
      const s0 = (rareParam.s?.[k - 1] ?? 0) + alpha * ((rareParam.s?.[k] ?? 0) - (rareParam.s?.[k - 1] ?? 0))
      const focus = s0 / Math.max(1e-14, rareParam.total ?? 1)
      const fraction = targetZ === 0 ? (COMPOSITE.SATURATED_SURFACE_U_CLUSTER_FRACTION ?? 0.25) : 0.38
      candidates.push(...makeClusteredUnitGrid(baseCount, focus, fraction, 2.0))
    }
  }
  if (candidates.length === 0) return makeClusteredUnitGrid(baseCount, 0.5, 0.0, 2.0)
  return uniqueSorted(candidates)
}

function makeEtaGrid(etaMin, etaMax, count, sonicFocuses = []) {
  const span = Math.max(1e-12, etaMax - etaMin)
  const focus = etaMin <= 0 && etaMax >= 0 ? (0 - etaMin) / span : 0.5
  const baseGrid = makeClusteredUnitGrid(
    count,
    focus,
    COMPOSITE.SATURATED_SURFACE_ETA_CLUSTER_FRACTION ?? 0.65,
    COMPOSITE.SATURATED_SURFACE_ETA_CLUSTER_POWER ?? 2.8,
  )
  const sonicGrid = sonicFocuses.flatMap((sonicFocus) => (
    makeClusteredUnitGrid(Math.max(10, Math.floor(count * 0.22)), sonicFocus, 0.75, 2.0)
  ))
  return uniqueSorted([...baseGrid, ...sonicGrid])
}

function interpolateUnitRoot(a, b) {
  const denom = a.value - b.value
  const alpha = Math.abs(denom) > 1e-14 ? a.value / denom : 0.5
  return Math.max(0, Math.min(1, a.w + alpha * (b.w - a.w)))
}

function collectSonicWFocuses(saturation, uGrid, params, direction) {
  const target = sonicTargetForDirection(direction)
  const focuses = []
  const maxUProbes = 34
  const stride = Math.max(1, Math.floor(uGrid.length / maxUProbes))
  const wSamples = 72

  for (let i = 0; i < uGrid.length; i += stride) {
    let previous = null
    const u = uGrid[i]

    for (let j = 0; j <= wSamples; j += 1) {
      const w = j / wSamples
      const point = normalizePoint(saturation.evaluate(u, w)?.point)
      const value = point && sonicBranchMatches(point, params, target)
        ? sonicValue(point, params, target)
        : null
      const current = finite(value) ? { w, value } : null

      if (previous && current && previous.value * current.value <= 0) {
        focuses.push(interpolateUnitRoot(previous, current))
      }
      if (current && Math.abs(current.value) < 1e-5) focuses.push(current.w)
      previous = current
    }
  }

  return uniqueSorted(focuses)
}

function collectDoubleSonicWFocuses(saturation, uGrid, doubleSonicZs) {
  const focuses = []
  const maxUProbes = 34
  const stride = Math.max(1, Math.floor(uGrid.length / maxUProbes))
  const wSamples = 72

  for (const targetZ of doubleSonicZs) {
    for (let i = 0; i < uGrid.length; i += stride) {
      let previous = null
      const u = uGrid[i]

      for (let j = 0; j <= wSamples; j += 1) {
        const w = j / wSamples
        const point = normalizePoint(saturation.evaluate(u, w)?.point)
        const current = point ? { w, value: point.z - targetZ } : null

        if (previous && current && previous.value * current.value <= 0) {
          focuses.push(interpolateUnitRoot(previous, current))
        }
        if (current && Math.abs(current.value) < 1e-5) focuses.push(current.w)
        previous = current
      }
    }
  }

  return limitFocuses(focuses, 10)
}

function appendValues(target, source) {
  for (let i = 0; i < source.length; i += 1) {
    target.push(source[i])
  }
}

export function buildGeometryForRarefactionSaturationSegment(segment, params, calcView, renderView, direction, resolution) {
  const rareParam = makeRarefactionParam(segment, calcView)
  if (!rareParam) return null

  // Para a VISUALIZAÇÃO da superfície saturada, não usamos a janela larga
  // de busca da composta. Usar etaMin/etaMax muito amplos e depois filtrar
  // por z gera muitos pontos descartados e causa lag ao arrastar os pontos.
  // Aqui o domínio da folha já nasce cortado em z pela janela de desenho
  // recebida do App: view visual + 20%.
  const etaMin = renderView.zMin
  const etaMax = renderView.zMax
  const physicalSaturation = makeSaturatedHugoniotBifoliation({
    rarefactionParam: rareParam,
    params,
    direction,
    etaMin,
    etaMax,
  })
  // Sample the extended leaves uniformly in visual z, preserving the
  // original rarefaction parameter and avoiding sparse physical-z tails.
  const saturation = renderView.compactifiedZ ? {
    evaluate: (u, w) => physicalSaturation.evaluate(u, physicalSaturation.wFromEta(
      visualZToPhysical(-0.9999 + 1.9998 * w),
    )),
  } : physicalSaturation

  const bounds = compositeBounds()
  // A superfície é apenas visual; manter a malha moderada evita lag na cena.
  const uSamples = Math.max(24, Math.min(96, Math.floor((resolution ?? 40) * 1.55)))
  const wSamples = Math.max(28, Math.min(120, Math.floor((resolution ?? 40) * 1.9)))
  const uSpan = bounds.uMax - bounds.uMin
  // const wSpan não é usado na superfície visual: w fica em [0,1].

  // A malha nao deve ser uniforme: perto de eta=0 (isto e, z≈0 na
  // parametrizacao da Hugoniot) a folha muda mais rapido e ficava rarefeita.
  // Mantemos a janela global, mas concentramos linhas de grade ao redor de 0.
  const dsView = { ...renderView, tMin: renderView.tMin - Math.max(1, renderView.tMax - renderView.tMin), tMax: renderView.tMax + Math.max(1, renderView.tMax - renderView.tMin) }
  const doubleSonicZs = doubleSonicZValues(params, dsView)
  const uGrid = makeUGrid(rareParam, uSamples, doubleSonicZs).map((q) => bounds.uMin + q * uSpan)
  const sonicWFocuses = collectSonicWFocuses(saturation, uGrid, params, direction)
  const doubleSonicWFocuses = collectDoubleSonicWFocuses(saturation, uGrid, doubleSonicZs)
  // w deve ficar em [0,1] para eta percorrer exatamente [etaMin, etaMax].
  // A margem W_MARGIN continua sendo usada na extração da CURVA composta,
  // mas não na malha visual da superfície saturada.
  const wGrid = makeEtaGrid(etaMin, etaMax, wSamples, [...sonicWFocuses, ...doubleSonicWFocuses])

  const pointGrid = Array.from({ length: uGrid.length }, () => Array(wGrid.length).fill(null))
  const vertices = []

  for (let i = 0; i < uGrid.length; i += 1) {
    const u = uGrid[i]
    for (let j = 0; j < wGrid.length; j += 1) {
      const w = wGrid[j]
      const obj = saturation.evaluate(u, w)
      const point = normalizePoint(obj?.point)
      if (!point) continue



      pointGrid[i][j] = point
    }
  }

  // Para visualizar a superfície saturada não devemos aplicar o mesmo corte
  // agressivo usado em curvas. A superfície é uma parametrização em (u,w);
  // se filtramos por salto pequeno, muitos quadriláteros válidos desaparecem
  // e o botão do painel parece não fazer nada.
  const maxJump = Math.max(1.5, 8 * (COMPOSITE.MAX_JUMP ?? 0.14))
  const okEdge = (ia, ja, ib, jb) => {
    const a = pointGrid[ia]?.[ja]
    const b = pointGrid[ib]?.[jb]
    return a && b && normalizedPointDistance(a, b, renderView) <= maxJump
  }

  const indices = []
  const tTol = 0.35 * Math.max(1, renderView.tMax - renderView.tMin)
  const yTol = 0.35 * Math.max(1, renderView.yMax - renderView.yMin)
  const min = [renderView.tMin - tTol, renderView.yMin - yTol, physicalZToVisual(renderView.zMin)]
  const max = [renderView.tMax + tTol, renderView.yMax + yTol, physicalZToVisual(renderView.zMax)]
  const vertexCache = new Map()
  const vertexIndex = (point) => {
    const key = point.map(value => value.toPrecision(13)).join(',')
    if (vertexCache.has(key)) return vertexCache.get(key)
    const index = vertices.length / 3
    vertices.push(point[0], point[1], visualZToPhysical(point[2]))
    vertexCache.set(key, index)
    return index
  }
  const appendTriangle = (corners) => {
    if (corners.some(([i, j]) => !pointGrid[i][j])) return
    if (!corners.every(([i, j], k) => {
      const [nextI, nextJ] = corners[(k + 1) % 3]
      return okEdge(i, j, nextI, nextJ)
    })) return
    // Clip in display coordinates so the new boundary follows the rendered
    // triangle, including along compactified z. Never add a closing cap.
    const triangle = corners.map(([i, j]) => {
      const p = pointGrid[i][j]
      return [p.t, p.Y, physicalZToVisual(p.z)]
    })
    const polygon = clipTriangleToBox(triangle, min, max)
    if (polygon.length < 3) return
    const ids = polygon.map(vertexIndex)
    for (let k = 1; k < ids.length - 1; k += 1) {
      if (new Set([ids[0], ids[k], ids[k + 1]]).size === 3) indices.push(ids[0], ids[k], ids[k + 1])
    }
  }
  for (let i = 0; i < uGrid.length - 1; i += 1) {
    for (let j = 0; j < wGrid.length - 1; j += 1) {
      appendTriangle([[i, j], [i + 1, j], [i, j + 1]])
      appendTriangle([[i, j + 1], [i + 1, j], [i + 1, j + 1]])
    }
  }
  if (vertices.length === 0 || indices.length === 0) return null
  return { vertices, indices }
}

export function buildCompositeSaturatedSurfaceGeometry({ fixedState, params, view, resolution = 40, direction = FORWARD_HUGONIOT }) {
  const geometry = new THREE.BufferGeometry()
  if (!fixedState || !params || !view) return geometry

  const normalizedDirection = normalizeHugoniotDirection(direction)
  const branch = normalizedDirection === BACKWARD_HUGONIOT ? 'plus' : 'minus'
  const samples = Math.max(
    RAREFACTION.COMPOSITE_MIN_SAMPLES,
    (resolution ?? 40) * RAREFACTION.COMPOSITE_SAMPLES_PER_RESOLUTION,
  )
  const mathcalR = buildRarefactionBifoliation({ fixedState, params, view, samples, constrainZ: false })
  const leaf = selectLeafFromBifoliation(mathcalR, branch)
  // Não recortar a rarefação antes de saturar: a saturação pode voltar
  // para a janela visual mesmo quando a folha geradora sai do intervalo em z.
  const rareSegments = (leaf?.curve?.segments ?? []).filter((segment) => Array.isArray(segment) && segment.length >= 2)

  const vertices = []
  const indices = []
  const renderView = {
    ...view, compactifiedZ: true,
    zMin: visualZToPhysical(-0.9999), zMax: visualZToPhysical(0.9999),
  }
  for (const segment of rareSegments) {
    const part = buildGeometryForRarefactionSaturationSegment(segment, params, view, renderView, normalizedDirection, resolution)
    if (!part) continue
    const offset = vertices.length / 3
    appendValues(vertices, part.vertices)
    for (let i = 0; i < part.indices.length; i += 1) {
      indices.push(part.indices[i] + offset)
    }
  }

  if (vertices.length === 0 || indices.length === 0) return geometry
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}


