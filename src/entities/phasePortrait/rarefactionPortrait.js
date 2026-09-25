import { buildRarefactionSegmentsData } from '../waves/rarefactionSegmentsData.js'
import { computeStateFromCharacteristicPoint, waveSpeed } from '../surfaceImplicit/state.js'
import { orientSegmentBySpeed, solutionArcOrientation } from '../waves/orientation.js'
import { FORWARD_HUGONIOT } from '../hugoniot/directions.js'
import { solveQuadraticRealRoots, dedupeSortedNumbers } from '../numerics/index.js'
import { physicalZToVisual, visualZToPhysical } from '../../geometry/zCompactification.js'
import { rarefactionSingularities } from './rarefactionSingularities.js'

export function saddlePortraitSeeds(view, params) {
  const span = view.tMax - view.tMin
  if (!(span > 0)) return []
  return rarefactionSingularities(params).filter(s => s.type === 'sela').flatMap(s =>
    [-1, 1].flatMap(side => [0.035, 0.075].flatMap(offset => {
      const zHat = physicalZToVisual(s.z) + side * offset
      if (Math.abs(zHat) >= 0.98) return []
      const z = visualZToPhysical(zHat)
      return [-1, 1].flatMap(sign => [0.025, 0.055].map(radius => sign * radius * span)
        .filter(t => t > view.tMin && t < view.tMax)
        .map(t => ({ t, Y: 0, z, branch: t > 0 ? 'slow' : 'fast', nearSaddle: true })))
    })))
}

// Resample by visible arc length, not by the integrator's adaptive point count.
// Convergence into a singularity must not make two different leaves duplicates.
export function portraitOverlapFraction(segments, visual, isNear, regular = () => true) {
  let total = 0, covered = 0
  const step = 0.025
  for (const segment of segments) {
    let remaining = step / 2
    for (let i = 1; i < segment.length; i++) {
      const a = visual(segment[i - 1]), b = visual(segment[i])
      const length = Math.hypot(b[0] - a[0], b[1] - a[1])
      while (remaining < length) {
        const p = a.map((x, k) => x + remaining / length * (b[k] - x))
        if (regular(p)) { total += step; if (isNear(p, 0.009)) covered += step }
        remaining += step
      }
      remaining -= length
    }
  }
  return total > 0.1 ? covered / total : 0
}

export function characteristicPortraitSeeds(view, params) {
  if (!view || ![view.tMin, view.tMax, view.zMin, view.zMax].every(Number.isFinite)
    || view.tMax <= view.tMin || view.zMax <= view.zMin) return []
  // The existing dt/dz integrator cannot reach every regular region from z=0:
  // its denominators A and P have real roots, notably in case III. Seed each
  // region separately in compactified coordinates, including both infinite tails.
  const roots = params ? dedupeSortedNumbers([
    ...solveQuadraticRealRoots(-1, params.b2, 1),
    ...solveQuadraticRealRoots(params.b1 - 1, params.b2, 1),
  ]) : []
  const boundaries = [-1, ...roots.map(physicalZToVisual), 1]
  const transversals = boundaries.slice(0, -1).flatMap((min, i) => {
    const max = boundaries[i + 1]
    return [0.5, 0.2, 0.8].map(fraction => visualZToPhysical(min + fraction * (max - min)))
  })
  const intervals = [[view.tMin, Math.min(0, view.tMax)], [Math.max(0, view.tMin), view.tMax]]
  const count = 12
  const fractions = Array.from({ length: count }, (_, i) => (i + 1) / (count + 1))
  return transversals.flatMap(z => intervals.flatMap(([min, max]) => max > min ? fractions.map(fraction => ({
    t: min + fraction * (max - min), Y: 0, z,
    // Metadata only: used to balance seeds/colors. It does NOT select the
    // rarefaction field or its orientation.
    branch: max <= 0 ? 'fast' : 'slow',
  })) : []))
}

// Reuse the canonical speed convention locally: orienting a whole leaf by its
// endpoints can reverse arrows on portions beyond a speed extremum.
export function orientedPortraitEdge(a, b, branch, params) {
  const sa = waveSpeed(a.t, a.z, params), sb = waveSpeed(b.t, b.z, params)
  if (![sa, sb].every(Number.isFinite) || Math.abs(sb - sa) <= 1e-9 * Math.max(1, Math.abs(sa), Math.abs(sb))) return null
  return orientSegmentBySpeed([a, b], p => waveSpeed(p.t, p.z, params), solutionArcOrientation(branch, 'rarefaction'))
}

function clipToViewTau(segments, view) {
  const result = []
  for (const segment of segments) {
    let current = []
    for (let i = 1; i < segment.length; i++) {
      const a = segment[i - 1], b = segment[i]
      const dt = b.t - a.t
      let start = 0, end = 1
      if (Math.abs(dt) < 1e-14) {
        if (a.t < view.tMin || a.t > view.tMax) { if (current.length > 1) result.push(current); current = []; continue }
      } else {
        const x = (view.tMin - a.t) / dt, y = (view.tMax - a.t) / dt
        start = Math.max(0, Math.min(x, y)); end = Math.min(1, Math.max(x, y))
      }
      if (start > end) { if (current.length > 1) result.push(current); current = []; continue }
      const at = fraction => {
        if (fraction === 0) return a
        if (fraction === 1) return b
        const t = a.t + fraction * dt, z = a.z + fraction * (b.z - a.z)
        return { t, Y: 0, z, coords: [t, 0, z] }
      }
      if (!current.length) current.push(at(start))
      current.push(at(end))
      if (end < 1) { if (current.length > 1) result.push(current); current = [] }
    }
    if (current.length > 1) result.push(current)
  }
  return result
}

