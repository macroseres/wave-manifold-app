import {
  computeLeftStateFromWavePoint,
  computeRightStateFromWavePoint,
  computeStateFromCharacteristicPoint,
  waveSpeed,
} from '../../surfaceImplicit/index.js'

export function finiteOrUndefined(value) {
  return Number.isFinite(value) ? value : undefined
}

export function pointCoordinates(point) {
  if (!point) return { t: undefined, Y: undefined, z: undefined }
  return {
    t: finiteOrUndefined(point.t) ?? (Array.isArray(point.coords) ? point.coords[0] : undefined),
    Y: finiteOrUndefined(point.Y) ?? (Array.isArray(point.coords) ? point.coords[1] : 0),
    z: finiteOrUndefined(point.z) ?? (Array.isArray(point.coords) ? point.coords[2] : undefined),
  }
}

export function computeWavePointDiagnostics(point, params) {
  if (!point) return null

  const { t, Y, z } = pointCoordinates(point)
  const hasWaveCoordinates = Number.isFinite(t) && Number.isFinite(Y) && Number.isFinite(z)
  const hasCharacteristicCoordinates = Number.isFinite(t) && Number.isFinite(z)

  const leftState = hasWaveCoordinates ? computeLeftStateFromWavePoint(t, Y, z, params) : null
  const rightState = hasWaveCoordinates ? computeRightStateFromWavePoint(t, Y, z, params) : null
  const characteristicState = hasCharacteristicCoordinates ? computeStateFromCharacteristicPoint(t, z, params) : null

  const s = Number.isFinite(point.shockSpeed)
    ? point.shockSpeed
    : Number.isFinite(point.s)
      ? point.s
      : hasCharacteristicCoordinates
        ? waveSpeed(t, z, params)
        : Number.NaN

  return {
    ...point,
    t,
    Y,
    z,
    s,
    coords: point.coords ?? [t, Y, z],
    uMinus: finiteOrUndefined(point.uMinus) ?? leftState?.uMinus ?? characteristicState?.uMinus,
    vMinus: finiteOrUndefined(point.vMinus) ?? leftState?.vMinus ?? characteristicState?.vMinus,
    uPlus: finiteOrUndefined(point.uPlus) ?? rightState?.uPlus ?? characteristicState?.uMinus,
    vPlus: finiteOrUndefined(point.vPlus) ?? rightState?.vPlus ?? characteristicState?.vMinus,
  }
}

export function computeInspectionProbe(point, params) {
  if (!point?.branch) return point
  return {
    ...computeWavePointDiagnostics({ ...point, Y: Number.isFinite(point.Y) ? point.Y : 0 }, params),
    isInspectionProbe: true,
  }
}
