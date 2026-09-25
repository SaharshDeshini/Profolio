import { Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import type { BufferAttribute, PointLight, Points } from 'three'
import { DoubleSide } from 'three'
import { revealNow } from '../../state/arrival.ts'
import { READING_LAMP, ROOM } from './dimensions.ts'
import { BackShelf, Bookcase } from './props/Shelving.tsx'

interface FloorPosition {
  readonly x: number
  readonly z: number
}

/** How much warm light the lamp throws: just enough to pull the reading corner out of the dark as silhouettes. */
const LAMP_LIGHT = { intensity: 3, distance: 4, color: '#ffb46e' } as const
/** Shade proportions for the reading lamp: a small drum at the top of the pole. */
const SHADE = { height: 0.17, top: 0.1, bottom: 0.13 } as const

/**
 * A low reading lamp: weighted base, thin pole, a small shade glowing a dim
 * warm tone, and one small shadowless point light that pools warmth on the
 * floor. Low on purpose (READING_LAMP in dimensions.ts): the docked camera
 * looks down from head height, so a full-height floor lamp always ran off the
 * top of the frame; at this height the whole lamp stands just behind the
 * docked figure's head.
 */
function FloorLamp({ x, z }: FloorPosition) {
  const light = useRef<PointLight>(null)
  // The lamp belongs to the room, which only appears as the figure does: it
  // rides the opening's model layer so the corner never shows before him.
  useFrame(() => {
    if (light.current) light.current.intensity = LAMP_LIGHT.intensity * revealNow('model')
  })

  const poleTop = READING_LAMP.height - SHADE.height
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.11, 0.12, 0.03, 24]} />
        <meshStandardMaterial color="#111113" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, poleTop / 2, 0]}>
        <cylinderGeometry args={[0.009, 0.009, poleTop, 8]} />
        <meshStandardMaterial color="#141416" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, poleTop + SHADE.height / 2, 0]}>
        <cylinderGeometry args={[SHADE.top, SHADE.bottom, SHADE.height, 24, 1, true]} />
        <meshBasicMaterial color="#3a2a18" toneMapped={false} side={DoubleSide} />
      </mesh>
      <pointLight
        ref={light}
        position={[0, poleTop, 0]}
        intensity={0}
        distance={LAMP_LIGHT.distance}
        color={LAMP_LIGHT.color}
        decay={2}
      />
    </group>
  )
}

interface FramedPrintProps {
  readonly position: readonly [number, number, number]
  readonly size: readonly [number, number]
  /** The print's own faint glow. Kept very dark: it must never out-shine the laptop or trip the bloom. */
  readonly tint: string
}

/** A thin frame on the back wall with a faintly lit print inside it: implied content, no detail. */
function FramedPrint({ position, size, tint }: FramedPrintProps) {
  const [width, height] = size
  return (
    <group position={[position[0], position[1], position[2]]}>
      <mesh>
        <boxGeometry args={[width, height, 0.04]} />
        <meshStandardMaterial color="#0e0e10" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[width - 0.14, height - 0.14]} />
        <meshBasicMaterial color={tint} toneMapped={false} />
      </mesh>
    </group>
  )
}

const BACK_WALL_Z = -ROOM.depth / 2

/**
 * Set dressing beyond the desk and chair, placed where the camera actually
 * looks, and no more of it than the frame needs: the empty floor is part of
 * the composition. Act 1 opens on the back wall, two prints and the archive
 * shelf behind the figure. The turn discovers the left wall and the city
 * behind it (CityWindow.tsx). Once docked, the camera looks down toward the
 * far side, where a single low lamp stands behind the figure in its own warm
 * pool (Atmosphere.tsx),
 * with a bookcase on the side wall behind the content column. All room
 * fixtures, outside `<DockRig>`, in the same near-black palette as
 * `Desk`/`Chair`: silhouettes that never compete with the laptop screen.
 */
export function Props() {
  return (
    <group>
      <BackShelf />
      <FramedPrint position={[-1.4, 2.3, BACK_WALL_Z + 0.03]} size={[1.0, 1.3]} tint="#0d1a1f" />
      <FramedPrint position={[-2.7, 2.1, BACK_WALL_Z + 0.03]} size={[0.8, 0.8]} tint="#18130e" />
      <Bookcase z={3.2} />
      <FloorLamp x={READING_LAMP.x} z={READING_LAMP.z} />
    </group>
  )
}

const DUST_COUNT = 70
const DUST_OPACITY = 0.22

/**
 * Dust hanging in the air over the part of the room the docked camera sees.
 * Slow and faint: it gives the dark some depth and life, not sparkle. It
 * arrives on the opening's particle layer, after the spotlight: Sparkles keeps
 * opacity per particle, so the fade rewrites that attribute, and only until
 * the fade is done.
 */
export function Dust() {
  const points = useRef<Points>(null)
  const settled = useRef(false)
  const [opacities] = useState(() => new Float32Array(DUST_COUNT))

  useFrame(() => {
    if (settled.current) return
    const attribute = points.current?.geometry.getAttribute('opacity') as BufferAttribute | undefined
    if (!attribute) return
    const amount = revealNow('particles')
    ;(attribute.array as Float32Array).fill(DUST_OPACITY * amount)
    attribute.needsUpdate = true
    settled.current = amount >= 1
  })

  return (
    <Sparkles
      ref={points}
      count={DUST_COUNT}
      position={[-3, 1.6, 4]}
      scale={[9, 3.2, 9]}
      size={1.6}
      speed={0.12}
      opacity={opacities}
      color="#9fdfff"
      noise={0.4}
    />
  )
}
