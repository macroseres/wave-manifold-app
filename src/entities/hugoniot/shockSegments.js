import {
  sonicImplicitF,
  sonicLeftImplicitF,
  solveHugoniotPointForFixedState,
  solveBackwardHugoniotPointForFixedRightState,
  waveSpeed,
} from '../surfaceImplicit/index.js'

function finite(value) {
  return Number.isFinite(value)
}

export function validShockPoint(point) {
  return point && [point.t, point.Y, point.z].every(finite)
}

function expandedView(view, tMargin = 1.4, yMargin = 1.4, zMargin = 0) {
  const tSpan = Math.max(1, view.tMax - view.tMin)
  const ySpan = Math.max(1, view.yMax - view.yMin)
  const zSpan = Math.max(1, view.zMax - view.zMin)
  return {
    ...view,
    tMin: view.tMin - tMargin * tSpan,
    tMax: view.tMax + tMargin * tSpan,
    yMin: view.yMin - yMargin * ySpan,
    yMax: view.yMax + yMargin * ySpan,
    zMin: view.zMin - zMargin * zSpan,
    zMax: view.zMax + zMargin * zSpan,
  }
}

function inExpandedWindow(point, view, margin = 0.08) {
  const yPad = margin * Math.max(1, view.yMax - view.yMin)
  return (
    point &&
    finite(point.t) &&
    point.Y >= view.yMin - yPad &&
    point.Y <= view.yMax + yPad &&
    point.z >= view.zMin &&
    point.z <= view.zMax
  )
}

function decoratePoint(point, params) {
  if (!point) return null
  const shockSpeed = waveSpeed(point.t, point.z, params)
  if (!finite(shockSpeed)) return null
  return {
    ...point,
    shockSpeed,
    coords: [point.t, point.Y, point.z],
  }
}

function hugoniotPointAt(z, fixedState, params, direction = 'forward') {
  return direction === 'backward'
    ? solveBackwardHugoniotPointForFixedRightState(z, fixedState, params)
    : solveHugoniotPointForFixedState(z, fixedState, params)
}

function speedIsMonotone(point, previous, speedMode) {
  return speedMode === 'increasing'
    ? point.shockSpeed > previous.shockSpeed + 1e-9
    : point.shockSpeed < previous.shockSpeed - 1e-9
}

function traceMonotoneBranch(start, fixedState, params, view, direction, steps, hugoniotDirection = 'forward', speedMode = 'decreasing') {
  const points = [start]
  let previous = start
  const zEnd = direction > 0 ? view.zMax : view.zMin
  const total = Math.abs(zEnd - start.z)
  if (total <= 1e-12) return []

  const h = direction * total / Math.max(steps, 1)
  const maxJumpT = 0.35 * Math.max(1, view.tMax - view.tMin)
  const maxJumpY = 0.35 * Math.max(1, view.yMax - view.yMin)

  for (let i = 1; i <= steps; i += 1) {
    const z = start.z + i * h
    const point = decoratePoint(hugoniotPointAt(z, fixedState, params, hugoniotDirection), params)
    if (!validShockPoint(point) || !inExpandedWindow(point, view)) break

    const jumpT = Math.abs(point.t - previous.t)
    const jumpY = Math.abs(point.Y - previous.Y)
    if (jumpT > maxJumpT || jumpY > maxJumpY) break
    if (!speedIsMonotone(point, previous, speedMode)) break

    points.push(point)
    previous = point
  }

  return points.length >= 2 ? points : []
}

function sonicValueOnHugoniot(z, fixedState, params, direction = 'forward', sonicTarget = 'right') {
  const point = decoratePoint(hugoniotPointAt(z, fixedState, params, direction), params)
  if (!validShockPoint(point)) return null
  const value = sonicTarget === 'left'
    ? sonicLeftImplicitF(point.Y, point.t, point.z, params)
    : sonicImplicitF(point.Y, point.t, point.z, params)
  if (!finite(value)) return null
  return { value, point }
}

function solveSonicOnHugoniot(a, b, fixedState, params, direction = 'forward', sonicTarget = 'right') {
  let left = a
  let right = b
  let leftObj = sonicValueOnHugoniot(left, fixedState, params, direction, sonicTarget)
  let rightObj = sonicValueOnHugoniot(right, fixedState, params, direction, sonicTarget)
  if (!leftObj || !rightObj) return null
  if (Math.abs(leftObj.value) < 1e-8) return leftObj.point
  if (Math.abs(rightObj.value) < 1e-8) return rightObj.point
  if (leftObj.value * rightObj.value > 0) return null

  for (let i = 0; i < 60; i += 1) {
    const mid = 0.5 * (left + right)
    const midObj = sonicValueOnHugoniot(mid, fixedState, params, direction, sonicTarget)
    if (!midObj) return null
    if (Math.abs(midObj.value) < 1e-9 || Math.abs(right - left) < 1e-10) return midObj.point

    if (leftObj.value * midObj.value <= 0) {
      right = mid
      rightObj = midObj
    } else {
      left = mid
      leftObj = midObj
    }
  }

  return sonicValueOnHugoniot(0.5 * (left + right), fixedState, params, direction, sonicTarget)?.point ?? null
}

