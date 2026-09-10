import React, { useEffect, useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { compactifyZPositionArray, physicalPointToVisual } from '../../geometry/zCompactification.js'

export function ZCompactifiedLine({ points = [], ...props }) {
  const visualPoints = useMemo(() => points.map(physicalPointToVisual), [points])
  return <Line points={visualPoints} {...props} dashed={false} />
}

export function useVisualZPoint(point) {
  return useMemo(() => physicalPointToVisual(point), [point])
}

export function useZCompactifiedGeometry(geometry) {
  const visualGeometry = useMemo(() => {
    if (!geometry) return null
    if (geometry.userData.zCompactified) return geometry
    const clone = geometry.clone()
    const position = clone.getAttribute('position')
    if (position?.array) {
      clone.setAttribute('position', new THREE.BufferAttribute(compactifyZPositionArray(position.array), 3))
      clone.computeVertexNormals()
      clone.computeBoundingBox()
      clone.computeBoundingSphere()
    }
    return clone
  }, [geometry])
  useEffect(() => () => {
    if (visualGeometry !== geometry) visualGeometry?.dispose()
  }, [visualGeometry, geometry])
  return visualGeometry
}

export function ZCompactifiedMesh({ geometry, children, ...props }) {
  const visualGeometry = useZCompactifiedGeometry(geometry)
  return <mesh geometry={visualGeometry} {...props}>{children}</mesh>
}

