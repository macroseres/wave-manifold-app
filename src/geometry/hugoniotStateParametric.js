// Normalize the nodal cubic with lines through the fixed left state.
// (x,y)=r(cos(theta),sin(theta)), hence F=r²(r D+Q).
export function buildParametricHugoniot(bounds, fixed, params, resolution = 260) {
  const u = fixed?.uMinus ?? fixed?.u
  const v = fixed?.vMinus ?? fixed?.v
  const { b1, b2, c } = params ?? {}
  if (![u, v, b1, b2, c].every(Number.isFinite) || !bounds) return []
  const roots = (a, b, d) => {
    if (Math.abs(a) < 1e-12) return Math.abs(b) < 1e-12 ? [] : [-d / b]
    const disc = b * b - 4 * a * d
    return disc < 0 ? [] : [(-b - Math.sqrt(disc)) / (2 * a), (-b + Math.sqrt(disc)) / (2 * a)]
  }
  const angle = m => (Math.atan(m) + Math.PI) % Math.PI
  const poles = [0, Math.PI, ...roots(1, b2, b1 - 1).map(angle)]
  const nodes = roots(v, b1 * u + b2 * v, -(v + c)).map(angle)
  if (Math.abs(v) < 1e-12) nodes.push(Math.PI / 2)
  const evaluate = theta => {
    const x = Math.cos(theta), y = Math.sin(theta)
    const D = y * (y * y + b2 * x * y + (b1 - 1) * x * x)
    const Q = 2 * (v * y * y + (b1 * u + b2 * v) * x * y - (v + c) * x * x)
    if (Math.abs(D) < 1e-12) return null
    const r = nodes.some(a => Math.abs(a - theta) < 1e-13) ? 0 : -Q / D
    return { u: u + r * x, v: v + r * y }
  }
  // Reducible cubics need their line components, supplied by the implicit fallback.
  if (poles.some(theta => {
    const x = Math.cos(theta), y = Math.sin(theta)
    return Math.abs(v * y * y + (b1 * u + b2 * v) * x * y - (v + c) * x * x) < 1e-10
  })) return null
  const count = Math.max(1000, resolution * 6)
  const cuts = [...new Set(poles)].sort((a, b) => a - b)
  const segments = []
  for (let j = 1; j < cuts.length; j++) {
    const lo = cuts[j - 1], hi = cuts[j]
    const angles = [lo + 1e-8, hi - 1e-8, ...nodes.filter(a => a > lo && a < hi)]
    for (let i = 1; i < count; i++) {
      const a = Math.PI * i / count
      if (a > lo && a < hi) angles.push(a)
    }
    angles.sort((a, b) => a - b)
    let previous = null, current = []
    for (const a of angles) {
      const next = evaluate(a)
      if (previous && next) {
        let first = 0, last = 1
        for (const [key, min, max] of [['u', bounds.uMin, bounds.uMax], ['v', bounds.vMin, bounds.vMax]]) {
          const delta = next[key] - previous[key]
          if (Math.abs(delta) < 1e-15) {
            if (previous[key] < min || previous[key] > max) last = -1
          } else {
            const p = (min - previous[key]) / delta, q = (max - previous[key]) / delta
            first = Math.max(first, Math.min(p, q)); last = Math.min(last, Math.max(p, q))
          }
        }
        if (first <= last) {
          const at = t => ({ state: { u: previous.u + t * (next.u - previous.u), v: previous.v + t * (next.v - previous.v) } })
          if (!current.length) current.push(at(first))
          current.push(at(last))
          if (last < 1) { segments.push(current); current = [] }
        } else if (current.length) { segments.push(current); current = [] }
      }
      previous = next
    }
    if (current.length >= 2) segments.push(current)
  }
  return segments
}
