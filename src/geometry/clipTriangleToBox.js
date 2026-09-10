// Sutherland–Hodgman clipping, preserving the triangle's winding.
export function clipTriangleToBox(triangle, min, max) {
  let polygon = triangle
  for (let axis = 0; axis < 3; axis += 1) {
    for (const [bound, sign] of [[min[axis], 1], [max[axis], -1]]) {
      const input = polygon
      polygon = []
      if (!input.length) return polygon
      let a = input.at(-1)
      let da = sign * (a[axis] - bound)
      for (const b of input) {
        const db = sign * (b[axis] - bound)
        if ((da >= 0) !== (db >= 0)) {
          const alpha = da / (da - db)
          const point = a.map((value, k) => value + alpha * (b[k] - value))
          point[axis] = bound
          polygon.push(point)
        }
        if (db >= 0) polygon.push(b)
        a = b
        da = db
      }
    }
  }
  return polygon
}
