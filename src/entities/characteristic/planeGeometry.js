import * as THREE from 'three'
import { waveColors } from '../../config/waveColors.js'
import { physicalTauToVisual, visualZToPhysical } from '../../geometry/zCompactification.js'


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

export function makeCharacteristicPlaneGeometry(t0, t1, z0, z1, zSegments = 96) {
  const width = t1 - t0
  const depth = z1 - z0
  if (!(width > 1e-10) || !(depth > 1e-10)) return null

  // The normalized tau coordinate depends on z.  Therefore the characteristic
  // sheet is no longer a flat THREE.PlaneGeometry in display coordinates.
  // Build it from physical (tau,z) samples and transform every vertex.
  const nz = Math.max(8, Math.floor(zSegments))
  const positions = []
  const indices = []
  for (let j = 0; j <= nz; j += 1) {
    const zHat = z0 + (j / nz) * depth
    const z = visualZToPhysical(zHat)
    positions.push(physicalTauToVisual(t0, z), 0, zHat)
    positions.push(physicalTauToVisual(t1, z), 0, zHat)
  }
  for (let j = 0; j < nz; j += 1) {
    const a = 2 * j
    const b = a + 1
    const c = a + 2
    const d = a + 3
    indices.push(a, c, b, b, c, d)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  geometry.userData.zCompactified = true
  return geometry
}


// In the centered tau* display, use a genuine rectangular fundamental domain
// [tau*Min,tau*Max] x [zHatMin,zHatMax].  The physical coincidence tau_A=0
// is an interior curve x=tau*_E(z), and separates the fast/slow sheets.
export function makeCenteredCharacteristicPlaneGeometry(xMin, xMax, z0, z1, branch = 'fast', zSegments = 160) {
  if (!(xMax > xMin) || !(z1 > z0)) return null
  const nz = Math.max(16, Math.floor(zSegments))
  const positions = []
  const indices = []
  for (let j = 0; j <= nz; j += 1) {
    const zHat = z0 + (j / nz) * (z1 - z0)
    const z = visualZToPhysical(zHat)
    const coincidenceX = physicalTauToVisual(0, z)
    const cut = Math.max(xMin, Math.min(xMax, coincidenceX))
    const xa = branch === 'fast' ? xMin : cut
    const xb = branch === 'fast' ? cut : xMax
    positions.push(xa, 0, zHat, xb, 0, zHat)
  }
  for (let j = 0; j < nz; j += 1) {
    const a = 2*j, b=a+1, c=a+2, d=a+3
    indices.push(a,c,b,b,c,d)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  geometry.userData.zCompactified = true
  geometry.userData.centeredTauRectangle = true
  return geometry
}
