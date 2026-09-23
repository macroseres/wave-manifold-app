import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

export function CameraZoomController({ zoomSignal, controlsRef }) {
  const { camera } = useThree()
  const lastSignalRef = useRef(zoomSignal)
  const targetPositionRef = useRef(camera.position.clone())
  const isAnimatingRef = useRef(false)

  useEffect(() => {
    const delta = zoomSignal - lastSignalRef.current
    lastSignalRef.current = zoomSignal
    if (!delta) return

    const factor = delta > 0 ? 0.82 : 1.22
    const target = controlsRef?.current?.target
    targetPositionRef.current.copy(camera.position)
    if (target) targetPositionRef.current.sub(target)
    targetPositionRef.current.multiplyScalar(factor)
    if (target) targetPositionRef.current.add(target)
    isAnimatingRef.current = true
  }, [camera, zoomSignal, controlsRef])

  useFrame((_, delta) => {
    if (!isAnimatingRef.current) return
    const alpha = 1 - Math.exp(-delta * 14)
    camera.position.lerp(targetPositionRef.current, alpha)
    camera.updateProjectionMatrix()

    if (camera.position.distanceToSquared(targetPositionRef.current) < 1e-5) {
      camera.position.copy(targetPositionRef.current)
      isAnimatingRef.current = false
    }
  })

  return null
}

export function AutoRotateGroup({ autoRotate, speed = 0.003, scale, children }) {
  const groupRef = useRef(null)

  useFrame((_, delta) => {
    if (!autoRotate || !groupRef.current) return
    groupRef.current.rotation.y += speed * delta * 60
  })

  return (
    <group ref={groupRef} scale={scale}>
      {children}
    </group>
  )
}
