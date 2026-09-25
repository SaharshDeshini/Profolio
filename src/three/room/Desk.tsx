import { DESK } from './dimensions.ts'

export function Desk() {
  const { topY, thickness, width, depth, centerZ, panelThickness } = DESK
  const legHeight = topY - thickness

  return (
    <group position={[0, 0, centerZ]}>
      <mesh position={[0, topY - thickness / 2, 0]}>
        <boxGeometry args={[width, thickness, depth]} />
        <meshStandardMaterial color="#141416" roughness={0.5} metalness={0.15} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (width / 2 - panelThickness / 2 - 0.05), legHeight / 2, 0]}
        >
          <boxGeometry args={[panelThickness, legHeight, depth - 0.1]} />
          <meshStandardMaterial color="#101012" roughness={0.6} metalness={0.2} />
        </mesh>
      ))}
    </group>
  )
}
