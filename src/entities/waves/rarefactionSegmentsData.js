import { BACKWARD_HUGONIOT, normalizeHugoniotDirection } from '../hugoniot/directions.js'
import { buildRarefactionBifoliation, selectLeafFromBifoliation } from './basicBifoliations.js'

function coordsOf(point) {
  if (Array.isArray(point)) return point
  if (Array.isArray(point?.coords)) return point.coords
  if ([point?.t, point?.Y, point?.z].every(Number.isFinite)) return [point.t, point.Y, point.z]
  return null
}

function normalizedDistanceToFixed(point, fixedState, view) {
  const c = coordsOf(point)
  if (!c || !fixedState) return Number.POSITIVE_INFINITY
  const tauScale = Math.max(1e-6, Math.abs((view?.tMax ?? 1) - (view?.tMin ?? 0)))
  const zScale = Math.max(1e-6, Math.abs((view?.zMax ?? 1) - (view?.zMin ?? 0)))
  const yScale = Math.max(1e-6, Math.abs((view?.yMax ?? 1) - (view?.yMin ?? 0)))
  const t0 = fixedState.t
  const y0 = Number.isFinite(fixedState.Y) ? fixedState.Y : 0
  const z0 = fixedState.z
  if (![t0, y0, z0].every(Number.isFinite)) return Number.POSITIVE_INFINITY
  return Math.hypot((c[0] - t0) / tauScale, (c[1] - y0) / yScale, (c[2] - z0) / zScale)
}

function pointFromFixedState(fixedState, template = null) {
  const t = fixedState?.t
  const Y = Number.isFinite(fixedState?.Y) ? fixedState.Y : 0
  const z = fixedState?.z
  if (![t, Y, z].every(Number.isFinite)) return null
  return { ...(template ?? {}), t, Y, z, coords: [t, Y, z], isClickedRarefactionAnchor: true }
}

function snapAndSelectClickedRarefactionComponent(segments, fixedState, view) {
  if (!Array.isArray(segments) || !segments.length || !fixedState) return segments ?? []

  const ranked = segments
    .map((segment, segmentIndex) => {
      let bestIndex = -1
      let bestDistance = Number.POSITIVE_INFINITY
      for (let i = 0; i < segment.length; i += 1) {
        const distance = normalizedDistanceToFixed(segment[i], fixedState, view)
        if (distance < bestDistance) {
          bestDistance = distance
          bestIndex = i
        }
      }
      return { segment, segmentIndex, bestIndex, bestDistance }
    })
    .filter((item) => item.bestIndex >= 0)
    .sort((a, b) => a.bestDistance - b.bestDistance)

  const best = ranked[0]
  if (!best) return segments

  // A curva visual \mathcal R^±(U_L/U_R) é a folha que passa pelo ponto
  // clicado.  Arcos não locais usam outra semente e são desenhados no modo
  // solução; eles não podem deslocar esta curva de referência.
  const anchor = pointFromFixedState(fixedState, best.segment[best.bestIndex])
  if (!anchor) return segments

  const snapped = best.segment.map((point, index) => (index === best.bestIndex ? anchor : point))

  // Se por erro numérico o ponto amostrado mais próximo ainda ficou longe,
  // insere o ponto clicado no segmento escolhido para garantir a incidência
  // geométrica da folha de rarefação com U_L/U_R.
  if (best.bestDistance > 1e-6) {
    const insertAt = Math.max(0, Math.min(snapped.length, best.bestIndex))
    const alreadyThere = normalizedDistanceToFixed(snapped[insertAt], fixedState, view) <= 1e-8
    if (!alreadyThere) snapped.splice(insertAt, 0, anchor)
  }

  return snapped.length >= 2 ? [snapped] : []
}

function buildRarefactionSegments(fixedState, params, view, samples = 900, constrainZ = false, direction = undefined, compactifiedZ = false) {
  const bifoliation = buildRarefactionBifoliation({ fixedState, params, view, samples, constrainZ, compactifiedZ })
  const branch = normalizeHugoniotDirection(direction) === BACKWARD_HUGONIOT ? 'plus' : 'minus'
  const leaf = selectLeafFromBifoliation(bifoliation, branch)

  // A janela recebida já é o domínio padronizado de desenho.
  // No App.jsx ela é calcView = view com margem de 20% em z.
  const drawView = view
  const inDrawView = (point) => {
    const t = point?.t ?? point?.coords?.[0]
    const z = point?.z ?? point?.coords?.[2]
    // A rarefação deve ser limitada apenas no eixo z.
    // O eixo tau não é usado como critério de corte.
    return Number.isFinite(t) && Number.isFinite(z) && (compactifiedZ || (z >= drawView.zMin && z <= drawView.zMax))
  }

  const clipped = []
  for (const segment of leaf?.curve?.segments ?? []) {
    let current = []
    for (const point of segment) {
      if (inDrawView(point)) current.push(point)
      else if (current.length) {
        if (current.length >= 2) clipped.push(current)
        current = []
      }
    }
    if (current.length >= 2) clipped.push(current)
  }
  return snapAndSelectClickedRarefactionComponent(clipped, fixedState, drawView)
}

export function buildRarefactionSegmentsData({ fixedState, params, view, resolution = 40, constrainZ = false, direction = undefined, compactifiedZ = false }) {
  const samples = Math.max(900, Math.min(1800, resolution * 24))
  return buildRarefactionSegments(fixedState, params, view, samples, constrainZ, direction, compactifiedZ)
}
