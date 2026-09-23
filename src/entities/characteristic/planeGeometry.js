import * as THREE from 'three'
import { waveColors } from '../../config/waveColors.js'


export const CHARACTERISTIC_POINT_RADIUS = 0.034
export const CHARACTERISTIC_SELECTED_RING_RADIUS = 0.075
export const CHARACTERISTIC_SELECTED_RING_TUBE = 0.007
export const CHARACTERISTIC_CLICK_DRAG_TOLERANCE_PX = 5
export const CHARACTERISTIC_ZERO_TAU_GAP_FACTOR = 0.001
export const CHARACTERISTIC_DRAG_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

export function characteristicMarkerColor(point) {
  if (!point || !Number.isFinite(point.t)) return waveColors.characteristicNeutral
  if (point.branch === 'fast' || point.t < -1e-9) return waveColors.characteristicFast
  if (point.branch === 'slow' || point.t > 1e-9) return waveColors.characteristicSlow
  return waveColors.characteristicNeutral
}

export function makeCharacteristicPlaneGeometry(t0, t1, z0, z1) {
  const width = t1 - t0
  const depth = z1 - z0
  if (!(width > 1e-10) || !(depth > 1e-10)) return null
  const geometry = new THREE.PlaneGeometry(width, depth, 1, 1)
  geometry.rotateX(-Math.PI / 2)
  geometry.translate((t0 + t1) / 2, 0, (z0 + z1) / 2)
  return geometry
}


