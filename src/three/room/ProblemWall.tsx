import fontUrl from '@fontsource/geist-mono/files/geist-mono-latin-300-normal.woff?url'
import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import { Color, Matrix4, Quaternion, Vector3, type BufferGeometry, type Group, type Material } from 'three'
import { problemNotes, problemThreads } from '../../content/problemWall.ts'
import { REDUCED_MOTION_QUERY } from '../../layout.ts'
import { progress } from '../../scroll/progress.ts'
import type { SectionId } from '../../scroll/sections.ts'
import { getActiveSection } from '../../state/activeSection.ts'
import { revealNow } from '../../state/arrival.ts'
import { cameraFrameFor } from '../cameraPath.ts'
import { dockAmountAt, dockedCamera } from '../dock.ts'
import {
  WALL_POSE,
  furthestOf,
  labelSize,
  noteLevel,
  placeNote,
  threadReach,
  wallPoint,
  type WallPose,
} from './problemWallLayout.ts'
import { dampToward } from './screen/slides.ts'

/** troika reads .woff, not .woff2 (see screenTheme.ts). The light weight: these are discovered, not announced. */
const MONO_FONT_URL: string = fontUrl

const NOTE_COLOR = '#d6f1ff'
const DOT_COLOR = '#00e5ff'
const THREAD_COLOR = new Color('#7fd8ff')
/** Threads are quieter than the notes they join. */
const THREAD_SHARE = 0.45
/** How the notes brighten and step forward as the section changes: unhurried, like a thought forming. */
const NOTE_SETTLE_TIME = 0.8
/** The board as a whole moves with the docked figure, on the same settle time (see DockRig). */
const WALL_SETTLE_TIME = 0.6
/** A thread drawing out between two notes: a little slower than the notes, so it reads as the connection being made. */
const THREAD_SETTLE_TIME = 1.1
/** Below this, nothing visible changed since the last frame: skip the updates. */
const SETTLED = 1e-4
/**
 * How slowly the board arrives when Act 2 begins. Much slower than anything
 * else on it, so it is simply there by the time the eye looks, rather than
 * switching on: it gathers out of the dark behind the settling rig.
 */
const PRESENCE_FADE_TIME = 2.2
/** Each question sways this far (screen units) on its own slow, out-of-step cycle, so the board breathes rather than hangs. */
const DRIFT = 0.004

interface FadeableText {
  fillOpacity: number
}

/**
 * The problem wall: the questions behind the work, hanging in the room behind
 * the desk, linked by threads like a detective's board. It belongs to Act 2
 * and moves with the sections the way the docked figure does: the board
 * settles to its own pose per section (`WALL_POSE`), the section's questions
 * step forward and brighten, and the threads between questions already read
 * draw themselves out. Placed by screen position through the docked camera
 * (problemWallLayout.ts), so it always sits in the free band above the figure,
 * never under the content. Only where there is a band to dock into.
 *
 * Built to be cheap: every thread is one line segment in a single draw call;
 * the notes face the Act 2 camera once, rather than turning every frame; the
 * whole wall is hidden while Act 1 plays; and with reduced motion (no sway),
 * once everything has settled no transform is written and nothing is uploaded.
 */
