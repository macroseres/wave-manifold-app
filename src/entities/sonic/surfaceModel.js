import { buildImplicitSurfaceGeometry } from '../implicitGeometry/index.js'
import {
  sonicImplicitF,
  sonicLeftImplicitF,
  solveSonicBranchSeparatorPoint,
} from '../surfaceImplicit/index.js'
import { SONIC_SURFACE } from '../../config/numerics.js'
import { buildClippedBranchGeometry } from './branchGeometry.js'
import { VISUAL_Z_MAX, VISUAL_Z_MIN, visualZToPhysical } from '../../geometry/zCompactification.js'

export const BRANCH_INDICATOR_EPS = 1e-7
export const SEPARATOR_SAMPLES = SONIC_SURFACE.SEPARATOR_SAMPLES ?? 1400

export function sonicLeftBranchIndicator(Y, t, z, { b1, b2 }) {
  return Y * (b1 * z - b2 + 2 * z) - 2 * b1 * t * (1 + z * z)
}

export function sonicRightBranchIndicator(Y, t, z, { b1, b2 }) {
  return -Y * (b1 * z - b2 + 2 * z) - 2 * b1 * t * (1 + z * z)
}

export function sonicSurfaceResolution(resolution) {
  return Math.max(
    SONIC_SURFACE.MIN_RESOLUTION ?? 112,
    Math.min(SONIC_SURFACE.MAX_RESOLUTION ?? 176, Math.round(resolution * (SONIC_SURFACE.RESOLUTION_MULTIPLIER ?? 2.85))),
  )
}

function buildSonicBaseGeometry(implicitFn, params, view, resolution, compactifiedZ = false) {
  const effectiveResolution = sonicSurfaceResolution(resolution)
  return buildImplicitSurfaceGeometry(implicitFn, params, view, effectiveResolution, 0.0, {
    zClusterNearZero: true,
    zClusterFraction: SONIC_SURFACE.Z_CLUSTER_FRACTION,
    zClusterPower: SONIC_SURFACE.Z_CLUSTER_POWER,
    compactifiedZ,
  })
}

export function buildSonicBranchGeometries(side, params, view, resolution) {
  const indicatorFn = side === 'left' ? sonicLeftBranchIndicator : sonicRightBranchIndicator
  const implicitFn = side === 'left' ? sonicLeftImplicitF : sonicImplicitF
  const baseGeometry = buildSonicBaseGeometry(implicitFn, params, view, resolution, true)
  const geometries = {
    slow: buildClippedBranchGeometry(
      baseGeometry,
      params,
      BRANCH_INDICATOR_EPS,
      (indicator) => indicator <= BRANCH_INDICATOR_EPS,
      indicatorFn,
    ),
    fast: buildClippedBranchGeometry(
      baseGeometry,
      params,
      -BRANCH_INDICATOR_EPS,
      (indicator) => indicator >= -BRANCH_INDICATOR_EPS,
      indicatorFn,
    ),
  }
  baseGeometry.dispose()
  return geometries
}

export function classifySonicPoint(side, point, params) {
  const indicatorFn = side === 'left' ? sonicLeftBranchIndicator : sonicRightBranchIndicator
  const indicator = indicatorFn(point.Y, point.t, point.z, params)
  if (!Number.isFinite(indicator) || Math.abs(indicator) <= BRANCH_INDICATOR_EPS) {
    return {
      label: side === 'left' ? 'fronteira entre sônicas esquerdas' : 'fronteira entre sônicas direitas',
      tex: side === 'left' ? '\\mathcal{S}^-' : '\\mathcal{S}^+',
      indicator,
    }
  }
  if (side === 'left') {
    return indicator < 0
      ? { label: 'sônica esquerda lenta', tex: '\\mathcal{S}^-_s', indicator }
      : { label: 'sônica esquerda rápida', tex: '\\mathcal{S}^-_f', indicator }
  }
  return indicator < 0
    ? { label: 'sônica direita lenta', tex: '\\mathcal{S}^+_s', indicator }
    : { label: 'sônica direita rápida', tex: '\\mathcal{S}^+_f', indicator }
}

function inView([t, Y, z], view, ignoreZ = false) {
  return (
    t >= view.tMin && t <= view.tMax &&
    Y >= view.yMin && Y <= view.yMax &&
    (ignoreZ || (z >= view.zMin && z <= view.zMax))
  )
}

export function buildSonicSeparatorSegments(side, params, view, { compactifiedZ = false } = {}) {
  const points = []
  const segments = []
  const pushCurrent = () => {
    if (points.length >= 2) segments.push([...points])
    points.length = 0
  }

  for (let i = 0; i <= SEPARATOR_SAMPLES; i += 1) {
    const fraction = i / SEPARATOR_SAMPLES
    const visualMargin = 1e-4
    const z = compactifiedZ
      ? visualZToPhysical(VISUAL_Z_MIN + visualMargin + fraction * (VISUAL_Z_MAX - VISUAL_Z_MIN - 2 * visualMargin))
      : view.zMin + fraction * (view.zMax - view.zMin)
    const solved = solveSonicBranchSeparatorPoint(side, z, params)
    const point = solved ? [solved.t, solved.Y, solved.z] : null
    if (!point || !inView(point, view, compactifiedZ)) {
      pushCurrent()
      continue
    }
    points.push(point)
  }

  pushCurrent()
  return segments
}
