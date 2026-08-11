import { buildRarefactionContinuationLeaf } from '../../waves/index.js'
import { FORWARD_HUGONIOT } from '../../hugoniot/directions.js'
import {
  sonicImplicitF,
  sonicLeftImplicitF,
} from '../../surfaceImplicit/index.js'

function finite(value) {
  return Number.isFinite(value)
}

function expandedView(view, tMargin = 1.0, zMargin = 4.0) {
  const tSpan = Math.max(1, view.tMax - view.tMin)
  const zSpan = Math.max(1, view.zMax - view.zMin)
  return {
    ...view,
    tMin: view.tMin - tMargin * tSpan,
    tMax: view.tMax + tMargin * tSpan,
    zMin: view.zMin - zMargin * zSpan,
    zMax: view.zMax + zMargin * zSpan,
  }
}

function rarefactionSegments(fixedState, params, view, samples, direction) {
  const leaf = buildRarefactionContinuationLeaf({
    fixedState,
    params,
    view,
    samples,
    direction,
    constrainZ: false,
  })

  return (leaf?.curve?.segments ?? [])
    .map((segment) => segment
      .map((point) => ({
        ...point,
        Y: point.Y ?? 0,
        coords: point.coords ?? [point.t, point.Y ?? 0, point.z],
      }))
      .filter((point) => finite(point.t) && finite(point.z)))
    .filter((segment) => segment.length >= 2)
}

function pointOnRarefactionSegment(a, b, alpha, branch) {
  const t = a.t + alpha * (b.t - a.t)
  const z = a.z + alpha * (b.z - a.z)
  return {
    t,
    Y: 0,
    z,
    coords: [t, 0, z],
    branchLabelTex: branch === 'fast'
      ? '\\mathcal{R}_+\\cap S^+'
      : '\\mathcal{R}_-\\cap S^-',
  }
}

function sonicValueAt(t, z, params, branch) {
  const value = branch === 'fast'
    ? sonicImplicitF(0, t, z, params)
    : sonicLeftImplicitF(0, t, z, params)
  return finite(value) ? value : null
}

function segmentSonicRoot(a, b, params, branch) {
  const valueScale = Math.max(
    1,
    Math.abs(sonicValueAt(a.t, a.z, params, branch) ?? 0),
    Math.abs(sonicValueAt(b.t, b.z, params, branch) ?? 0),
  )
  const residualTol = 1.0e-7 * valueScale + 1.0e-9
  const evalAt = (alpha) => {
    const t = a.t + alpha * (b.t - a.t)
    const z = a.z + alpha * (b.z - a.z)
    const g = sonicValueAt(t, z, params, branch)
    return finite(g) ? { g, alpha, t, z } : null
  }

  const left = evalAt(0)
  const right = evalAt(1)
  if (!left || !right) return null

  const accept = (obj) => {
    if (!obj || Math.abs(obj.g) > residualTol) return null
    return pointOnRarefactionSegment(a, b, obj.alpha, branch)
  }

  if (Math.abs(left.g) <= residualTol) return accept(left)
  if (Math.abs(right.g) <= residualTol) return accept(right)

  if (left.g * right.g <= 0) {
    let lo = 0
    let hi = 1
    let flo = left.g
    for (let k = 0; k < 72; k += 1) {
      const mid = 0.5 * (lo + hi)
      const midObj = evalAt(mid)
      if (!midObj) return null
      if (Math.abs(midObj.g) < residualTol || Math.abs(hi - lo) < 1e-12) return accept(midObj)
      if (flo * midObj.g <= 0) {
        hi = mid
      } else {
        lo = mid
        flo = midObj.g
      }
    }
    return accept(evalAt(0.5 * (lo + hi)))
  }

  const phi = (Math.sqrt(5) - 1) / 2
  let lo = 0
  let hi = 1
  let c = hi - phi * (hi - lo)
  let d = lo + phi * (hi - lo)
  const val = (alpha) => {
    const obj = evalAt(alpha)
    return obj ? Math.abs(obj.g) : Number.POSITIVE_INFINITY
  }
  let fc = val(c)
  let fd = val(d)
  for (let k = 0; k < 56; k += 1) {
    if (fc < fd) {
      hi = d
      d = c
      fd = fc
      c = hi - phi * (hi - lo)
      fc = val(c)
    } else {
      lo = c
      c = d
      fc = fd
      d = lo + phi * (hi - lo)
      fd = val(d)
    }
  }
  return accept(evalAt(0.5 * (lo + hi)))
}

export function computeRarefactionInflectionPoint({
  fixedState,
  params,
  view,
  resolution = 40,
  branch = 'slow',
  direction = FORWARD_HUGONIOT,
}) {
  if (!fixedState || !params || !view) return null
  const samples = Math.max(1200, Math.min(2600, resolution * 32))
  const calcView = expandedView(view)
  const segments = rarefactionSegments(fixedState, params, calcView, samples, direction)
  if (!segments.length) return null

  for (const segment of segments) {
    for (let i = 0; i < segment.length - 1; i += 1) {
      const a = segment[i]
      const b = segment[i + 1]
      if (![a.t, a.z, b.t, b.z].every(finite)) continue
      const root = segmentSonicRoot(a, b, params, branch)
      if (root) return root
    }
  }

  return null
}
