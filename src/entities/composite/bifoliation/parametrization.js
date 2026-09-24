import { makeSaturatedHugoniotBifoliation } from '../../waves/saturatedBifoliation.js'
import { finite, normalizePoint, normalizedPointDistance, sonicValue, sonicBranchIndicator, sonicBranchMatches, sonicValueOnRarefaction } from './sampling.js'
import { physicalZToVisual } from '../../../geometry/zCompactification.js'

export function compositeContinuationView(fixedState, view) {
  // A janela recebida já é o domínio padronizado de desenho/cálculo.
  // No App.jsx ela é calcView = view com margem de 20% em z.
  // Mantemos a composta limitada a esse domínio para evitar que ela saia
  // muito além dos eixos visuais.
  return view
}

export function makeRarefactionParam(segment, view) {
  const clean = (segment ?? []).map(normalizePoint).filter(Boolean)
  if (clean.length < 2) return null
  const tauScale = Math.max(1, view.tMax - view.tMin)
  const zScale = Math.max(1, view.zMax - view.zMin)
  const s = [0]
  for (let i = 1; i < clean.length; i += 1) {
    const dz = view.compactifiedZ
      ? (physicalZToVisual(clean[i].z) - physicalZToVisual(clean[i - 1].z)) / 2
      : (clean[i].z - clean[i - 1].z) / zScale
    const dt = view.compactifiedZ
      ? (Math.atan(clean[i].t / tauScale) - Math.atan(clean[i - 1].t / tauScale)) / Math.PI
      : (clean[i].t - clean[i - 1].t) / tauScale
    const ds = Math.hypot(dt, dz)
    s.push(s[i - 1] + Math.max(ds, 1e-12))
  }
  const total = s[s.length - 1]
  if (!finite(total) || total <= 1e-12) return null

  const interpolate = (u) => {
    const target = u * total
    let lo = 0
    let hi = s.length - 1

    if (target <= 0) {
      lo = 0
      hi = 1
    } else if (target >= total) {
      lo = s.length - 2
      hi = s.length - 1
    } else {
      while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2)
        if (s[mid] <= target) lo = mid
        else hi = mid
      }
    }

    const denom = Math.max(1e-14, s[hi] - s[lo])
    const alpha = (target - s[lo]) / denom
    const a = clean[lo]
    const b = clean[hi]
    const t = a.t + alpha * (b.t - a.t)
    const z = a.z + alpha * (b.z - a.z)
    return { ...a, t, Y: 0, z, coords: [t, 0, z] }
  }

  const uAtIndex = (index, alpha = 0) => {
    const i = Math.max(0, Math.min(clean.length - 2, index))
    const target = s[i] + alpha * (s[i + 1] - s[i])
    return Math.max(0, Math.min(1, target / total))
  }

  return { points: clean, s, total, interpolate, uAtIndex }
}

export function makeCompositeLevelFunction(rareParam, params, direction, sonicTarget, etaMin, etaMax, desiredSonicBranch = 'all', mathcalR = null, mathcalH = null, compactifiedZ = false) {
  const saturation = makeSaturatedHugoniotBifoliation({
    rarefactionParam: rareParam,
    params,
    direction,
    etaMin,
    etaMax,
    sourceBifoliations: { mathcalR, mathcalH },
  })

  const etaFromW = compactifiedZ ? w => Math.tan((w - 0.5) * Math.PI * 0.9998) : saturation.etaFromW
  const wFromEta = compactifiedZ ? eta => 0.5 + Math.atan(eta) / (Math.PI * 0.9998) : saturation.wFromEta
  const evalAt = (u, w) => {
    if (compactifiedZ && (w < 0 || w > 1)) return null
    const obj = saturation.evaluate(u, compactifiedZ ? saturation.wFromEta(etaFromW(w)) : w)
    if (!obj?.point) return null
    if (!sonicBranchMatches(obj.point, params, sonicTarget, desiredSonicBranch)) return null
    const rawValue = sonicValue(obj.point, params, sonicTarget)
    const value = compactifiedZ ? rawValue / (1 + obj.point.z * obj.point.z) ** 2.5 : rawValue
    if (!finite(value)) return null
    const branchIndicator = sonicBranchIndicator(obj.point, params, sonicTarget)
    return { value, point: obj.point, generator: obj.generator, state: obj.state, eta: obj.eta, u, w, saturation, sonicBranch: desiredSonicBranch, sonicBranchIndicator: branchIndicator }
  }

  return { evalAt, etaFromW, wFromEta, saturation, compactifiedZ }
}

