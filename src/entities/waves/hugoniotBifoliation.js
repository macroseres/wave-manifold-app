import { BACKWARD_HUGONIOT, FORWARD_HUGONIOT, normalizeHugoniotDirection } from '../hugoniot/directions.js'
import {
  solveBackwardHugoniotPointForFixedRightState as solveRawBackwardHugoniotPointForFixedRightState,
  solveHugoniotPointForFixedState as solveRawHugoniotPointForFixedState,
  waveSpeed,
} from '../surfaceImplicit/index.js'
import { orientationFromDirection } from './orientation.js'

export function hugoniotBranchFromDirection(direction = FORWARD_HUGONIOT) {
  return normalizeHugoniotDirection(direction) === BACKWARD_HUGONIOT ? 'plus' : 'minus'
}

export function hugoniotDirectionFromBranch(branch = 'minus') {
  return branch === 'plus' || branch === BACKWARD_HUGONIOT ? BACKWARD_HUGONIOT : FORWARD_HUGONIOT
}

function decorateHugoniotPoint(point, { direction, params, fixedState } = {}) {
  if (!point || ![point.t, point.Y, point.z].every(Number.isFinite)) return null
  const branch = hugoniotBranchFromDirection(direction)
  const orientation = orientationFromDirection({ family: 'hugoniot', direction: branch })
  const shockSpeed = waveSpeed(point.t, point.z, params)
  return {
    ...point,
    coords: [point.t, point.Y, point.z],
    family: 'hugoniot',
    branch,
    direction: branch,
    orientation,
    hugoniotDirection: normalizeHugoniotDirection(direction),
    shockSpeed: Number.isFinite(shockSpeed) ? shockSpeed : undefined,
    fixedState,
  }
}

/**
 * Único ponto de entrada para avaliar uma folha da bifolheação de Hugoniot.
 *
 * Convenção:
 *   direction = FORWARD_HUGONIOT  => H_- com U_L fixo, orientada por ds < 0.
 *   direction = BACKWARD_HUGONIOT => H_+ com U_R fixo, orientada por ds > 0.
 */
export function evaluateHugoniotLeafPoint({ z, fixedState, params, direction = FORWARD_HUGONIOT }) {
  const normalizedDirection = normalizeHugoniotDirection(direction)
  const point = normalizedDirection === BACKWARD_HUGONIOT
    ? solveRawBackwardHugoniotPointForFixedRightState(z, fixedState, params)
    : solveRawHugoniotPointForFixedState(z, fixedState, params)
  return decorateHugoniotPoint(point, { direction: normalizedDirection, params, fixedState })
}

export function solveHugoniotMinusLeafPoint(z, fixedState, params) {
  return evaluateHugoniotLeafPoint({ z, fixedState, params, direction: FORWARD_HUGONIOT })
}

export function solveHugoniotPlusLeafPoint(z, fixedState, params) {
  return evaluateHugoniotLeafPoint({ z, fixedState, params, direction: BACKWARD_HUGONIOT })
}

// Wrappers compatíveis para migrar código antigo sem mudar assinaturas.
export function solveHugoniotPointForFixedState(z, fixedState, params) {
  return solveHugoniotMinusLeafPoint(z, fixedState, params)
}

export function solveBackwardHugoniotPointForFixedRightState(z, fixedRightState, params) {
  return solveHugoniotPlusLeafPoint(z, fixedRightState, params)
}
