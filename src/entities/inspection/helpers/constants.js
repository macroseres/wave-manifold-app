import * as THREE from 'three'

export const POINT_RADIUS = 0.038
export const HOVER_RING_RADIUS = POINT_RADIUS * 1.72
export const HOVER_RING_TUBE = POINT_RADIUS * 0.12
export const MARKER_HOVER_RING_COLOR = '#f6f0a8'
export const PROBE_HOVER_RING_COLOR = '#7ff5ff'

export const DRAG_TOLERANCE = 4
export const DRAG_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
export const TMP_WORLD = new THREE.Vector3()
