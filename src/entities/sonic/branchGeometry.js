import * as THREE from 'three'

function interpolateVertex(a, b, threshold) {
  const denominator = b.indicator - a.indicator
  const alpha = Math.abs(denominator) < 1e-12
    ? 0.5
    : Math.max(0, Math.min(1, (threshold - a.indicator) / denominator))
  return {
    t: a.t + (b.t - a.t) * alpha,
    Y: a.Y + (b.Y - a.Y) * alpha,
    z: a.z + (b.z - a.z) * alpha,
    indicator: threshold,
  }
}

function clipPolygonByIndicator(vertices, threshold, isInside) {
  if (!vertices.length) return []
  const clipped = []

  for (let i = 0; i < vertices.length; i += 1) {
    const current = vertices[i]
    const previous = vertices[(i + vertices.length - 1) % vertices.length]
    const currentInside = isInside(current.indicator)
    const previousInside = isInside(previous.indicator)

    if (currentInside !== previousInside) {
      clipped.push(interpolateVertex(previous, current, threshold))
    }
    if (currentInside) clipped.push(current)
  }

  return clipped
}

function appendClippedPolygon(positions, indices, polygon) {
  if (polygon.length < 3) return
  const baseIndex = positions.length / 3
  for (const vertex of polygon) {
    positions.push(vertex.t, vertex.Y, vertex.z)
  }
  for (let i = 1; i < polygon.length - 1; i += 1) {
    indices.push(baseIndex, baseIndex + i, baseIndex + i + 1)
  }
}

export function buildClippedBranchGeometry(sourceGeometry, params, threshold, isInside, indicatorFn) {
  const geometry = new THREE.BufferGeometry()
  const sourcePosition = sourceGeometry.getAttribute('position')
  const sourceIndex = sourceGeometry.getIndex()
  if (!sourcePosition || !sourceIndex) return geometry

  const positions = []
  const indices = []

  for (let i = 0; i < sourceIndex.count; i += 3) {
    const sourceIndices = [
      sourceIndex.getX(i),
      sourceIndex.getX(i + 1),
      sourceIndex.getX(i + 2),
    ]
    const verticesWithIndicator = sourceIndices.map((sourceIndexValue) => {
      const vertex = {
        t: sourcePosition.getX(sourceIndexValue),
        Y: sourcePosition.getY(sourceIndexValue),
        z: sourcePosition.getZ(sourceIndexValue),
      }
      return {
        ...vertex,
        indicator: indicatorFn(vertex.Y, vertex.t, vertex.z, params),
      }
    })
    if (!verticesWithIndicator.every((vertex) => Number.isFinite(vertex.indicator))) continue
    appendClippedPolygon(
      positions,
      indices,
      clipPolygonByIndicator(verticesWithIndicator, threshold, isInside),
    )
  }

  if (positions.length === 0) return geometry

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
