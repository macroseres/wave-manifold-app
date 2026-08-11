function reflectPoint(point) {
  if (!point) return point
  if (Array.isArray(point)) return [point[0], -point[1], point[2]]
  const coords = Array.isArray(point.coords) ? [point.coords[0], -point.coords[1], point.coords[2]] : undefined
  return {
    ...point,
    Y: Number.isFinite(point.Y) ? -point.Y : point.Y,
    coords,
  }
}

export function reflectDaggerSegments(segments) {
  if (!Array.isArray(segments)) return []
  return segments.map((segment) => (Array.isArray(segment) ? segment.map(reflectPoint) : segment))
}

export default reflectDaggerSegments
