import { SEAT } from './dimensions.ts'

export function Chair() {
  return (
    <group position={[0, 0, SEAT.z]}>
      <mesh position={[0, SEAT.y, 0]}>
        <boxGeometry args={[SEAT.width, 0.06, SEAT.depth]} />
        <meshStandardMaterial color="#141518" roughness={0.6} metalness={0.25} />
      </mesh>
      <mesh position={[0, SEAT.y + 0.32, -SEAT.depth / 2 - 0.02]} rotation-x={-0.08}>
        <boxGeometry args={[SEAT.width - 0.04, 0.5, 0.06]} />
        <meshStandardMaterial color="#141518" roughness={0.6} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 16]} />
        <meshStandardMaterial color="#1a1b1e" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.03, 32]} />
        <meshStandardMaterial color="#1a1b1e" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  )
}
