export function pushSegment(segments, current) {
  if (current.length >= 2) segments.push(current)
}

export function inExpandedWindow(point, view, marginFactor = 0.02) {
  const yTol = marginFactor * Math.max(1, view.yMax - view.yMin)
  const tTol = marginFactor * Math.max(1, view.tMax - view.tMin)
  return (
    point.z >= view.zMin && point.z <= view.zMax &&
    point.t >= view.tMin - tTol && point.t <= view.tMax + tTol &&
    point.Y >= view.yMin - yTol && point.Y <= view.yMax + yTol
  )
}

export function inflectionZDomain(view) {
  // A curva de inflexao J vive em Y=0, isto e, na propria superficie
  // caracteristica. Para fins de desenho ela deve ser recortada pela
  // fronteira visivel da caracteristica, nao por um dominio computacional
  // artificial maior; caso contrario a curva pode desaparecer antes da borda
  // ou passar visualmente fora do retangulo clicavel.
  return { zMin: view.zMin, zMax: view.zMax }
}

export function clipInflectionSegmentToTauWindow(a, b, tMin, tMax, eps = 1e-10) {
  const points = []
  const add = (point) => {
    if (!point || !Number.isFinite(point.t) || !Number.isFinite(point.z)) return
    if (point.t < tMin - eps || point.t > tMax + eps) return
    const clampedT = Math.min(tMax, Math.max(tMin, point.t))
    const mapped = [clampedT, 0, point.z]
    const last = points[points.length - 1]
    if (!last || Math.hypot(last[0] - mapped[0], last[2] - mapped[2]) > 1e-9) points.push(mapped)
  }

  const insideA = a.t >= tMin - eps && a.t <= tMax + eps
  const insideB = b.t >= tMin - eps && b.t <= tMax + eps

  add(insideA ? a : null)

  const dt = b.t - a.t
  if (Math.abs(dt) > eps) {
    for (const boundary of [tMin, tMax]) {
      const alpha = (boundary - a.t) / dt
      if (alpha > eps && alpha < 1 - eps) {
        add({
          t: boundary,
          z: a.z + alpha * (b.z - a.z),
        })
      }
    }
  }

  add(insideB ? b : null)
  points.sort((p, q) => p[2] - q[2])
  return points
}

export function uniqueFiniteLocal(values, tol = 1e-8) {
  return values
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
    .filter((value, index, array) => index === 0 || Math.abs(value - array[index - 1]) > tol)
}