export function ProblemWall() {
  const size = useThree((state) => state.size)
  const frame = cameraFrameFor(size.width, size.height)
  const camera = useMemo(() => dockedCamera(frame.aspect), [frame.aspect])

  // The Act 2 camera never moves, so every note faces it with one fixed rotation.
  const facing = useMemo(() => {
    const basis = new Matrix4().makeBasis(
      new Vector3(...camera.right),
      new Vector3(...camera.up),
      new Vector3(-camera.forward[0], -camera.forward[1], -camera.forward[2]),
    )
    return new Quaternion().setFromRotationMatrix(basis)
  }, [camera])

  const threadIndex = useMemo(() => {
    const indexOf = new Map(problemNotes.map((note, index) => [note.id, index]))
    return problemThreads.flatMap(([from, to]) => {
      const a = indexOf.get(from)
      const b = indexOf.get(to)
      return a === undefined || b === undefined ? [] : [[a, b] as const]
    })
  }, [])

  // Initial buffers only: after mount they are written through the geometry ref.
  const [initialPositions] = useState(() => new Float32Array(threadIndex.length * 2 * 3))
  const [initialColors] = useState(() => new Float32Array(threadIndex.length * 2 * 4))

  const wall = useRef<Group>(null)
  const groups = useRef<(Group | null)[]>([])
  const texts = useRef<(FadeableText | null)[]>([])
  const dots = useRef<(Material | null)[]>([])
  const threads = useRef<BufferGeometry>(null)
  const pose = useRef<WallPose>(WALL_POSE.intro)
  const levels = useRef<number[]>(problemNotes.map(() => 0))
  const emphasis = useRef<number[]>(problemNotes.map(() => 0))
  const reach = useRef<number[]>(threadIndex.map(() => 0))
  const furthest = useRef<SectionId | null>(null)
  // The camera the notes were last placed for: a resize changes it, and then everything must be placed again.
  const placedFor = useRef<typeof camera | null>(null)
  const reducedMotion = useRef<boolean | null>(null)
  const shownPresence = useRef(0)

  useFrame((state, delta) => {
    const root = wall.current
    if (!root) return
    reducedMotion.current ??= window.matchMedia(REDUCED_MOTION_QUERY).matches
    const snap = reducedMotion.current
    // Present only once the rig has docked (Act 2), and never before the opening's dust; eased slowly on top of that.
    const targetPresence = dockAmountAt(progress.smooth) * revealNow('particles')
    const presence = dampToward(shownPresence.current, targetPresence, delta, snap ? 0 : PRESENCE_FADE_TIME)
    shownPresence.current = presence
    root.visible = presence > 0.001
    if (!root.visible) return
    const active = getActiveSection()
    furthest.current = furthestOf(furthest.current, active)
    let changed = placedFor.current !== camera

    const target = WALL_POSE[active ?? 'intro']
    const current = pose.current
    const wallTime = snap ? 0 : WALL_SETTLE_TIME
    const next: WallPose = {
      dx: dampToward(current.dx, target.dx, delta, wallTime),
      dy: dampToward(current.dy, target.dy, delta, wallTime),
      sx: dampToward(current.sx, target.sx, delta, wallTime),
      sy: dampToward(current.sy, target.sy, delta, wallTime),
      size: dampToward(current.size, target.size, delta, wallTime),
      // The move out to the finale takes its time: the board rearranging itself around him.
      finale: dampToward(current.finale, target.finale, delta, wallTime * 2),
      intensity: dampToward(current.intensity, target.intensity, delta, wallTime * 2),
    }
    changed ||=
      Math.abs(next.dx - current.dx) +
        Math.abs(next.dy - current.dy) +
        Math.abs(next.sx - current.sx) +
        Math.abs(next.sy - current.sy) +
        Math.abs(next.size - current.size) +
        Math.abs(next.finale - current.finale) +
        Math.abs(next.intensity - current.intensity) >
      SETTLED
    pose.current = next
    // The sway moves every note every frame, so while it runs everything is re-placed.
    const time = state.clock.elapsedTime
    changed ||= !snap

    const noteTime = snap ? 0 : NOTE_SETTLE_TIME
    const positions: (readonly [number, number, number])[] = []
    problemNotes.forEach((note, index) => {
      const previousLevel = levels.current[index] ?? 0
      const previousLift = emphasis.current[index] ?? 0
      const level = dampToward(
        previousLevel,
        noteLevel(note.section, active, furthest.current) * presence * next.intensity,
        delta,
        noteTime,
      )
      const lift = dampToward(previousLift, note.section === active ? 1 : 0, delta, noteTime)
      changed ||= Math.abs(level - previousLevel) + Math.abs(lift - previousLift) > SETTLED
      levels.current[index] = level
      emphasis.current[index] = lift

      const placement = placeNote(note.at, note.finale, note.depth, next, lift)
      const sway = snap ? 0 : DRIFT
      const swayed: readonly [number, number] = [
        placement.at[0] + Math.sin(time * 0.21 + index * 1.7) * sway,
        placement.at[1] + Math.cos(time * 0.17 + index * 2.3) * sway,
      ]
      const position = wallPoint(camera, swayed, placement.depth)
      positions.push(position)
      const group = groups.current[index]
      if (group && changed) {
        group.position.set(position[0], position[1], position[2])
        // Labels are built at the note's authored size; this keeps them the same size on screen as the note moves in depth.
        group.scale.setScalar((placement.grow * placement.depth) / note.depth)
      }
      const text = texts.current[index]
      if (text) text.fillOpacity = level
      const dot = dots.current[index]
      if (dot) dot.opacity = level
    })

    const threadTime = snap ? 0 : THREAD_SETTLE_TIME
    const geometry = threads.current
    const positionAttribute = geometry?.getAttribute('position')
    const colorAttribute = geometry?.getAttribute('color')
    threadIndex.forEach(([a, b], index) => {
      const levelA = levels.current[a] ?? 0
      const levelB = levels.current[b] ?? 0
      const previous = reach.current[index] ?? 0
      const drawn = dampToward(previous, threadReach(levelA, levelB), delta, threadTime)
      changed ||= Math.abs(drawn - previous) > SETTLED
      reach.current[index] = drawn
      const from = positions[a]
      const to = positions[b]
      if (!positionAttribute || !colorAttribute || !from || !to) return
      positionAttribute.setXYZ(index * 2, from[0], from[1], from[2])
      positionAttribute.setXYZ(
        index * 2 + 1,
        from[0] + (to[0] - from[0]) * drawn,
        from[1] + (to[1] - from[1]) * drawn,
        from[2] + (to[2] - from[2]) * drawn,
      )
      const alpha = Math.min(levelA, levelB) * THREAD_SHARE
      colorAttribute.setXYZW(index * 2, THREAD_COLOR.r, THREAD_COLOR.g, THREAD_COLOR.b, alpha)
      // The far end fades out: a thread reaching toward the next question, not a hard bar.
      colorAttribute.setXYZW(index * 2 + 1, THREAD_COLOR.r, THREAD_COLOR.g, THREAD_COLOR.b, alpha * 0.4)
    })
    if (changed && positionAttribute && colorAttribute) {
      positionAttribute.needsUpdate = true
      colorAttribute.needsUpdate = true
    }
    placedFor.current = camera
  })

  if (!frame.docks) return null

  return (
    <group ref={wall} visible={false}>
      <lineSegments frustumCulled={false}>
        <bufferGeometry ref={threads}>
          <bufferAttribute attach="attributes-position" args={[initialPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[initialColors, 4]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent depthWrite={false} toneMapped={false} fog={false} />
      </lineSegments>
      {problemNotes.map((note, index) => {
        const label = labelSize(camera, note.depth)
        return (
          <group
            key={note.id}
            quaternion={facing}
            ref={(node: Group | null) => {
              groups.current[index] = node
            }}
          >
            <mesh>
              <circleGeometry args={[label * 0.22, 16]} />
              <meshBasicMaterial
                ref={(node: Material | null) => {
                  dots.current[index] = node
                }}
                color={DOT_COLOR}
                transparent
                opacity={0}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
            <Text
              ref={(node: FadeableText | null) => {
                texts.current[index] = node
              }}
              font={MONO_FONT_URL}
              fontSize={label}
              anchorX="left"
              anchorY="middle"
              position={[label * 0.7, 0, 0]}
              letterSpacing={0.02}
              color={NOTE_COLOR}
              fillOpacity={0}
            >
              {note.text}
            </Text>
          </group>
        )
      })}
    </group>
  )
}
