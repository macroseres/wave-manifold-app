export const FORWARD_HUGONIOT = 'forward'
export const BACKWARD_HUGONIOT = 'backward'

export function normalizeHugoniotDirection(direction) {
  return direction === BACKWARD_HUGONIOT ? BACKWARD_HUGONIOT : FORWARD_HUGONIOT
}

export function isBackwardHugoniot(direction) {
  return normalizeHugoniotDirection(direction) === BACKWARD_HUGONIOT
}


