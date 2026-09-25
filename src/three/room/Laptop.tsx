import { Instance, Instances, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, type Group, type PointLight } from 'three'
import { findProject } from '../../content/projectLookup.ts'
import { progress } from '../../scroll/progress.ts'
import { getActiveProject } from '../../state/activeProject.ts'
import { dockPlanFor, dockScaleAt } from '../dock.ts'
import { moodAt } from '../lighting/presets.ts'
import { DESK, FOCUS_TARGET_NAME, LAPTOP } from './dimensions.ts'
import { lidAngleAt } from './lid.ts'
import { LaptopScreen } from './screen/LaptopScreen.tsx'
import { dampToward } from './screen/slides.ts'

/** The screen's colour when no project is showing: the brand cyan. */
const DEFAULT_TINT = '#00e5ff'
/** Slower than a slide's fade, so the room's colour follows the screen rather than flickering with it. */
const TINT_SMOOTH_TIME = 0.35

/** How hard the screen lights its surroundings at full glow, in candela. Tuned by eye. */
const SCREEN_LIGHT_INTENSITY = 3

const SHELL_MATERIAL = { color: '#1b1c1f', metalness: 0.75, roughness: 0.38 } as const
/** Must stay under half of the thinnest shell dimension (the lid, `LAPTOP.lidThickness = 0.008`)
 * or RoundedBox produces degenerate/overlapping geometry. */
const SHELL_RADIUS = 0.003
const TRACKPAD_RADIUS = 0.0006

/**
 * The keyboard deck and trackpad, inset into the base so the closed/open
 * laptop reads as a real object rather than a flat slab. Numbers are laid
 * out from the back (hinge) edge forward, sized like a real ~13" laptop
 * scaled to `LAPTOP.width`/`LAPTOP.depth`.
 */
const KEY = { cols: 11, rows: 4, size: 0.02, gap: 0.004, height: 0.004 }
const KEYBOARD_WIDTH = KEY.cols * (KEY.size + KEY.gap) - KEY.gap
const KEYBOARD_DEPTH = KEY.rows * (KEY.size + KEY.gap) - KEY.gap
const KEYBOARD_MARGIN_BACK = 0.016
const KEYBOARD_CENTER_Z = LAPTOP.depth / 2 - KEYBOARD_MARGIN_BACK - KEYBOARD_DEPTH / 2
const DECK_PAD = 0.012

const TRACKPAD = { width: 0.11, depth: 0.065, gapFromKeyboard: 0.014 }
const TRACKPAD_CENTER_Z =
  KEYBOARD_CENTER_Z - KEYBOARD_DEPTH / 2 - TRACKPAD.gapFromKeyboard - TRACKPAD.depth / 2

/** Top of the keyboard deck panel (base + its thickness), so keys sit on it rather than in it. */
const DECK_THICKNESS = 0.0012
const KEY_CENTER_Y = LAPTOP.baseHeight + DECK_THICKNESS + KEY.height / 2

/** Every key sits on this grid; computed once since the layout never changes. */
function keyPositions(): readonly [number, number, number][] {
  const positions: [number, number, number][] = []
  const originX = -(KEYBOARD_WIDTH - KEY.size) / 2
  const originZ = KEYBOARD_CENTER_Z - (KEYBOARD_DEPTH - KEY.size) / 2
  for (let row = 0; row < KEY.rows; row++) {
    for (let col = 0; col < KEY.cols; col++) {
      positions.push([originX + col * (KEY.size + KEY.gap), KEY_CENTER_Y, originZ + row * (KEY.size + KEY.gap)])
    }
  }
  return positions
}

/**
 * The keyboard base plus a lid hinged along its far (+z) edge. Shut, the lid
 * lies over the base; open, it tilts back with the screen facing the person.
 * The screen itself is `LaptopScreen`, built once and reused for both acts.
 */
