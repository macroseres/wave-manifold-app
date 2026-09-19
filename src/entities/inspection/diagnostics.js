import { legacyHysteresisRightImplicitF } from '../surfaceImplicit/sonic.js'
import {
  computeLeftStateFromWavePoint,
  computeRightStateFromWavePoint,
  sonicImplicitF,
  sonicLeftImplicitF,
  hysteresisRightImplicitF,
  waveSpeed,
} from '../surfaceImplicit/index.js'

const EPS = 1e-9
const SONIC_TOL = 1e-5

function finite(value) {
  return Number.isFinite(value)
}

function safeAbs(value) {
  return Number.isFinite(value) ? Math.abs(value) : Number.POSITIVE_INFINITY
}

function scaledResidual(value, scale = 1) {
  const denominator = Math.max(EPS, Math.abs(scale))
  return safeAbs(value) / denominator
}

function normalizerForPoint(t, Y, z) {
  return 1 + Math.abs(t) + Math.abs(Y) + Math.abs(z)
}

export function eigenvaluesAtState(u, v, params) {
  if (!params || !finite(u) || !finite(v)) {
    return { lambdaSlow: Number.NaN, lambdaFast: Number.NaN, discriminant: Number.NaN }
  }
  const { a = 0, b1, b2, c } = params
  const A = (b1 + 1) * u + a
  const B = v
  const C = v + c
  const D = u - b2 * v + a
  const tr = A + D
  const det = A * D - B * C
  const discriminant = tr * tr - 4 * det
  const root = Math.sqrt(Math.max(0, discriminant))
  return {
    lambdaSlow: 0.5 * (tr - root),
    lambdaFast: 0.5 * (tr + root),
    discriminant,
  }
}

function classifySonicBranch({ s, leftEigen, rightEigen }) {
  const candidates = [
    { key: 'S^-_s', label: 'S^- lenta', residual: safeAbs(s - leftEigen.lambdaSlow) },
    { key: 'S^-_f', label: 'S^- rápida', residual: safeAbs(s - leftEigen.lambdaFast) },
    { key: 'S^+_s', label: 'S^+ lenta', residual: safeAbs(s - rightEigen.lambdaSlow) },
    { key: 'S^+_f', label: 'S^+ rápida', residual: safeAbs(s - rightEigen.lambdaFast) },
  ].filter((item) => finite(item.residual))

  candidates.sort((a, b) => a.residual - b.residual)
  const best = candidates[0] ?? null
  return {
    candidates,
    best,
    label: best && best.residual <= SONIC_TOL ? best.label : best ? `mais próximo de ${best.label}` : 'indefinido',
  }
}

export function normalizeInspectionPoint(point, params) {
  if (!point) return null
  const t = finite(point.t) ? point.t : Array.isArray(point.coords) ? point.coords[0] : Number.NaN
  const Y = finite(point.Y) ? point.Y : Array.isArray(point.coords) ? point.coords[1] : 0
  const z = finite(point.z) ? point.z : Array.isArray(point.coords) ? point.coords[2] : Number.NaN
  if (!finite(t) || !finite(Y) || !finite(z)) return null

  const leftState = computeLeftStateFromWavePoint(t, Y, z, params)
  const rightState = computeRightStateFromWavePoint(t, Y, z, params)
  const s = finite(point.s) ? point.s : waveSpeed(t, z, params)
  const leftEigen = eigenvaluesAtState(leftState?.uMinus, leftState?.vMinus, params)
  const rightEigen = eigenvaluesAtState(rightState?.uPlus, rightState?.vPlus, params)
  const branch = classifySonicBranch({ s, leftEigen, rightEigen })

  return {
    ...point,
    t,
    Y,
    z,
    coords: [t, Y, z],
    s,
    uMinus: leftState?.uMinus,
    vMinus: leftState?.vMinus,
    uPlus: rightState?.uPlus,
    vPlus: rightState?.vPlus,
    leftEigen,
    rightEigen,
    branchClassification: branch,
  }
}

export function inspectionResiduals(point, params, visibleSets = {}) {
  const normalized = normalizeInspectionPoint(point, params)
  if (!normalized) return []
  const { t, Y, z } = normalized
  const scale = normalizerForPoint(t, Y, z)
  const sMinus = sonicLeftImplicitF(Y, t, z, params)
  const sPlus = sonicImplicitF(Y, t, z, params)
  const hysPlus = hysteresisRightImplicitF(Y, t, z, params)
  const hysMinus = legacyHysteresisRightImplicitF(-Y, t, z, params)

  const entries = [
    { key: 'S-', label: 'S^-', residual: scaledResidual(sMinus, scale), raw: sMinus, visible: visibleSets.sonicLeft !== false },
    { key: 'S+', label: 'S^+', residual: scaledResidual(sPlus, scale), raw: sPlus, visible: visibleSets.sonicRight !== false },
    { key: 'R-', label: 'R_- / C_s', residual: safeAbs(Y), raw: Y, visible: visibleSets.rarefactionSlow !== false },
    { key: 'R+', label: 'R_+ / C_f', residual: safeAbs(Y), raw: Y, visible: visibleSets.rarefactionFast !== false },
    { key: 'Hys-', label: 'Hys^-', residual: scaledResidual(sMinus, scale) + scaledResidual(hysMinus, scale), raw: hysMinus, visible: visibleSets.hysteresisLeft !== false },
    { key: 'Hys+', label: 'Hys^+', residual: scaledResidual(sPlus, scale) + scaledResidual(hysPlus, scale), raw: hysPlus, visible: visibleSets.hysteresisRight !== false },
  ]

  return entries
    .filter((item) => item.visible && finite(item.residual))
    .sort((a, b) => a.residual - b.residual)
}

export function compareInspectionPoints(a, b, params) {
  const pa = normalizeInspectionPoint(a, params)
  const pb = normalizeInspectionPoint(b, params)
  if (!pa || !pb) return null
  return {
    dt: pb.t - pa.t,
    dY: pb.Y - pa.Y,
    dz: pb.z - pa.z,
    ds: pb.s - pa.s,
    distance: Math.hypot(pb.t - pa.t, pb.Y - pa.Y, pb.z - pa.z),
    duMinus: pb.uMinus - pa.uMinus,
    dvMinus: pb.vMinus - pa.vMinus,
    duPlus: pb.uPlus - pa.uPlus,
    dvPlus: pb.vPlus - pa.vPlus,
  }
}

