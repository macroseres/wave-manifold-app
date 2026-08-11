import { solveDoubleSonicSegments } from '../../surfaceImplicit/index.js'
import { COMPOSITE } from '../../../config/numerics.js'
import { finite, limitUnitFocuses, normalizePoint, normalizedPointDistance } from './sampling.js'

function gradient(level, u, w) {
  const hu = Math.max(1e-5, 2e-4 * Math.max(1, Math.abs(u)))
  const hw = Math.max(1e-5, 2e-4 * Math.max(1, Math.abs(w)))
  const u0 = u - hu
  const u1 = u + hu
  const w0 = w - hw
  const w1 = w + hw
  const fu0 = level.evalAt(u0, w)
  const fu1 = level.evalAt(u1, w)
  const fw0 = level.evalAt(u, w0)
  const fw1 = level.evalAt(u, w1)
  if (!fu0 || !fu1 || !fw0 || !fw1) return null
  const du = Math.max(1e-12, u1 - u0)
  const dw = Math.max(1e-12, w1 - w0)
  const gu = (fu1.value - fu0.value) / du
  const gw = (fw1.value - fw0.value) / dw
  if (![gu, gw].every(finite)) return null
  const n = Math.hypot(gu, gw)
  return n > 1e-12 ? { gu, gw, norm: n } : null
}

function tangentFromGradient(grad, previousTangent = null, sign = 1) {
  if (!grad) return null
  let t = [grad.gw / grad.norm, -grad.gu / grad.norm]
  if (sign < 0) t = [-t[0], -t[1]]
  if (previousTangent && (t[0] * previousTangent[0] + t[1] * previousTangent[1]) < 0) {
    t = [-t[0], -t[1]]
  }
  return t
}

function correctPseudoArclength(level, predU, predW, baseU, baseW, tangent, maxIter = 14) {
  let u = predU
  let w = predW
  let best = null
  const [tu, tw] = tangent
  for (let iter = 0; iter < maxIter; iter += 1) {
    const obj = level.evalAt(u, w)
    const grad = gradient(level, u, w)
    if (!obj || !grad) return best
    const f1 = obj.value
    const f2 = (u - predU) * tu + (w - predW) * tw
    const residual = Math.hypot(f1 / Math.max(1, Math.abs(f1), grad.norm), f2)
    if (!best || residual < best.residual) best = { u, w, obj, residual }
    if (Math.abs(f1) < 1e-7 * Math.max(1, Math.abs(obj.value), grad.norm) && Math.abs(f2) < 2e-7) {
      return { u, w, obj, residual: 0 }
    }

    // Newton for [F(u,w), arclength(u,w)] = 0.
    const a = grad.gu
    const b = grad.gw
    const c = tu
    const d = tw
    const det = a * d - b * c
    if (!finite(det) || Math.abs(det) < 1e-14) break
    let du = (-f1 * d + b * f2) / det
    let dw = (c * f1 - a * f2) / det
    const maxDelta = 0.08
    const deltaNorm = Math.hypot(du, dw)
    if (deltaNorm > maxDelta) {
      du *= maxDelta / deltaNorm
      dw *= maxDelta / deltaNorm
    }
    if (![du, dw].every(finite)) break
    u += du
    w += dw
    if (!insideCompositeBounds(u, w, 0.03)) break
  }
  return best
}

function insideZWindow(point, view) {
  const z = point?.z ?? point?.coords?.[2]
  return Number.isFinite(z) && z >= view.zMin && z <= view.zMax
}

function interpolatePointAtZ(a, b, z) {
  const za = a?.z ?? a?.coords?.[2]
  const zb = b?.z ?? b?.coords?.[2]
  if (![za, zb, z].every(finite) || Math.abs(zb - za) < 1e-14) return null
  const alpha = (z - za) / (zb - za)
  if (alpha < -1e-10 || alpha > 1 + 1e-10) return null
  const t = (a.t ?? a.coords?.[0]) + alpha * ((b.t ?? b.coords?.[0]) - (a.t ?? a.coords?.[0]))
  const Y = (a.Y ?? a.coords?.[1] ?? 0) + alpha * ((b.Y ?? b.coords?.[1] ?? 0) - (a.Y ?? a.coords?.[1] ?? 0))
  return { ...a, t, Y, z, coords: [t, Y, z] }
}

function zBoundaryCrossing(a, b, view) {
  const za = a?.z ?? a?.coords?.[2]
  const zb = b?.z ?? b?.coords?.[2]
  if (![za, zb].every(finite)) return null
  const crossesMin = (za < view.zMin && zb >= view.zMin) || (za >= view.zMin && zb < view.zMin)
  const crossesMax = (za <= view.zMax && zb > view.zMax) || (za > view.zMax && zb <= view.zMax)
  if (crossesMin) return interpolatePointAtZ(a, b, view.zMin)
  if (crossesMax) return interpolatePointAtZ(a, b, view.zMax)
  return null
}

export function splitSegmentsByZWindow(segments, view) {
  const out = []
  for (const rawSegment of segments ?? []) {
    const segment = (rawSegment ?? []).map(normalizePoint).filter(Boolean)
    if (segment.length < 2) continue
    let current = []
    for (let i = 0; i < segment.length; i += 1) {
      const point = segment[i]
      const prev = i > 0 ? segment[i - 1] : null
      const inside = insideZWindow(point, view)
      if (prev) {
        const crossing = zBoundaryCrossing(prev, point, view)
        if (crossing) {
          if (inside) current.push(crossing)
          else if (current.length) {
            current.push(crossing)
            if (current.length >= 2) out.push(current)
            current = []
          }
        }
      }
      if (inside) current.push(point)
      else if (current.length) {
        if (current.length >= 2) out.push(current)
        current = []
      }
    }
    if (current.length >= 2) out.push(current)
  }
  return out
}