export function Laptop() {
  const lid = useRef<Group>(null)
  const glow = useRef<PointLight>(null)
  const tint = useMemo(() => new Color(), [])
  const keys = useMemo(() => keyPositions(), [])

  useFrame(({ size }, delta) => {
    if (lid.current) lid.current.rotation.x = lidAngleAt(progress.smooth)
    if (glow.current) {
      // The room takes on the tint of the project on screen, easing back to plain cyan between projects.
      const slug = getActiveProject()
      tint.set(slug ? (findProject(slug)?.mood ?? DEFAULT_TINT) : DEFAULT_TINT)
      glow.current.color.lerp(tint, dampToward(0, 1, delta, TINT_SMOOTH_TIME))

      // Shrinking the rig shrinks the light's distances but not its candela, so it would
      // brighten as the rig docks. Light falls off with distance squared, so scale by scale squared.
      // Where the dock does not run (no side band) the rig keeps its size, and so does the light.
      const scale = dockScaleAt(progress.smooth, dockPlanFor(size.width, size.height).scale)
      glow.current.intensity = moodAt(progress.smooth).screen * SCREEN_LIGHT_INTENSITY * scale * scale
    }
  })

  const halfDepth = LAPTOP.depth / 2

  return (
    <group name={FOCUS_TARGET_NAME} position={[0, DESK.topY, LAPTOP.z]}>
      <RoundedBox
        args={[LAPTOP.width, LAPTOP.baseHeight, LAPTOP.depth]}
        radius={SHELL_RADIUS}
        smoothness={3}
        position={[0, LAPTOP.baseHeight / 2, 0]}
      >
        <meshStandardMaterial {...SHELL_MATERIAL} />
      </RoundedBox>

      {/* Keyboard deck: a shallow inset panel so the keys read as recessed into the base. */}
      <mesh position={[0, LAPTOP.baseHeight + DECK_THICKNESS / 2, KEYBOARD_CENTER_Z]}>
        <boxGeometry args={[KEYBOARD_WIDTH + DECK_PAD, DECK_THICKNESS, KEYBOARD_DEPTH + DECK_PAD]} />
        <meshStandardMaterial color="#0c0d0f" roughness={0.8} metalness={0.05} />
      </mesh>
      <Instances range={KEY.rows * KEY.cols}>
        <boxGeometry args={[KEY.size, KEY.height, KEY.size]} />
        <meshStandardMaterial color="#232427" roughness={0.45} metalness={0.2} />
        {keys.map((position, index) => (
          <Instance key={index} position={position} />
        ))}
      </Instances>

      {/* Trackpad: a touch glossier than the deck so it catches a highlight of its own. */}
      <RoundedBox
        args={[TRACKPAD.width, 0.0015, TRACKPAD.depth]}
        radius={TRACKPAD_RADIUS}
        smoothness={3}
        position={[0, LAPTOP.baseHeight + 0.00075, TRACKPAD_CENTER_Z]}
      >
        <meshStandardMaterial color="#232427" roughness={0.3} metalness={0.15} />
      </RoundedBox>

      {/* The hinge barrel. It never needs its own rotation: being a cylinder around its own
          axis, spinning it would look identical, so it stays out of the rotating lid group. */}
      <mesh position={[0, LAPTOP.baseHeight, halfDepth]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.005, 0.005, LAPTOP.width * 0.94, 12]} />
        <meshStandardMaterial color="#0f1012" roughness={0.5} metalness={0.6} />
      </mesh>

      <group ref={lid} position={[0, LAPTOP.baseHeight, halfDepth]}>
        <RoundedBox
          args={[LAPTOP.width, LAPTOP.lidThickness, LAPTOP.depth]}
          radius={SHELL_RADIUS}
          smoothness={3}
          position={[0, LAPTOP.lidThickness / 2, -halfDepth]}
        >
          <meshStandardMaterial {...SHELL_MATERIAL} />
        </RoundedBox>

        {/* Camera notch: a small dark dot at the top-centre of the bezel. The screen plane
            (see LaptopScreen) sits on the lid's underside, not its top face - closed, a real
            laptop's screen faces down toward the keyboard - so this shares its rotation/y. */}
        <mesh position={[0, -0.0002, -LAPTOP.depth + 0.008]} rotation={[Math.PI / 2, 0, Math.PI]}>
          <circleGeometry args={[0.0025, 12]} />
          <meshStandardMaterial color="#050506" roughness={0.6} />
        </mesh>

        <LaptopScreen />

        <pointLight
          ref={glow}
          position={[0, -0.14, -halfDepth]}
          color="#00e5ff"
          intensity={0}
          distance={4}
          decay={2}
        />
      </group>
    </group>
  )
}
