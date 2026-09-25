import { SPLIT_RATIO } from '../layout.ts'
import { ACT1_BEATS, beat, smoothstep } from '../scroll/beats.ts'
import type { SectionId } from '../scroll/sections.ts'
import { cameraFrameFor, sampleCameraPose, type Vec3 } from './cameraPath.ts'

/**
 * The dock shrinks the rig (desk, chair, laptop, person) into the band left of
 * the content column. The canvas never moves or resizes; only this group does.
 * Everything here is pure: the same progress and aspect always give the same
 * transform, so it can be tuned and tested without a renderer.
 */
export const DOCK = {
  /** How small the rig ends up. Its lights do not shrink with it, see `dockScaleAt`. */
  scale: 0.4,
  /** Rig-local point that comes to rest at the centre of the docked band: the middle of the person and laptop. */
  anchor: [0, 0.95, -0.25] as Vec3,
  /** Vertical resting place of the anchor in screen space, -1 (bottom) to 1 (top). */
  ndcY: 0,
  /** Used when the aspect ratio is unknown or nonsense, so the maths never returns NaN. */
  fallbackAspect: 16 / 9,
} as const

export interface DockTransform {
  readonly position: Vec3
  readonly scale: number
}

/**
 * The knobs a section can move: how big the rig reads, where its anchor sits
 * vertically and, optionally, horizontally (-1 left edge, 1 right edge).
 * Leaving `ndcX` out keeps the rig in the middle of the left band
 * (`DOCK_NDC_X`); set it to put the rig anywhere else, e.g. 0 for dead centre.
 */
export interface DockPose {
  readonly ndcX?: number
  readonly ndcY: number
  readonly scale: number
}

/**
 * Per-section resting pose, layered on top of the Act 1 dock once it has
 * fully landed (see `DockRig`). `intro` is byte-identical to `DOCK`'s own
 * values on purpose: it is the pose the rig already docks to at the end of
 * Act 1, so the handoff into Act 2 stays invisible. The others are small,
 * deliberate departures — a felt settle as the visitor reads each section,
 * not a new per-frame animation system.
 */
export const SECTION_DOCK_POSE: Readonly<Record<SectionId, DockPose>> = {
  intro: { ndcY: DOCK.ndcY, scale: DOCK.scale },
  skills: { ndcY: -0.32, scale: DOCK.scale * 0.85 },
  projects: { ndcY: 0, scale: DOCK.scale },
  achievements: { ndcY: 0.12, scale: DOCK.scale * 0.95 },
  // Not raised as far as it could go: the problem wall fills the band above.
  education: { ndcY: 0.08, scale: DOCK.scale * 1.05 },
  // The closing frame: the rig comes back to the centre of the screen, small
  // and wholly in the upper part, with the problem wall opened out behind it
  // (WALL_POSE in problemWallLayout.ts) and the Connect copy held below it
  // (sections.css), so the three never overlap.
  connect: { ndcX: 0, ndcY: 0.62, scale: DOCK.scale * 0.56 },
}

const UP: Vec3 = [0, 1, 0]

/** The rig resting where it is authored. Used wherever there is no band to dock into. */
export const NO_DOCK: DockTransform = { position: [0, 0, 0], scale: 1 }

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
const normalize = (v: Vec3): Vec3 => {
  const length = Math.hypot(v[0], v[1], v[2])
  return [v[0] / length, v[1] / length, v[2] / length]
}
const lerp = (from: number, to: number, t: number): number => from * (1 - t) + to * t

/** Centre of the band the docked rig lives in, in screen space (-1 left edge, 1 right edge). */
export const DOCK_NDC_X = SPLIT_RATIO - 1

/** The Act 2 camera: where it sits and which way its screen axes point, once Act 1 has ended. */
export interface DockedCamera {
  readonly aspect: number
  readonly position: Vec3
  readonly forward: Vec3
  readonly right: Vec3
  readonly up: Vec3
  /** Vertical field of view, degrees. */
  readonly fov: number
}