export function splitAtCoincidence(segments) {
  const result = []
  for (const segment of segments) {
    let current = []
    let branch = null
    const pushCurrent = () => {
      if (current.length > 1 && branch) result.push({ branch, segment: current })
      current = []
    }
    for (let i = 0; i < segment.length; i++) {
      const point = segment[i]
      const pointBranch = point.t >= 0 ? 'slow' : 'fast'
      if (branch === null) {
        branch = pointBranch
        current = [point]
        continue
      }
      if (pointBranch === branch || Math.abs(point.t) < 1e-12) {
        current.push(point)
        continue
      }
      const previous = segment[i - 1]
      const dt = point.t - previous.t
      if (Math.abs(dt) > 1e-14) {
        const fraction = -previous.t / dt
        if (fraction > 0 && fraction < 1) {
          const z = previous.z + fraction * (point.z - previous.z)
          const crossing = { t: 0, Y: 0, z, coords: [0, 0, z] }
          current.push(crossing)
          pushCurrent()
          branch = pointBranch
          current = [crossing, point]
          continue
        }
      }
      pushCurrent()
      branch = pointBranch
      current = [point]
    }
    pushCurrent()
  }
  return result
}

export function buildGlobalRarefactionPortrait(params, view, resolution = 40) {
  const curves = []
  const occupied = new Map()
  const tSpan = view.tMax - view.tMin
  const visual = point => [point.t / tSpan, physicalZToVisual(point.z) / 2]
  const saddles = rarefactionSingularities(params).filter(s => s.type === 'sela').map(visual)
  const regular = p => Math.abs(p[1]) < 0.46 && saddles.every(s => Math.hypot(p[0] - s[0], p[1] - s[1]) > 0.09)
  const distance = (p, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1]
    const ratio = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)))
    return Math.hypot(p[0] - a[0] - ratio * dx, p[1] - a[1] - ratio * dy)
  }
  const cellSize = 0.025
  const isNear = (p, tolerance) => {
    const x = Math.floor(p[0] / cellSize), y = Math.floor(p[1] / cellSize)
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      if ((occupied.get(`${x + dx}:${y + dy}`) ?? []).some(([a, b]) => distance(p, a, b) < tolerance)) return true
    }
    return false
  }
  const occupy = (a, b) => {
    for (let x = Math.floor(Math.min(a[0], b[0]) / cellSize); x <= Math.floor(Math.max(a[0], b[0]) / cellSize); x++) {
      for (let y = Math.floor(Math.min(a[1], b[1]) / cellSize); y <= Math.floor(Math.max(a[1], b[1]) / cellSize); y++) {
        const key = `${x}:${y}`
        if (!occupied.has(key)) occupied.set(key, [])
        occupied.get(key).push([a, b])
      }
    }
  }
  for (const point of [...characteristicPortraitSeeds(view, params), ...saddlePortraitSeeds(view, params)]) {
    const candidate = visual(point)
    if (isNear(candidate, point.nearSaddle ? 0.006 : 0.018)) continue
    const fixedState = computeStateFromCharacteristicPoint(point.t, point.z, params)
    // Integrate one continuous rarefaction leaf.  Do not clip it at tau=0:
    // the coincidence is a color/family transition, not an artificial end of
    // the integral curve.  Splitting below is only for rendering each side
    // with its canonical slow/fast color.
    const fullSegments = buildRarefactionSegmentsData({
      fixedState, params, view, resolution, constrainZ: true, compactifiedZ: true,
      // The phase portrait is one foliation on the whole characteristic C.
      // C_s/C_f are used only after integration to color the same integral curve.
      // Never switch R-/R+ continuation according to the sign of tau.
      direction: FORWARD_HUGONIOT,
    })
    if (!fullSegments.length) continue
    const visibleSegments = clipToViewTau(fullSegments, view)
    if (portraitOverlapFraction(visibleSegments, visual, isNear, regular) > 0.72) continue
    const colored = splitAtCoincidence(visibleSegments)
    if (!colored.length) continue
    const id = `R-${curves.length}`
    curves.push({ id, seed: point, segments: fullSegments, displayParts: colored })
    for (const segment of visibleSegments) for (let i = 1; i < segment.length; i++) occupy(visual(segment[i - 1]), visual(segment[i]))
  }
  return curves
}

// Compatibility for existing consumers; global leaves remain intact above.
export function buildRarefactionPortrait(params, view, resolution = 40) {
  return buildGlobalRarefactionPortrait(params, view, resolution).flatMap(curve =>
    curve.displayParts.map(part => ({ sourceRarefactionId: curve.id, branch: part.branch, segments: [part.segment] })))
}
