import { ZCompactifiedLine as Line } from '../../../app/scene/ZCompactification'

export default function CurveSegments({ segments, color, lineWidth = 1.35, renderOrder = 6 }) {
  if (!segments?.length) return null
  return (
    <group>
      {segments.map((points, index) => (
        <Line key={index} points={points} color={color} lineWidth={lineWidth} renderOrder={renderOrder} />
      ))}
    </group>
  )
}
