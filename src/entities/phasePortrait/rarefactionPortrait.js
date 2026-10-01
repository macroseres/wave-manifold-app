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



// Adapted global chart for b1=0, c!=0.
// The canonical (tau,z) parametrization uses an equilibrium proportional to 1/b1
// and is therefore not a chart on this stratum.  We use (Theta,Z)=(u,1/z):
//   v = c Z^2/(1+b2 Z-Z^2),
//   Theta' = c Z^2(2+b2 Z),  Z'=(1+b2 Z-Z^2)^2.
// Roots of 1+b2 Z-Z^2 are excluded directions when c!=0, so integration stops there.
function buildB1ZeroAdaptedPortrait(params, view, resolution = 40) {
  const { b2, c } = params
  if (Math.abs(c) < 1e-10) return []
  const roots = solveQuadraticRealRoots(-1, b2, 1)
  const rootTol = 2e-4
  const field = ([_theta, Z]) => {
    const d = 1 + b2 * Z - Z * Z
    return [c * Z * Z * (2 + b2 * Z), d * d]
  }
  const inside = ([theta, Z]) => Number.isFinite(theta) && Number.isFinite(Z)
    && theta >= view.tMin && theta <= view.tMax && Math.abs(physicalZToVisual(Z)) < 0.995
    && roots.every(r => Math.abs(Z - r) > rootTol * Math.max(1, Math.abs(r)))
  const rk4 = (point, h) => {
    const k1 = field(point)
    const p2 = point.map((x,i)=>x+h*k1[i]/2), k2=field(p2)
    const p3 = point.map((x,i)=>x+h*k2[i]/2), k3=field(p3)
    const p4 = point.map((x,i)=>x+h*k3[i]), k4=field(p4)
    return point.map((x,i)=>x+h*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6)
  }
  const integrate = (seed, sign) => {
    const out=[seed]
    let p=seed
    const base=0.012/Math.max(1, Math.sqrt(Math.max(1,resolution)/40))
    for(let i=0;i<5000;i++){
      const f=field(p), speed=Math.hypot(f[0]/Math.max(1,view.tMax-view.tMin), f[1]/(1+p[1]*p[1]))
      const h=sign*base/Math.max(0.35,speed)
      const q=rk4(p,h)
      if(!inside(q)) break
      if(roots.some(r => (p[1]-r)*(q[1]-r)<=0)) break
      out.push(q); p=q
    }
    return out
  }
  const bounds=[-1,...roots.map(physicalZToVisual),1]
  const zSeeds=[]
  for(let i=0;i<bounds.length-1;i++){
    const a=bounds[i], b=bounds[i+1]
    for(const f of [0.2,0.5,0.8]) zSeeds.push(visualZToPhysical(a+f*(b-a)))
  }
  const thetaSeeds=Array.from({length:10},(_,i)=>view.tMin+(i+1)*(view.tMax-view.tMin)/11)
  const curves=[]
  for(const Z of zSeeds) for(const theta of thetaSeeds){
    const seed=[theta,Z]
    if(!inside(seed)) continue
    const back=integrate(seed,-1).reverse(), forward=integrate(seed,1)
    const raw=[...back.slice(0,-1),...forward]
    if(raw.length<3) continue
    const segment=raw.map(([Theta,ZZ])=>({t:Theta,Y:0,z:ZZ,coords:[Theta,0,ZZ],adaptedB1Zero:true}))
    curves.push({id:`R-b10-${curves.length}`,seed:{t:theta,Y:0,z:Z,adaptedB1Zero:true},segments:[segment],
      displayParts:[{branch:theta>=0?'slow':'fast',segment}],adaptedB1Zero:true})
  }
  return curves
}


// Structural stratum b1=0, c=0.
// IMPORTANT: the app coordinate z is reciprocal to the characteristic slope Z:
//   Z = 1/z.
// The characteristic equation v(1-b2 Z-Z^2)=0 therefore becomes
//   v(z^2-b2 z-1)=0 in the app chart.  Its two regular components are
//   z=zeta_±=(b2±sqrt(b2^2+4))/2.  On each component dv/du=Z=1/zeta.
// We display this stratum in the adapted state chart (u,v,z_app), encoded in
// the scene coordinates (t,Y,z)=(u,v,z_app).  The coincidence rarefaction
// Z=0 lives at z_app=infinity and is not a finite curve in this chart.
function buildB1ZeroCZeroPortrait(params, view, resolution = 40) {
  const { b2 } = params
  const disc = Math.sqrt(b2 * b2 + 4)
  const zetas = [(b2 + disc) / 2, (b2 - disc) / 2]
  const uMin = view.tMin, uMax = view.tMax
  const vMin = view.yMin, vMax = view.yMax
  const count = Math.max(36, Math.min(180, Math.round(resolution * 1.5)))
  const curves = []

  for (const [familyIndex, zeta] of zetas.entries()) {
    const slope = 1 / zeta
    // Seed parallel leaves by their intercept K=v-Zu.  Cover the visible
    // rectangle in (u,v), then clip each exact straight rarefaction to it.
    const corners = [[uMin,vMin],[uMin,vMax],[uMax,vMin],[uMax,vMax]]
    const ks = corners.map(([u,v]) => v - slope * u)
    const kMin = Math.min(...ks), kMax = Math.max(...ks)
    const leafCount = 11
    for (let j = 0; j < leafCount; j++) {
      const K = kMin + (j + 0.5) * (kMax - kMin) / leafCount
      const points = []
      for (let i = 0; i <= count; i++) {
        const u = uMin + i * (uMax - uMin) / count
        const v = slope * u + K
        if (v < vMin - 1e-9 || v > vMax + 1e-9) continue
        points.push({ t:u, Y:v, z:zeta, coords:[u,v,zeta], adaptedB1ZeroCZero:true })
      }
      if (points.length < 2) continue
      // Across v=0 the ordering of the two eigenvalues reverses.  Split only
      // for color semantics; the geometric integral curve remains continuous.
      const parts=[]; let current=[]; let branch=null
      const branchAt = v => familyIndex === 0 ? (v >= 0 ? 'fast' : 'slow') : (v >= 0 ? 'slow' : 'fast')
      for (let i=0;i<points.length;i++) {
        const p=points[i], nextBranch=branchAt(p.Y)
        if (branch===null) { branch=nextBranch; current=[p]; continue }
        if (nextBranch===branch || Math.abs(p.Y)<1e-12) { current.push(p); continue }
        const prev=points[i-1]
        const f=-prev.Y/(p.Y-prev.Y)
        const u0=prev.t+f*(p.t-prev.t)
        const cross={t:u0,Y:0,z:zeta,coords:[u0,0,zeta],adaptedB1ZeroCZero:true}
        current.push(cross); if(current.length>1) parts.push({branch,segment:current})
        branch=nextBranch; current=[cross,p]
      }
      if(current.length>1) parts.push({branch,segment:current})
      curves.push({ id:`R-b10-c0-${familyIndex}-${j}`, seed:points[Math.floor(points.length/2)],
        segments:[points], displayParts:parts, adaptedB1ZeroCZero:true })
    }
  }
  return curves
}

export function buildGlobalRarefactionPortrait(params, view, resolution = 40) {
  if (Math.abs(params?.b1 ?? 1) < 1e-10 && Math.abs(params?.c ?? 0) < 1e-10) return buildB1ZeroCZeroPortrait(params, view, resolution)
  if (Math.abs(params?.b1 ?? 1) < 1e-10 && Math.abs(params?.c ?? 0) >= 1e-10) return buildB1ZeroAdaptedPortrait(params, view, resolution)
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
