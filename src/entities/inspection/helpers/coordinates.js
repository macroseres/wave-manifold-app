import * as THREE from 'three'
import { waveColors } from '../../../config/waveColors.js'

export function finite(value) { return Number.isFinite(value) }

export function coordsOf(point) {
  if (!point) return null
  if (Array.isArray(point) && point.length >= 3) return point
  if (Array.isArray(point.coords) && point.coords.length >= 3) return point.coords
  if ([point.t, point.Y, point.z].every(finite)) return [point.t, point.Y, point.z]
  return null
}

export function flattenSegments(segments) {
  return (segments ?? []).flatMap((segment) => (
    (segment ?? []).map(coordsOf).filter((coords) => coords && coords.every(finite))
  ))
}

export function branchColor(branch) {
  return branch === 'fast' ? waveColors.characteristicFast : waveColors.characteristicSlow
}

export function hoverColor(baseColor) {
  return new THREE.Color(baseColor).lerp(new THREE.Color('#ffffff'), 0.34)
}

export function clamp(value, min, max) { return Math.min(max, Math.max(min, value)) }

export function pointDistance(a, b, sceneScale = [1, 1, 1]) {
  return Math.hypot(
    (a[0] - b[0]) * sceneScale[0],
    (a[1] - b[1]) * sceneScale[1],
    (a[2] - b[2]) * sceneScale[2],
  )
}

export function clampCharacteristicPoint(point, view) {
  const gap = Math.max(1e-5, 0.001 * Math.max(1, view.tMax - view.tMin))
  const tMin = point.branch === 'fast' ? view.tMin : Math.max(gap, view.tMin)
  const tMax = point.branch === 'fast' ? Math.min(-gap, view.tMax) : view.tMax
  return {
    ...point,
    t: clamp(point.t, tMin, tMax),
    Y: 0,
    z: clamp(point.z, view.zMin, view.zMax),
    mode: 'characteristic',
    attachedCurve: null,
  }
}
