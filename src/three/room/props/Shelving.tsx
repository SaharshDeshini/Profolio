import { Instance, Instances } from '@react-three/drei'
import { useMemo } from 'react'
import { LatheGeometry, Vector2 } from 'three'
import { ROOM } from '../dimensions.ts'

/**
 * Shelves and what is on them. Books are instanced (one draw call per row,
 * not one per book) and authored, not random, so the shelves read the same on
 * every load. Each row mixes standing spines, one leaning into the gap, and a
 * short lying stack, the way real shelves settle; a few small objects break
 * the rhythm so it reads as someone's shelf rather than a texture.
 */

/** [width, height, shade] per spine, in metres; shade indexes `SPINE_SHADES`. */
const SPINES: readonly (readonly [width: number, height: number, shade: number])[] = [
  [0.05, 0.3, 0],
  [0.07, 0.27, 1],
  [0.04, 0.32, 2],
  [0.06, 0.25, 0],
  [0.08, 0.29, 3],
  [0.05, 0.31, 1],
  [0.06, 0.24, 2],
  [0.04, 0.28, 0],
  [0.07, 0.3, 3],
  [0.05, 0.26, 1],
]
const SPINE_SHADES = ['#141417', '#191a1e', '#1d1b19', '#121519'] as const
const SPINE_DEPTH = 0.24
const SPINE_GAP = 0.006
/** How far the leaning book tips, radians. */
const LEAN = 0.32

interface BookRowProps {
  readonly x: number
  readonly y: number
  /** How many standing spines from `SPINES` to use, so rows differ in length. */
  readonly count: number
  /** Books lying flat at the end of the row. 0 for none. */
  readonly stack?: number
}

interface BookPlacement {
  readonly key: string
  readonly position: [number, number, number]
  readonly rotation: [number, number, number]
  readonly scale: [number, number, number]
  readonly color: string
}

const shadeOf = (index: number): string => SPINE_SHADES[index % SPINE_SHADES.length] ?? SPINE_SHADES[0]

/** Where every book in a row goes: standing spines, the last one leaning, then a lying stack. */
function layoutRow(x: number, y: number, count: number, stack: number): readonly BookPlacement[] {
  const books: BookPlacement[] = []
  let cursor = x
  SPINES.slice(0, count).forEach(([width, height, shade], index) => {
    const leaning = index === count - 1 && count > 2
    if (leaning) {
      // Tipped over onto its neighbour, resting on its lower corner.
      books.push({
        key: `s${index}`,
        position: [
          cursor + (Math.sin(LEAN) * height) / 2 + width / 2,
          y + (Math.cos(LEAN) * height) / 2 + (Math.sin(LEAN) * width) / 2,
          0,
        ],
        rotation: [0, 0, -LEAN],
        scale: [width, height, SPINE_DEPTH],
        color: shadeOf(shade),
      })
      cursor += Math.sin(LEAN) * height + width + SPINE_GAP
      return
    }
    books.push({
      key: `s${index}`,
      position: [cursor + width / 2, y + height / 2, 0],
      rotation: [0, 0, 0],
      scale: [width, height, SPINE_DEPTH],
      color: shadeOf(shade),
    })
    cursor += width + SPINE_GAP
  })
  for (let level = 0; level < stack; level += 1) {
    const thickness = 0.035 + (level % 2) * 0.01
    books.push({
      key: `l${level}`,
      position: [cursor + 0.15, y + thickness / 2 + level * 0.046, (level % 2) * 0.012],
      rotation: [0, (level - 1) * 0.06, 0],
      scale: [0.26 - level * 0.02, thickness, 0.2],
      color: shadeOf(level + 1),
    })
  }
  return books
}

/** One shelf row of books, drawn as a single instanced mesh. */
function BookRow({ x, y, count, stack = 0 }: BookRowProps) {
  const books = useMemo(() => layoutRow(x, y, count, stack), [x, y, count, stack])
  return (
    <Instances limit={books.length}>
      <boxGeometry />
      <meshStandardMaterial roughness={0.8} metalness={0.05} />
      {books.map((book) => (
        <Instance
          key={book.key}
          position={book.position}
          rotation={book.rotation}
          scale={book.scale}
          color={book.color}
        />
      ))}
    </Instances>
  )
}

