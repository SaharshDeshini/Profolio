import { RoundedBox } from '@react-three/drei'
import { useMemo } from 'react'
import { DoubleSide, LatheGeometry, Vector2 } from 'three'
import { DESK } from './dimensions.ts'

/**
 * The things on the desk: what makes it someone's desk rather than a table.
 * They ride inside `<DockRig>` with the desk, so they dock and shrink with it.
 * Same near-black palette as the room, told apart by material (glazed
 * ceramic, paper, anodised metal) rather than colour, so under the screen's
 * light they read as objects, not as noise competing with the laptop.
 *
 * Layout, seen from the person's chair (x left/right, +z away from them): the
 * laptop sits centre; phone near left; mug near right, notebooks far right, a
 * succulent in the far right corner. No desk lamp: the room's reading lamp,
 * standing behind the figure, is the practical light.
 */

/** The desk's top surface: `DESK.topY` is the top, the slab hangs below it (Desk.tsx). */
const TOP = DESK.topY

const CERAMIC = { color: '#1d1e22', roughness: 0.32, metalness: 0.05 } as const
const METAL = { color: '#18191c', roughness: 0.35, metalness: 0.7 } as const
const PAPER = { color: '#1a1a1c', roughness: 0.95, metalness: 0 } as const

/** A mug turned on a lathe: straight walls with a lip, a torus handle, and coffee inside. */
function Mug({ x, z }: { readonly x: number; readonly z: number }) {
  const body = useMemo(() => {
    // Outer wall up, rolled lip, inner wall down: a hollow cup in one profile.
    const profile = [
      [0, 0],
      [0.036, 0],
      [0.039, 0.004],
      [0.04, 0.085],
      [0.037, 0.09],
      [0.034, 0.086],
      [0.034, 0.008],
      [0, 0.008],
    ].map(([px = 0, py = 0]) => new Vector2(px, py))
    return new LatheGeometry(profile, 28)
  }, [])

  return (
    <group position={[x, TOP, z]} rotation-y={-0.6}>
      <mesh geometry={body}>
        <meshStandardMaterial {...CERAMIC} side={DoubleSide} />
      </mesh>
      <mesh position={[0.045, 0.047, 0]}>
        <torusGeometry args={[0.022, 0.006, 10, 20, Math.PI * 1.25]} />
        <meshStandardMaterial {...CERAMIC} />
      </mesh>
      <mesh position={[0, 0.072, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.034, 24]} />
        <meshStandardMaterial color="#0b0806" roughness={0.15} metalness={0.1} />
      </mesh>
    </group>
  )
}

/** Two notebooks, squared off-true, with a pen lying across them. */
function Notebooks({ x, z }: { readonly x: number; readonly z: number }) {
  return (
    <group position={[x, TOP, z]} rotation-y={0.28}>
      <RoundedBox args={[0.2, 0.014, 0.27]} radius={0.004} position={[0, 0.007, 0]}>
        <meshStandardMaterial {...PAPER} />
      </RoundedBox>
      <RoundedBox args={[0.18, 0.012, 0.25]} radius={0.004} position={[0.012, 0.02, -0.01]} rotation-y={-0.09}>
        <meshStandardMaterial color="#141517" roughness={0.8} metalness={0.05} />
      </RoundedBox>
      {/* The elastic band down the top notebook's spine side. */}
      <mesh position={[0.075, 0.027, -0.01]} rotation-y={-0.09}>
        <boxGeometry args={[0.006, 0.002, 0.252]} />
        <meshStandardMaterial color="#0c0c0d" roughness={0.6} />
      </mesh>
      <group position={[-0.01, 0.031, 0.02]} rotation={[0, 0.7, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.0045, 0.0045, 0.13, 12]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
        <mesh position={[0, -0.072, 0]}>
          <coneGeometry args={[0.0045, 0.014, 12]} />
          <meshStandardMaterial color="#26272b" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>
    </group>
  )
}

/** A phone lying face down, just off the laptop's left. */
function Phone({ x, z }: { readonly x: number; readonly z: number }) {
  return (
    <group position={[x, TOP + 0.004, z]} rotation-y={-0.22}>
      <RoundedBox args={[0.072, 0.008, 0.15]} radius={0.0035}>
        <meshStandardMaterial color="#1a1b1e" roughness={0.3} metalness={0.6} />
      </RoundedBox>
      {/* The camera bump. */}
      <mesh position={[-0.018, 0.005, -0.052]}>
        <boxGeometry args={[0.026, 0.002, 0.028]} />
        <meshStandardMaterial color="#101113" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  )
}

/** Leaves of the succulent: [angle around the stem, lean out, length]. */
const SUCCULENT_LEAVES: readonly (readonly [number, number, number])[] = [
  [0, 0.7, 0.05],
  [1.3, 0.8, 0.045],
  [2.5, 0.65, 0.05],
  [3.7, 0.85, 0.042],
  [4.9, 0.7, 0.048],
  [0.65, 0.25, 0.04],
  [3.1, 0.3, 0.038],
]

/** A small succulent in a concrete pot, in the desk's far corner. */
function Succulent({ x, z }: { readonly x: number; readonly z: number }) {
  return (
    <group position={[x, TOP, z]}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.038, 0.03, 0.06, 20]} />
        <meshStandardMaterial color="#1b1b1c" roughness={0.95} />
      </mesh>
      {SUCCULENT_LEAVES.map(([angle, lean, length]) => (
        <group key={angle} position={[0, 0.058, 0]} rotation={[0, angle, lean]}>
          <mesh position={[0, length / 2, 0]} scale={[0.45, 1, 0.25]}>
            <sphereGeometry args={[length / 2, 10, 8]} />
            <meshStandardMaterial color="#10170f" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function DeskItems() {
  const half = DESK.width / 2
  return (
    <group>
      <Phone x={-0.36} z={DESK.centerZ - 0.12} />
      <Mug x={0.4} z={DESK.centerZ - 0.14} />
      <Notebooks x={half - 0.22} z={DESK.centerZ + 0.12} />
      <Succulent x={half - 0.08} z={DESK.centerZ + 0.33} />
    </group>
  )
}
