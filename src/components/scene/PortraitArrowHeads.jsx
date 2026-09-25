import { useLayoutEffect, useMemo, useRef } from 'react'
import { Matrix4, Quaternion, Vector3 } from 'three'

// Instanced cones stay round after the scene's nonuniform scaling and remain
// readable when the camera sees a curve edge-on.
export default function PortraitArrowHeads({ positions, markerScale, color }) {
  const mesh = useRef(null)
  const matrices = useMemo(() => {
    const inverseScale = new Matrix4().makeScale(...markerScale)
    const up = new Vector3(0, 1, 0)
    const result = []
    for (let i = 0; i < positions.length; i += 12) {
      const read = offset => new Vector3(...Array.from(positions.slice(offset, offset + 3), (x, j) => x / markerScale[j]))
      const tip = read(i), left = read(i + 3), right = read(i + 9)
      const base = left.clone().add(right).multiplyScalar(0.5)
      const direction = tip.clone().sub(base)
      const length = direction.length()
      if (length < 1e-10) continue
      const radius = left.distanceTo(right) / 2
      const center = base.add(tip).multiplyScalar(0.5)
      const rotation = new Quaternion().setFromUnitVectors(up, direction.normalize())
      result.push(new Matrix4().compose(center, rotation, new Vector3(radius, length, radius)).premultiply(inverseScale))
    }
    return result
  }, [positions, markerScale])
  useLayoutEffect(() => {
    if (!mesh.current) return
    matrices.forEach((matrix, i) => mesh.current.setMatrixAt(i, matrix))
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [matrices])
  if (!matrices.length) return null
  return <instancedMesh ref={mesh} args={[null, null, matrices.length]} raycast={() => null}>
    <coneGeometry args={[1, 1, 12]} />
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} roughness={0.55} />
  </instancedMesh>
}
