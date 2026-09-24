import { buildViscousPortrait } from '../entities/phasePortrait/viscousPortrait.js'

self.onmessage = ({ data: payload }) => {
  try {
    const { left, speed, params, bounds } = payload
    const data = buildViscousPortrait({ left, right: left, speed, rightIsEquilibrium: false }, params, bounds, { nullclines: true })
    self.postMessage({ data })
  } catch (error) {
    self.postMessage({ error: error?.message ?? String(error) })
  }
}
