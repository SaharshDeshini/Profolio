import { useMemo } from 'react'
import { Quaternion, Vector3 } from 'three'
import type { Vec3 } from '../cameraPath.ts'

const UP = new Vector3(0, 1, 0)
const PROXY_COLOR = '#1a1b1e'

interface LimbProps {
  readonly from: Vec3
  readonly to: Vec3
  readonly radius: number
}

/** A capsule spanning two points, so a limb is described by its joints rather than hand-rotated. */
function Limb({ from, to, radius }: LimbProps) {
  const { position, quaternion, length } = useMemo(() => {
    const start = new Vector3(...from)
    const end = new Vector3(...to)
    const direction = end.clone().sub(start)
    const span = direction.length()
    return {
      position: start.clone().add(end).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(UP, direction.normalize()),
      length: Math.max(span - radius * 2, 0.001),
    }
  }, [from, to, radius])

  return (
    <mesh position={position} quaternion={quaternion}>
      <capsuleGeometry args={[radius, length, 4, 12]} />
      <meshStandardMaterial color={PROXY_COLOR} roughness={0.85} />
    </mesh>
  )
}

/**
 * DEV-ONLY stand-in: just enough seated body to give the camera and lights
 * something the right size to work around. Replaced by the Mixamo "Sitting
 * Idle" model when it lands; the desk and chair are then re-fitted to it.
 */
export function CharacterProxy() {
  return (
    <group>
      <mesh position={[0, 0.8, -0.62]}>
        <capsuleGeometry args={[0.17, 0.3, 4, 12]} />
        <meshStandardMaterial color={PROXY_COLOR} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.25, -0.6]}>
        <sphereGeometry args={[0.11, 24, 16]} />
        <meshStandardMaterial color={PROXY_COLOR} roughness={0.85} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Limb from={[side * 0.1, 0.55, -0.62]} to={[side * 0.1, 0.55, -0.18]} radius={0.085} />
          <Limb from={[side * 0.1, 0.5, -0.18]} to={[side * 0.1, 0.1, -0.18]} radius={0.07} />
          <Limb from={[side * 0.21, 1.02, -0.62]} to={[side * 0.09, 0.8, 0.03]} radius={0.05} />
        </group>
      ))}
    </group>
  )
}