function traceMonotoneToSonic(start, fixedState, params, view, direction, steps, hugoniotDirection = 'forward', speedMode = 'decreasing', sonicTarget = 'right') {
  const points = [start]
  let previous = start
  let previousSonic = sonicTarget === 'left' ? sonicLeftImplicitF(start.Y, start.t, start.z, params) : sonicImplicitF(start.Y, start.t, start.z, params)
  if (!finite(previousSonic)) return null

  const zEnd = direction > 0 ? view.zMax : view.zMin
  const total = Math.abs(zEnd - start.z)
  if (total <= 1e-12) return null

  const h = direction * total / Math.max(steps, 1)
  const maxJumpT = 0.45 * Math.max(1, view.tMax - view.tMin)
  const maxJumpY = 0.45 * Math.max(1, view.yMax - view.yMin)
  let best = { residual: Math.abs(previousSonic), index: 0, point: start }

  for (let i = 1; i <= steps; i += 1) {
    const z = start.z + i * h
    const current = sonicValueOnHugoniot(z, fixedState, params, hugoniotDirection, sonicTarget)
    if (!current || !validShockPoint(current.point)) break

    const point = current.point
    const jumpT = Math.abs(point.t - previous.t)
    const jumpY = Math.abs(point.Y - previous.Y)
    if (jumpT > maxJumpT || jumpY > maxJumpY) break
    if (!speedIsMonotone(point, previous, speedMode)) break

    const residual = Math.abs(current.value)
    if (residual < best.residual) best = { residual, index: points.length, point }

    if (residual < 1e-8 || previousSonic * current.value <= 0) {
      const sonicPoint = solveSonicOnHugoniot(previous.z, z, fixedState, params, hugoniotDirection, sonicTarget) ?? point
      return { segment: [...points, sonicPoint], closed: true, residual: 0 }
    }

    points.push(point)
    previous = point
    previousSonic = current.value
  }

  if (best.index <= 0) return null
  const segment = points.slice(0, best.index + 1)
  segment[segment.length - 1] = best.point
  return segment.length >= 2 ? { segment, closed: false, residual: best.residual } : null
}

function buildNonLocalShockSegment(fixedState, anchorPoint, params, view, samples = 1600, options = {}) {
  if (!fixedState || !validShockPoint(anchorPoint)) return []

  const calcView = expandedView(view, 1.8, 1.8, 0)
  const start = decoratePoint((options.useAnchorPoint ? anchorPoint : hugoniotPointAt(anchorPoint.z, fixedState, params, options.hugoniotDirection ?? 'forward')) ?? anchorPoint, params)
  if (!validShockPoint(start)) return []

  const halfSteps = Math.max(800, Math.floor(samples / 2))
  const candidates = [-1, 1]
    .map((direction) => traceMonotoneToSonic(start, fixedState, params, calcView, direction, halfSteps, options.hugoniotDirection ?? 'forward', options.speedMode ?? 'decreasing', options.sonicTarget ?? 'right'))
    .filter((candidate) => candidate?.segment?.length >= 2)
    .map((candidate) => ({
      ...candidate,
      zDistance: Math.abs(candidate.segment[candidate.segment.length - 1].z - start.z),
    }))

  if (!candidates.length) return []
  candidates.sort((a, b) => (
    Number(b.closed) - Number(a.closed) ||
    a.residual - b.residual ||
    a.zDistance - b.zDistance
  ))
  return [candidates[0].segment]
}

export function buildShockSegments(fixedState, anchorPoint, params, view, samples = 1600, options = {}) {
  if (!fixedState || !anchorPoint || !finite(anchorPoint.z)) return []
  if (options.nonLocal) return buildNonLocalShockSegment(fixedState, anchorPoint, params, view, samples, options)

  const zMargin = options.zMargin ?? 0
  const calcView = expandedView(view, options.expanded ? 1.8 : 1.4, options.expanded ? 1.8 : 1.4, zMargin)
  const baseStart = options.useAnchorPoint
    ? anchorPoint
    : hugoniotPointAt(anchorPoint.z, fixedState, params, options.hugoniotDirection ?? 'forward')
  const start = decoratePoint(baseStart, params)
  if (!validShockPoint(start)) return []
  if (!options.expanded && !inExpandedWindow(start, calcView, 0.12)) return []

  const halfSteps = Math.max(800, Math.floor(samples / 2))
  const backward = traceMonotoneBranch(start, fixedState, params, calcView, -1, halfSteps, options.hugoniotDirection ?? 'forward', options.speedMode ?? 'decreasing')
  const forward = traceMonotoneBranch(start, fixedState, params, calcView, 1, halfSteps, options.hugoniotDirection ?? 'forward', options.speedMode ?? 'decreasing')

  return [backward, forward].filter((segment) => segment.length >= 2)
}
