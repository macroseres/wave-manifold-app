import * as THREE from 'three'

function asVector3(point) {
  if (!point) return null
  if (point.isVector3) return point
  if (Array.isArray(point)) return new THREE.Vector3(point[0], point[1], point[2])
  if (Array.isArray(point.coords)) return new THREE.Vector3(point.coords[0], point.coords[1], point.coords[2])
  if ([point.t, point.Y, point.z].every(Number.isFinite)) return new THREE.Vector3(point.t, point.Y, point.z)
  return null
}

export function smoothCurveCoords(points, options = {}) {
  const {
    minPoints = 160,
    samplesPerEdge = 10,
    maxPoints = 900,
    maxRawPoints = 900,
    curveType = 'centripetal',
    tension = 0.45,
  } = options

  if (!Array.isArray(points) || points.length < 2) return []

  const vectors = points.map(asVector3).filter(Boolean)
  if (vectors.length < 2) return []

  const anchorIndex = points.findIndex((point) => point?.isClickedRarefactionAnchor || point?.isArcAnchor)
  const finiteVectors = []
  let previous = null
  for (let i = 0; i < vectors.length; i += 1) {
    const v = vectors[i]
    if (![v.x, v.y, v.z].every(Number.isFinite)) continue
    if (previous) {
      const jump = v.distanceTo(previous)
      if (!Number.isFinite(jump) || jump > 1e4) break
    }
    finiteVectors.push({ vector: v, sourceIndex: i })
    previous = v
  }

  // Nao corte sempre os primeiros pontos. Em folhas longas de rarefacao, o
  // ponto clicado pode ficar depois do antigo limite de 420 pontos; nesse caso
  // a curva visual parecia nao passar por U_L. Quando houver uma ancora
  // marcada, mantemos uma janela centrada nela.
  let boundedItems = finiteVectors
  if (finiteVectors.length > maxRawPoints) {
    const finiteAnchorIndex = anchorIndex >= 0
      ? finiteVectors.findIndex((item) => item.sourceIndex === anchorIndex)
      : -1
    if (finiteAnchorIndex >= 0) {
      const half = Math.floor(maxRawPoints / 2)
      const start = Math.max(0, Math.min(finiteVectors.length - maxRawPoints, finiteAnchorIndex - half))
      boundedItems = finiteVectors.slice(start, start + maxRawPoints)
    } else {
      boundedItems = finiteVectors.slice(0, maxRawPoints)
    }
  }

  const boundedVectors = boundedItems.map((item) => item.vector)
  if (boundedVectors.length < 2) return []

  // Com poucos pontos o Catmull-Rom pode introduzir artefatos; nesses casos
  // mantemos a poligonal original.
  if (boundedVectors.length < 4) {
    return boundedVectors.map((v) => [v.x, v.y, v.z])
  }

  const count = Math.max(
    minPoints,
    Math.min(maxPoints, Math.ceil((boundedVectors.length - 1) * samplesPerEdge)),
  )

  try {
    const curve = new THREE.CatmullRomCurve3(boundedVectors, false, curveType, tension)
    return curve.getPoints(count).map((v) => [v.x, v.y, v.z]).filter((p) => p.every(Number.isFinite))
  } catch {
    return boundedVectors.map((v) => [v.x, v.y, v.z])
  }
}
