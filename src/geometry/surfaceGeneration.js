import * as THREE from 'three'
import { buildHopfGeometry } from './hopfSurfaceGeometry.js'
import { buildSonicBranchGeometries } from '../entities/sonic/surfaceModel.js'
import { buildSaturatedGeometry } from './saturatedSurfaceGeometry.js'
import { buildSaturatedCoincidenceGeometry } from './saturatedCoincidenceSurfaceGeometry.js'
import { compactifyZPositionArray } from './zCompactification.js'

export function generateSurfaceBuffers({ type, params, view, resolution, direction }) {
  let geometries
  if (type === 'sonic-left' || type === 'sonic-right') {
    geometries = buildSonicBranchGeometries(type === 'sonic-left' ? 'left' : 'right', params, view, resolution)
  } else if (type === 'hopf') {
    geometries = { surface: buildHopfGeometry(params, view, resolution, direction) }
  } else if (type === 'saturated' || type === 'saturated-left') {
    geometries = { surface: buildSaturatedGeometry(params, view, resolution, direction, type === 'saturated-left' ? 'left' : 'right') }
  } else if (type === 'saturated-coincidence') {
    geometries = { surface: buildSaturatedCoincidenceGeometry(params, view, resolution, direction) }
  } else {
    throw new Error(`Unknown surface type: ${type}`)
  }
  return Object.fromEntries(Object.entries(geometries).map(([name, geometry]) => {
    const position = geometry.getAttribute('position')
    if (position) {
      geometry.setAttribute('position', new THREE.BufferAttribute(compactifyZPositionArray(position.array), 3))
      geometry.computeVertexNormals()
    }
    const data = {
      position: geometry.getAttribute('position')?.array ?? new Float32Array(),
      normal: geometry.getAttribute('normal')?.array ?? new Float32Array(),
      index: geometry.getIndex()?.array ?? new Uint32Array(),
    }
    geometry.dispose()
    return [name, data]
  }))
}

export function surfaceBufferSize(data) {
  return Object.values(data).reduce((sum, item) => sum + item.position.byteLength + item.normal.byteLength + item.index.byteLength, 0)
}
