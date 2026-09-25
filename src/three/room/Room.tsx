import { BackSide } from 'three'
import { ROOM } from './dimensions.ts'

/**
 * The dark room: a floor and four walls in near-black. Deliberately bare.
 * Lighting, not geometry, is what makes this read as a place.
 */
export function Room() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial color="#08090b" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, ROOM.height / 2, 0]}>
        <boxGeometry args={[ROOM.width, ROOM.height, ROOM.depth]} />
        <meshStandardMaterial color="#0b0d10" roughness={1} side={BackSide} />
      </mesh>
    </group>
  )
}
