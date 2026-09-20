import * as THREE from 'three'
import { hopfPlus, hopfMinus, hopfSpectrum, hopfDiscriminantUpperBound, HOPF_EPS } from '../entities/hopf/index.js'
import { clipTriangleToBox } from './clipTriangleToBox.js'
import { physicalZToVisual, visualZToPhysical, VISUAL_Z_MIN, VISUAL_Z_MAX } from './zCompactification.js'

export function buildHopfGeometry(params, view, resolution = 40, direction = 'plus') {
  const geometry = new THREE.BufferGeometry()
  if (Math.abs(params.b1) < 1e-12 || view.yMax <= view.yMin || view.tMax <= view.tMin) return geometry
  const tau = direction === 'plus' ? hopfPlus : hopfMinus
  const count = Math.max(112, Math.min(240, Math.round(resolution * 3)))
  const point = (Y, z) => [tau(Y, z, params), Y, z]
  const rows = Array.from({ length: count + 1 }, (_, j) => {
    const z = visualZToPhysical(VISUAL_Z_MIN + 1e-4 + j / count * (VISUAL_Z_MAX - VISUAL_Z_MIN - 2e-4))
    return Array.from({ length: count + 1 }, (_, i) => point(view.yMin + i / count * (view.yMax - view.yMin), z))
  })
  const vertices = []
  const indices = []
  const min = [view.tMin, view.yMin, -Infinity]
  const max = [view.tMax, view.yMax, Infinity]
  // Refine only near the elliptic boundary. Dropping whole grid cells here
  // produced visible stairs and removed a substantial strip of valid surface.
  const midpoint = (a, b) => point((a[1] + b[1]) / 2,
    visualZToPhysical((physicalZToVisual(a[2]) + physicalZToVisual(b[2])) / 2))
  const emit = (triangle, depth = 0) => {
    const clipped = clipTriangleToBox(triangle, min, max).map(([, Y, z]) => point(Y, z))
    for (let i = 1; i + 1 < clipped.length; i++) {
      const points = [clipped[0], clipped[i], clipped[i + 1]]
      if (points.some(p => !p.every(Number.isFinite))) continue
      const valid = p => p[0] >= view.tMin && p[0] <= view.tMax &&
        hopfSpectrum(direction, ...p, params).discriminant < -HOPF_EPS
      // Enclose both CPU and Float32 GPU coordinates, including inverse z
      // compactification rounding. Reject uncertain cells, never bridge Δ=0.
      const rounded = points.map(p => [Math.fround(p[0]), Math.fround(p[1]),
        visualZToPhysical(Math.fround(physicalZToVisual(Math.fround(p[2]))))])
      const box = [0, 1, 2].map(axis => {
        const values = [...points, ...rounded].map(p => p[axis])
        const padding = 1e-12 * Math.max(1, ...values.map(Math.abs))
        return [Math.min(...values) - padding, Math.max(...values) + padding]
      })
      if (!points.every(valid) || !(hopfDiscriminantUpperBound(direction, box, params) < -HOPF_EPS)) {
        if (depth >= 5) continue
        const [a, b, c] = points
        const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a)
        // Mid-edge probes also find thin elliptic patches missed by corners.
        if (![...points, ab, bc, ca].some(valid)) continue
        emit([a, ab, ca], depth + 1)
        emit([ab, b, bc], depth + 1)
        emit([ca, bc, c], depth + 1)
        emit([ab, bc, ca], depth + 1)
        continue
      }
      const offset = vertices.length / 3
      points.forEach(p => vertices.push(...p))
      indices.push(offset, offset + 1, offset + 2)
    }
  }
  for (let j = 0; j < count; j++) for (let i = 0; i < count; i++) {
    const a = rows[j][i], b = rows[j][i + 1], c = rows[j + 1][i], d = rows[j + 1][i + 1]
    emit([a, b, c])
    emit([c, b, d])
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
