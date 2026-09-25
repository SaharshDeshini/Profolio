import { ROOM } from './dimensions.ts'
import type { Vec3 } from '../cameraPath.ts'
import type { DockedCamera } from '../dock.ts'
import { SECTION_IDS, type SectionId } from '../../scroll/sections.ts'

/**
 * Pure maths for the problem wall (ProblemWall.tsx): where a note sits in the
 * room, how big its label is, and how lit it is. Notes are placed by screen
 * position through the docked camera rather than at fixed room coordinates,
 * so they land in the free band beside the content at any window shape.
 */

/** Keeps notes this far inside the walls, floor and ceiling. */
const ROOM_MARGIN = 0.3

const inside = (point: Vec3): boolean =>
  Math.abs(point[0]) <= ROOM.width / 2 - ROOM_MARGIN &&
  Math.abs(point[2]) <= ROOM.depth / 2 - ROOM_MARGIN &&
  point[1] >= ROOM_MARGIN &&
  point[1] <= ROOM.height - ROOM_MARGIN

/**
 * The world point that the docked camera sees at screen position `at`, `depth`
 * metres in front of it. If that point would be outside the room it is pulled
 * back toward the camera until it is inside, so a note never sinks into a wall.
 */
export function wallPoint(camera: DockedCamera, at: readonly [number, number], depth: number): Vec3 {
  const halfHeight = Math.tan((camera.fov * Math.PI) / 360)
  const halfWidth = halfHeight * camera.aspect
  const ray: Vec3 = [
    camera.forward[0] + camera.right[0] * at[0] * halfWidth + camera.up[0] * at[1] * halfHeight,
    camera.forward[1] + camera.right[1] * at[0] * halfWidth + camera.up[1] * at[1] * halfHeight,
    camera.forward[2] + camera.right[2] * at[0] * halfWidth + camera.up[2] * at[1] * halfHeight,
  ]
  const along = (d: number): Vec3 => [
    camera.position[0] + ray[0] * d,
    camera.position[1] + ray[1] * d,
    camera.position[2] + ray[2] * d,
  ]
  let d = depth
  while (d > 1 && !inside(along(d))) d -= 0.25
  return along(d)
}

/** A label's world height for a given on-screen height (share of the screen's height), at its depth. */
export function labelSize(camera: DockedCamera, depth: number, screenShare = 0.018): number {
  return screenShare * 2 * depth * Math.tan((camera.fov * Math.PI) / 360)
}

/** How lit a note is: the section being read burns bright, ones already passed stay on, the rest wait as ghosts. */
export const NOTE_LEVEL = { active: 1, visited: 0.42, waiting: 0.1 } as const

export function noteLevel(section: SectionId, active: SectionId | null, furthest: SectionId | null): number {
  if (section === active) return NOTE_LEVEL.active
  // The finale: at the last section every question is on the board, however the visitor got there.
  if (active === FINALE) return NOTE_LEVEL.visited
  if (furthest !== null && SECTION_IDS.indexOf(section) <= SECTION_IDS.indexOf(furthest)) return NOTE_LEVEL.visited
  return NOTE_LEVEL.waiting
}

/** The later of two sections in page order: how far the visitor has read. */
export function furthestOf(a: SectionId | null, b: SectionId | null): SectionId | null {
  if (a === null) return b
  if (b === null) return a
  return SECTION_IDS.indexOf(b) > SECTION_IDS.indexOf(a) ? b : a
}

/**
 * How the whole board sits while a section is read: a shift across the screen
 * (dx, dy), a stretch about its top-left corner (sx, sy) and a label size. The
 * board settles section by section the way the docked figure does, instead of
 * hanging dead still. At the finale it opens out from its corner to fill the
 * screen behind the centred figure, the whole map of questions behind the one
 * that matters: "what's yours?".
 */
export interface WallPose {
  readonly dx: number
  readonly dy: number
  readonly sx: number
  readonly sy: number
  /** Multiplier on every label's size. */
  readonly size: number
  /** 0..1: how far each note has moved from its band place to its own finale place (`ProblemNote.finale`). */
  readonly finale: number
  /**
   * Multiplier on every note's brightness. At the finale the board is a quiet
   * layer behind the closing statement, something discovered, never a rival
   * to the words the section is actually saying.
   */
  readonly intensity: number
}

/** The section where the board opens out to full scale. */
export const FINALE: SectionId = 'connect'

const band = (dx: number, dy: number, scale: number): WallPose => ({
  dx,
  dy,
  sx: scale,
  sy: scale,
  size: scale,
  finale: 0,
  intensity: 1,
})

/** The board scales about the screen's top-left corner, so compacting it pulls it into the corner. */
export const WALL_ANCHOR = [-1, 1] as const

export const WALL_POSE: Readonly<Record<SectionId, WallPose>> = {
  intro: band(0, 0, 1),
  skills: band(0.025, -0.03, 1),
  projects: band(0, 0.015, 1),
  achievements: band(0.03, -0.02, 0.97),
  education: band(-0.01, 0.02, 0.98),
  // Every note moves to its own authored place around the centred figure.
  // Smaller and much dimmer than anywhere else: the closing words own this frame.
  connect: { dx: 0, dy: 0, sx: 1, sy: 1, size: 0.82, finale: 1, intensity: 0.45 },
}

/** What an active note does: steps toward the camera, grows a little, and lifts off the board. */
export const EMPHASIS = { depth: 0.12, grow: 0.16, lift: [0.012, 0.014] } as const

export interface NotePlacement {
  readonly at: readonly [number, number]
  readonly depth: number
  /** Multiplier on the label's size. */
  readonly grow: number
}

/**
 * Where a note actually sits: its band place moved by the board's pose,
 * blended toward its finale place by `pose.finale`, then lifted by its own
 * emphasis (0..1).
 */
export function placeNote(
  at: readonly [number, number],
  finale: readonly [number, number],
  depth: number,
  pose: WallPose,
  emphasis: number,
): NotePlacement {
  const bandX = WALL_ANCHOR[0] + (at[0] - WALL_ANCHOR[0]) * pose.sx + pose.dx
  const bandY = WALL_ANCHOR[1] + (at[1] - WALL_ANCHOR[1]) * pose.sy + pose.dy
  return {
    at: [
      bandX + (finale[0] - bandX) * pose.finale + EMPHASIS.lift[0] * emphasis,
      bandY + (finale[1] - bandY) * pose.finale + EMPHASIS.lift[1] * emphasis,
    ],
    depth: depth * (1 - EMPHASIS.depth * emphasis),
    grow: pose.size * (1 + EMPHASIS.grow * emphasis),
  }
}

/** A thread between two ghost notes is only a short stub; once both ends have been read it draws out in full. */
export const THREAD_STUB = 0.22

export function threadReach(levelA: number, levelB: number): number {
  const lit = NOTE_LEVEL.waiting + 0.05
  return levelA > lit && levelB > lit ? 1 : THREAD_STUB
}