/**
 * The final camera pose, which never moves during Act 2, as a basis. Anything
 * that must land at a given place on screen while docked (the rig, the problem
 * wall) is solved from this, so they all agree about the frame.
 */
export function dockedCamera(aspect: number): DockedCamera {
  const safeAspect = aspect > 0 && Number.isFinite(aspect) ? aspect : DOCK.fallbackAspect
  const pose = sampleCameraPose(1, { aspect: safeAspect, docks: true })
  const forward = normalize(sub(pose.target, pose.position))
  const right = normalize(cross(forward, UP))
  const up = cross(right, forward)
  return { aspect: safeAspect, position: pose.position, forward, right, up, fov: pose.fov }
}

/**
 * Where the rig must sit, in world units, so its anchor lands at the pose's
 * screen position (by default the middle of the left band) on a screen of this aspect. It works from the final camera
 * pose, which the dock beat never moves (only its lens narrows), and slides the
 * anchor across the image plane so its depth, and so its apparent size, is unchanged.
 */
export function solveDock(aspect: number, pose: DockPose = DOCK): DockTransform {
  const { aspect: safeAspect, position: cameraPosition, forward, right, up, fov } = dockedCamera(aspect)
  const cameraPose = { position: cameraPosition, fov }

  const { anchor } = DOCK
  const { scale, ndcY, ndcX = DOCK_NDC_X } = pose
  const offset = sub(anchor, cameraPose.position)
  const depth = dot(offset, forward)
  const halfHeight = depth * Math.tan((cameraPose.fov * Math.PI) / 360)

  const shiftRight = ndcX * halfHeight * safeAspect - dot(offset, right)
  const shiftUp = ndcY * halfHeight - dot(offset, up)

  // The anchor's world position is `position + scale * anchor`; solve for `position`.
  return {
    position: [
      anchor[0] * (1 - scale) + right[0] * shiftRight + up[0] * shiftUp,
      anchor[1] * (1 - scale) + right[1] * shiftRight + up[1] * shiftUp,
      anchor[2] * (1 - scale) + right[2] * shiftRight + up[2] * shiftUp,
    ],
    scale,
  }
}

/** How far through the dock the story is, eased. 0 until the dock beat starts, 1 once it ends. */
export const dockAmountAt = (progress: number): number => smoothstep(beat(progress, ACT1_BEATS.dock))

/**
 * The rig's scale alone. Lights that ride on the rig read this to keep their light on the same footing.
 * Pass the plan's scale (`dockPlanFor(...).scale`) where the dock might not run.
 */
export const dockScaleAt = (progress: number, dockedScale: number = DOCK.scale): number =>
  lerp(1, dockedScale, dockAmountAt(progress))

/** The rig's transform for a story progress, blended from resting in place to fully docked. */
export function sampleDock(progress: number, docked: DockTransform): DockTransform {
  const t = dockAmountAt(progress)
  return {
    position: [
      lerp(NO_DOCK.position[0], docked.position[0], t),
      lerp(NO_DOCK.position[1], docked.position[1], t),
      lerp(NO_DOCK.position[2], docked.position[2], t),
    ],
    scale: lerp(NO_DOCK.scale, docked.scale, t),
  }
}

let lastPlan: { width: number; height: number; plan: DockTransform } | undefined

/**
 * The docked pose for a viewport, or `NO_DOCK` where there is no side band to
 * dock into (below the split width). Remembered for the last size, so calling
 * it every frame allocates nothing and re-solves only on resize.
 */
export function dockPlanFor(width: number, height: number): DockTransform {
  if (lastPlan?.width === width && lastPlan.height === height) return lastPlan.plan
  const frame = cameraFrameFor(width, height)
  const plan = frame.docks ? solveDock(frame.aspect) : NO_DOCK
  lastPlan = { width, height, plan }
  return plan
}