/** A small turned vase: the one curved silhouette on a shelf of boxes. */
function Vase({ x, y }: { readonly x: number; readonly y: number }) {
  const geometry = useMemo(() => {
    const profile = [
      [0, 0],
      [0.045, 0],
      [0.06, 0.05],
      [0.05, 0.13],
      [0.028, 0.17],
      [0.032, 0.2],
      [0.026, 0.2],
    ].map(([px = 0, py = 0]) => new Vector2(px, py))
    return new LatheGeometry(profile, 24)
  }, [])
  return (
    <mesh geometry={geometry} position={[x, y, 0]}>
      <meshStandardMaterial color="#1f2024" roughness={0.25} metalness={0.1} />
    </mesh>
  )
}

/** A small standing photo frame, turned a little toward the room. */
function StandingFrame({ x, y }: { readonly x: number; readonly y: number }) {
  return (
    <group position={[x, y, 0.02]} rotation={[-0.12, 0.35, 0]}>
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[0.14, 0.18, 0.012]} />
        <meshStandardMaterial color="#17181b" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.09, 0.007]}>
        <planeGeometry args={[0.11, 0.15]} />
        <meshBasicMaterial color="#0b1519" toneMapped={false} />
      </mesh>
    </group>
  )
}

/** A lidded box, the kind that holds cables and receipts. */
function Keepsake({ x, y }: { readonly x: number; readonly y: number }) {
  return (
    <group position={[x, y, 0]} rotation-y={-0.2}>
      <mesh position={[0, 0.045, 0]}>
        <boxGeometry args={[0.2, 0.09, 0.15]} />
        <meshStandardMaterial color="#131316" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.095, 0]}>
        <boxGeometry args={[0.21, 0.014, 0.16]} />
        <meshStandardMaterial color="#18181b" roughness={0.6} />
      </mesh>
    </group>
  )
}

const SHELF_MATERIAL = { color: '#101012', roughness: 0.7, metalness: 0.1 } as const

/** The open archive shelf against the back wall: seen head-on in the opening shot. */
export function BackShelf() {
  return (
    <group position={[2.4, 0, -ROOM.depth / 2 + 0.3]}>
      {[-0.65, 0.65].map((x) => (
        <mesh key={x} position={[x, 1.1, 0]}>
          <boxGeometry args={[0.06, 2.2, 0.4]} />
          <meshStandardMaterial {...SHELF_MATERIAL} color="#0d0d0f" />
        </mesh>
      ))}
      {[0.4, 1.3, 2.2].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[1.4, 0.05, 0.4]} />
          <meshStandardMaterial {...SHELF_MATERIAL} />
        </mesh>
      ))}
      <BookRow x={-0.6} y={0.425} count={8} stack={3} />
      <BookRow x={-0.6} y={1.325} count={5} />
      <Vase x={0.25} y={1.325} />
      <StandingFrame x={0.45} y={1.325} />
      <Keepsake x={-0.42} y={2.225} />
      <BookRow x={-0.25} y={2.225} count={6} />
    </group>
  )
}

const BOOKCASE_SHELVES = [0.1, 0.62, 1.14, 1.66] as const

/** A tall open bookcase against the side wall, fuller than the back shelf. */
export function Bookcase({ z }: { readonly z: number }) {
  return (
    <group position={[-ROOM.width / 2 + 0.22, 0, z]} rotation-y={Math.PI / 2}>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 1.1, 0]}>
          <boxGeometry args={[0.04, 2.2, 0.36]} />
          <meshStandardMaterial {...SHELF_MATERIAL} color="#0f0f11" />
        </mesh>
      ))}
      {BOOKCASE_SHELVES.map((y, index) => (
        <group key={y}>
          <mesh position={[0, y, 0]}>
            <boxGeometry args={[1.1, 0.03, 0.36]} />
            <meshStandardMaterial {...SHELF_MATERIAL} />
          </mesh>
          <BookRow x={-0.5} y={y + 0.015} count={index % 2 === 0 ? 8 : 5} stack={index % 2 === 0 ? 0 : 2} />
        </group>
      ))}
      <Vase x={0.3} y={1.155} />
    </group>
  )
}