export function findRarefactionSonicAnchors(rareParam, params, sonicTarget, fixedState, view, desiredSonicBranch = 'all') {
  const anchors = []
  const points = rareParam.points
  const add = (u, point, residual = 0) => {
    if (!point || !finite(u)) return
    if (!sonicBranchMatches(point, params, sonicTarget, desiredSonicBranch)) return
    if (anchors.some((a) => Math.abs(a.u - u) < 1e-7)) return
    anchors.push({ u, point, eta: point.z, residual })
  }

  const interpPoint = (a, b, alpha) => {
    const t = a.t + alpha * (b.t - a.t)
    const z = a.z + alpha * (b.z - a.z)
    return { ...a, t, Y: 0, z, coords: [t, 0, z] }
  }

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]
    const b = points[i + 1]
    const fa = sonicValueOnRarefaction(a.t, a.z, params, sonicTarget)
    const fb = sonicValueOnRarefaction(b.t, b.z, params, sonicTarget)
    if (!finite(fa) || !finite(fb)) continue
    const scale = Math.max(1, Math.abs(fa), Math.abs(fb))
    const tol = 1e-8 * scale + 1e-10
    if (Math.abs(fa) <= tol) add(rareParam.uAtIndex(i, 0), a, Math.abs(fa))
    // The endpoint of a restricted rarefaction arc can be exactly the sonic
    // anchor J. Test b explicitly; relying only on a sign change may miss a
    // tangential or same-sign endpoint after floating-point refinement.
    if (Math.abs(fb) <= tol) add(rareParam.uAtIndex(i, 1), b, Math.abs(fb))
    if (fa * fb <= 0) {
      let lo = 0
      let hi = 1
      let flo = fa
      for (let k = 0; k < 64; k += 1) {
        const mid = 0.5 * (lo + hi)
        const p = interpPoint(a, b, mid)
        const fm = sonicValueOnRarefaction(p.t, p.z, params, sonicTarget)
        if (!finite(fm)) break
        if (Math.abs(fm) <= tol || Math.abs(hi - lo) < 1e-12) {
          add(rareParam.uAtIndex(i, mid), p, Math.abs(fm))
          break
        }
        if (flo * fm <= 0) hi = mid
        else { lo = mid; flo = fm }
      }
    }
  }

  if (!anchors.length) {
    // Tangential fallback on R ∩ S: minimize |S(R(u))| on each coarse interval.
    const n = Math.min(220, Math.max(80, points.length - 1))
    let best = null
    for (let k = 0; k <= n; k += 1) {
      const u = k / n
      const p = rareParam.interpolate(u)
      const f = sonicValueOnRarefaction(p.t, p.z, params, sonicTarget)
      if (finite(f) && (!best || Math.abs(f) < best.abs)) best = { u, point: p, abs: Math.abs(f) }
    }
    if (best && best.abs < 1e-5) add(best.u, best.point, best.abs)
  }

  return anchors
    .map((anchor) => ({
      ...anchor,
      score: normalizedPointDistance(anchor.point, fixedState ?? { t: 0, Y: 0, z: 0 }, view) + 20 * Math.min(1, anchor.residual ?? 0),
    }))
    .sort((a, b) => a.score - b.score)
}
