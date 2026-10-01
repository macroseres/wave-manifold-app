import * as THREE from 'three'

function interpolate(a, b, x) {
  const dx = b[0] - a[0]
  const alpha = Math.abs(dx) < 1e-14 ? 0 : (x - a[0]) / dx
  return [
    x,
    a[1] + alpha * (b[1] - a[1]),
    a[2] + alpha * (b[2] - a[2]),
  ]
}

function clipPolygonAtX(polygon, bound, keepGreater) {
  if (polygon.length === 0) return polygon
  const inside = (p) => keepGreater ? p[0] >= bound - 1e-9 : p[0] <= bound + 1e-9
  const out = []
  let previous = polygon[polygon.length - 1]
  let previousInside = inside(previous)
  for (const current of polygon) {
    const currentInside = inside(current)
    if (currentInside !== previousInside) out.push(interpolate(previous, current, bound))
    if (currentInside) out.push(current)
    previous = current
    previousInside = currentInside
  }
  return out
}

// Exact triangle clipping in DISPLAY coordinates.  This is deliberately done
// after tau normalization/centering: the planes tau=tMin/tMax are planes in
// the selected display chart, not in the original physical tau chart.
export function clipGeometryToTauBounds(geometry, minTau, maxTau) {
  if (!geometry || !Number.isFinite(minTau) || !Number.isFinite(maxTau) || !(maxTau > minTau)) return geometry
  const position = geometry.getAttribute('position')
  if (!position || position.count < 3) return geometry
  const index = geometry.getIndex()
  const triangleCount = index ? Math.floor(index.count / 3) : Math.floor(position.count / 3)
  const output = []
  const vertex = (i) => [position.getX(i), position.getY(i), position.getZ(i)]
  const vertexIndex = (k) => index ? index.getX(k) : k

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    let polygon = [
      vertex(vertexIndex(3 * triangle)),
      vertex(vertexIndex(3 * triangle + 1)),
      vertex(vertexIndex(3 * triangle + 2)),
    ]
    polygon = clipPolygonAtX(polygon, minTau, true)
    polygon = clipPolygonAtX(polygon, maxTau, false)
    if (polygon.length < 3) continue
    for (let k = 1; k < polygon.length - 1; k += 1) {
      for (const p of [polygon[0], polygon[k], polygon[k + 1]]) output.push(p[0], p[1], p[2])
    }
  }

  const clipped = new THREE.BufferGeometry()
  if (output.length === 0) return clipped
  clipped.setAttribute('position', new THREE.Float32BufferAttribute(output, 3))
  clipped.computeVertexNormals()
  clipped.computeBoundingBox()
  clipped.computeBoundingSphere()
  clipped.userData.zCompactified = true
  clipped.userData.tauDisplayClipped = true
  return clipped
}
