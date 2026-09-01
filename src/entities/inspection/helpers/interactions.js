import * as THREE from 'three'
import { DRAG_PLANE, TMP_WORLD } from './constants.js'
import { clampCharacteristicPoint } from './coordinates.js'
import { physicalPointToVisual, visualZToPhysical } from '../../../geometry/zCompactification.js'

function pointRayDistance(worldPoint, ray) {
  const v = worldPoint.clone().sub(ray.origin)
  const projected = Math.max(0, v.dot(ray.direction))
  TMP_WORLD.copy(ray.direction).multiplyScalar(projected).add(ray.origin)
  return TMP_WORLD.distanceTo(worldPoint)
}

export function localFromPlaneEvent(event, root, branch, view) {
  if (!root || !event.ray) return null
  const world = new THREE.Vector3()
  if (!event.ray.intersectPlane(DRAG_PLANE, world)) return null
  const local = root.worldToLocal(world.clone())
  return clampCharacteristicPoint({ branch, t: local.x, Y: 0, z: visualZToPhysical(local.z) }, view)
}

function snapPriority(curve) {
  if (curve === 'J') return 0.72
  return 1
}

export function nearestCurvePointFromRay({ event, root, curveSamples, branch }) {
  if (!root || !event.ray || !curveSamples?.length) return null
  let best = null
  let bestScore = Infinity
  for (const sample of curveSamples) {
    const local = new THREE.Vector3(...physicalPointToVisual(sample.coords))
    const world = root.localToWorld(local.clone())
    const d = pointRayDistance(world, event.ray)
    const score = d * snapPriority(sample.curve)
    if (score < bestScore) {
      bestScore = score
      best = sample
    }
  }
  if (!best) return null
  return {
    branch,
    t: best.coords[0],
    Y: best.coords[1],
    z: best.coords[2],
    mode: 'curve',
    attachedCurve: best.curve,
  }
}
