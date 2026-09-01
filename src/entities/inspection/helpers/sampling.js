import { buildHugoniotBifoliation, buildRarefactionBifoliation, buildCompositeBifoliation, selectLeafFromBifoliation } from '../../waves/index.js'
import { solveInflectionSegments, computeLeftStateFromWavePoint, computeRightStateFromWavePoint } from '../../surfaceImplicit/index.js'
import { FORWARD_HUGONIOT, BACKWARD_HUGONIOT } from '../../hugoniot/directions.js'
import { finite } from './coordinates.js'
import { HUGONIOT } from '../../../config/numerics.js'

export function withStates(point, params) {
  const left = computeLeftStateFromWavePoint(point.t, point.Y ?? 0, point.z, params)
  const right = computeRightStateFromWavePoint(point.t, point.Y ?? 0, point.z, params)
  return {
    ...point,
    uMinus: left?.uMinus,
    vMinus: left?.vMinus,
    uPlus: right?.uPlus,
    vPlus: right?.vPlus,
  }
}

function fixedMinus(point, params) {
  const decorated = withStates(point, params)
  return {
    t: decorated.t,
    Y: decorated.Y ?? 0,
    z: decorated.z,
    uMinus: decorated.uMinus,
    vMinus: decorated.vMinus,
    uPlus: decorated.uPlus,
    vPlus: decorated.vPlus,
  }
}

function fixedPlus(point, params) {
  const decorated = withStates(point, params)
  return {
    t: decorated.t,
    Y: decorated.Y ?? 0,
    z: decorated.z,
    uMinus: decorated.uMinus,
    vMinus: decorated.vMinus,
    uPlus: decorated.uPlus,
    vPlus: decorated.vPlus,
  }
}

export function sampleHugoniot({ point, params, view, direction, samples, zExtensionMargin = 0 }) {
  const fixedState = direction === BACKWARD_HUGONIOT ? fixedPlus(point, params) : fixedMinus(point, params)
  if (!fixedState || ![fixedState.uMinus, fixedState.vMinus, fixedState.uPlus, fixedState.vPlus].some(finite)) return []
  const bifoliation = buildHugoniotBifoliation({ fixedState, params, view, samples, zExtensionMargin })
  const leaf = selectLeafFromBifoliation(bifoliation, direction === BACKWARD_HUGONIOT ? 'plus' : 'minus')
  return leaf?.curve?.segments ?? []
}

function branchDirection(branch) {
  return branch === 'fast' ? BACKWARD_HUGONIOT : FORWARD_HUGONIOT
}

export function sampleRarefaction({ point, params, view, samples, branch, zExtensionMargin = 0 }) {
  const direction = branchDirection(branch)
  const fixedState = direction === BACKWARD_HUGONIOT ? fixedPlus(point, params) : fixedMinus(point, params)
  if (!fixedState || ![fixedState.uMinus, fixedState.vMinus, fixedState.uPlus, fixedState.vPlus].some(finite)) return []
  const zSpan = Math.max(1, view.zMax - view.zMin)
  const extendedView = zExtensionMargin > 0
    ? { ...view, zMin: view.zMin - zExtensionMargin * zSpan, zMax: view.zMax + zExtensionMargin * zSpan }
    : view
  const bifoliation = buildRarefactionBifoliation({ fixedState, params, view: extendedView, samples, constrainZ: true })
  const leaf = selectLeafFromBifoliation(bifoliation, direction === BACKWARD_HUGONIOT ? 'plus' : 'minus')
  return leaf?.curve?.segments ?? []
}

export const PROBE_Z_EXTENSION_MARGIN = HUGONIOT.Z_EXTENSION_MARGIN

export function sampleComposite({ point, params, view, samples, resolution, branch }) {
  const direction = branchDirection(branch)
  const fixedState = direction === BACKWARD_HUGONIOT ? fixedPlus(point, params) : fixedMinus(point, params)
  if (!fixedState || ![fixedState.uMinus, fixedState.vMinus, fixedState.uPlus, fixedState.vPlus].some(finite)) return []
  const bifoliation = buildCompositeBifoliation({ fixedState, params, view, samples, resolution })
  const leafName = direction === BACKWARD_HUGONIOT ? 'plus' : 'minus'
  const leaf = selectLeafFromBifoliation(bifoliation, leafName)
  return leaf?.curve?.segments ?? []
}

export function sampleInflection({ params, view, samples, branch }) {
  return solveInflectionSegments(params, view, samples, branch) ?? []
}