export function compositeBounds() {
  return {
    uMin: -Math.max(0, COMPOSITE.U_MARGIN ?? 0),
    uMax: 1 + Math.max(0, COMPOSITE.U_MARGIN ?? 0),
    wMin: -Math.max(0, COMPOSITE.W_MARGIN ?? 0),
    wMax: 1 + Math.max(0, COMPOSITE.W_MARGIN ?? 0),
  }
}

function insideCompositeBounds(u, w, margin = 0) {
  const b = compositeBounds()
  return u >= b.uMin - margin && u <= b.uMax + margin && w >= b.wMin - margin && w <= b.wMax + margin
}

export function doubleSonicZValues(params, view) {
  return solveDoubleSonicSegments(params, view)
    .map((segment) => segment?.[0]?.[2])
    .filter(finite)
}

function interpolateUnitCrossing(a, b, axisMin, axisSpan) {
  const denom = a.value - b.value
  const alpha = Math.abs(denom) > 1e-14 ? a.value / denom : 0.5
  const raw = a.coord + Math.max(0, Math.min(1, alpha)) * (b.coord - a.coord)
  return (raw - axisMin) / Math.max(1e-12, axisSpan)
}

export function collectDoubleSonicUvFocuses(level, bounds, doubleSonicZs) {
  const uFocuses = []
  const wFocuses = []
  const uSpan = bounds.uMax - bounds.uMin
  const wSpan = bounds.wMax - bounds.wMin
  const uProbes = 42
  const wProbes = 54

  for (const targetZ of doubleSonicZs) {
    for (let i = 0; i <= uProbes; i += 1) {
      const u = bounds.uMin + (i / uProbes) * uSpan
      let previous = null
      for (let j = 0; j <= wProbes; j += 1) {
        const w = bounds.wMin + (j / wProbes) * wSpan
        const point = level.evalAt(u, w)?.point
        const current = point?.coords?.every(finite) ? { coord: w, value: point.z - targetZ } : null
        if (previous && current && previous.value * current.value <= 0) {
          wFocuses.push(interpolateUnitCrossing(previous, current, bounds.wMin, wSpan))
        }
        if (current && Math.abs(current.value) < 1e-5) {
          wFocuses.push((current.coord - bounds.wMin) / Math.max(1e-12, wSpan))
        }
        previous = current
      }
    }

    for (let j = 0; j <= wProbes; j += 1) {
      const w = bounds.wMin + (j / wProbes) * wSpan
      let previous = null
      for (let i = 0; i <= uProbes; i += 1) {
        const u = bounds.uMin + (i / uProbes) * uSpan
        const point = level.evalAt(u, w)?.point
        const current = point?.coords?.every(finite) ? { coord: u, value: point.z - targetZ } : null
        if (previous && current && previous.value * current.value <= 0) {
          uFocuses.push(interpolateUnitCrossing(previous, current, bounds.uMin, uSpan))
        }
        if (current && Math.abs(current.value) < 1e-5) {
          uFocuses.push((current.coord - bounds.uMin) / Math.max(1e-12, uSpan))
        }
        previous = current
      }
    }
  }

  return {
    u: limitUnitFocuses(uFocuses, 12),
    w: limitUnitFocuses(wFocuses, 12),
  }
}

export function traceLevelSet(level, seedU, seedW, sign, view, options = {}) {
  const out = []
  let u = seedU
  let w = seedW
  let prevTangent = null
  // Passo padronizado para evitar milhares de pontos na composta.
  // A curva continua sendo corrigida por pseudo-arclength; a densidade visual
  // final fica a cargo do componente de desenho.
  const step = options.step ?? COMPOSITE.CONTINUATION_STEP
  const maxSteps = options.maxSteps ?? COMPOSITE.MAX_STEPS
  const maxJump = options.maxJump ?? COMPOSITE.MAX_JUMP
  let previousPoint = null

  const seed = level.evalAt(u, w)
  if (!seed?.point) return []

  for (let k = 0; k < maxSteps; k += 1) {
    if (!insideCompositeBounds(u, w)) break
    const current = level.evalAt(u, w)
    if (!current?.point) break
    const point = current.point
    if (!point.coords?.every(finite)) break
    if (previousPoint && normalizedPointDistance(point, previousPoint, view) > maxJump) break
    out.push(point)
    previousPoint = point

    const grad = gradient(level, u, w)
    let tangent = tangentFromGradient(grad, prevTangent, sign)
    if (!tangent) break
    prevTangent = tangent

    let accepted = null
    let localStep = step
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const predU = u + localStep * tangent[0]
      const predW = w + localStep * tangent[1]
      const corrected = correctPseudoArclength(level, predU, predW, u, w, tangent)
      if (corrected?.obj?.point && insideCompositeBounds(corrected.u, corrected.w)) {
        const candidatePoint = corrected.obj.point
        const jump = normalizedPointDistance(candidatePoint, point, view)
        if (jump <= Math.max(0.012, maxJump)) {
          accepted = corrected
          break
        }
      }
      localStep *= 0.5
    }
    if (!accepted) break
    u = accepted.u
    w = accepted.w
  }
  return out
}


