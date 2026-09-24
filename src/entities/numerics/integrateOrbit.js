export function rk4VectorStep(field, state, h) {
  const shift = (k, factor) => state.map((x, i) => x + factor * h * k[i])
  const a = field(state)
  const b = field(shift(a, 0.5))
  const c = field(shift(b, 0.5))
  const d = field(shift(c, 1))
  return state.map((x, i) => x + h * (a[i] + 2 * b[i] + 2 * c[i] + d[i]) / 6)
}

// Step doubling controls error; all work and time budgets are finite.
export function integrateOrbit(field, seed, bounds, direction = 1, options = {}) {
  const span = Math.max(1e-6, Math.min(bounds.uMax - bounds.uMin, bounds.vMax - bounds.vMin))
  const inside = ([u, v]) => Number.isFinite(u) && Number.isFinite(v)
    && u >= bounds.uMin && u <= bounds.uMax && v >= bounds.vMin && v <= bounds.vMax
  if (!inside(seed)) return []
  const points = [seed]
  const stopPoints = Array.isArray(options.stopPoints) ? options.stopPoints : []
  const stopRadius = Math.max(0, options.stopRadius ?? 0)
  const ignoreStopPoint = options.ignoreStopPoint ?? null
  let state = seed
  let h = 0.02
  let time = 0
  const maxTime = options.maxTime ?? 200
  for (let attempt = 0; attempt < (options.maxAttempts ?? 8000) && points.length < (options.maxPoints ?? 1200) && time < maxTime; attempt++) {
    const speed = Math.hypot(...field(state))
    if (!Number.isFinite(speed) || speed < 1e-9 * span) break
    h = Math.min(h, 0.025 * span / speed, options.maxStep ?? 0.2, maxTime - time)
    if (h < 1e-10) break
    const coarse = rk4VectorStep(field, state, direction * h)
    const half = rk4VectorStep(field, state, direction * h / 2)
    const fine = rk4VectorStep(field, half, direction * h / 2)
    const error = Math.hypot(...fine.map((x, i) => x - coarse[i]))
    const tolerance = (options.tolerance ?? 1e-7) * span
    if (!Number.isFinite(error) || error > tolerance) { h *= 0.5; continue }
    // RK error alone does not bound the error of the straight rendered chord.
    const chordError = Math.hypot(...half.map((x, i) => x - (state[i] + fine[i]) / 2))
    if (chordError > (options.chordTolerance ?? 2e-5) * span) { h *= 0.5; continue }
    if (!inside(fine)) break
    // Test the entire proposed edge BEFORE accepting it: endpoint-only tests
    // can jump across a thin exclusion band or append the crossing itself.
    if (options.stopSegment?.(state, fine)) break
    points.push(fine)
    state = fine
    time += h
    if (points.length > 4 && options.stopWhen?.(state)) break
    if (stopRadius > 0 && points.length > 4 && stopPoints.some(target => {
      if (ignoreStopPoint && Math.hypot(target[0] - ignoreStopPoint[0], target[1] - ignoreStopPoint[1]) < stopRadius) return false
      return Math.hypot(state[0] - target[0], state[1] - target[1]) <= stopRadius
    })) break
    if (error < tolerance * 0.01) h *= 1.5
  }
  return direction < 0 ? points.reverse() : points
}
