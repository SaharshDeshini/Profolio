import { SPLIT_MIN_WIDTH } from '../layout.ts'
import { ACT1_BEATS, beat, clamp01, smoothstep } from '../scroll/beats.ts'

export type Vec3 = readonly [x: number, y: number, z: number]

export interface CameraPose {
  readonly position: Vec3
  readonly target: Vec3
  /** Vertical field of view, in degrees. */
  readonly fov: number
}

/** The screen the shot is being framed for. */
export interface CameraFrame {
  /** Viewport width over height. Under 1 the shot is framed for a portrait screen. */
  readonly aspect: number
  /** Whether the dock beat runs. Off where there is no side band to dock into. */
  readonly docks: boolean
}

/** A wide desktop screen with a side band: the shot the camera path is authored for. */
export const DEFAULT_FRAME: CameraFrame = { aspect: 16 / 9, docks: true }

/**
 * The whole Act 1 flight, as numbers. Tune the shot here, not in components.
 *
 * World units are metres. +z points towards the viewer at the start. The
 * person sits at z < 0 facing +z with the laptop between them and the camera,
 * so the opening shot sees the back of the closed lid. The camera then pushes
 * in and orbits round to the person's shoulder, where the open screen faces it.
 */
export const CAMERA_PATH = {
  radius: { start: 7, pushedIn: 3.6, end: 2.4 },
  /** Radians above the horizontal: 8 degrees rising to 22, so the last shot looks down onto the screen. */
  elevation: { start: 0.14, end: 0.38 },
  /** Total sweep in radians (about 135 degrees): far enough round that the person's head clears the screen. */
  azimuthEnd: 2.35,
  target: {
    front: [0, 1.15, -0.35],
    laptop: [0, 1, 0.05],
  },
  /** Long on purpose. It narrows during the dock to flatten the perspective of the off-centre rig. */
  fov: { act1: 35, docked: 26 },
  /**
   * Framing for a tall screen. The camera never moves for it: it widens the
   * lens so the laptop and the person both stay in frame, and looks a little
   * lower so the subject sits in the upper part of the picture with room for
   * text below.
   */
  portrait: {
    /** The narrowest horizontal view, in degrees. Below this aspect the vertical lens widens to hold it. */
    minHorizontalFov: 28,
    /** How far up the frame the subject sits at full raise, as a share of half the visible height. */
    raise: 0.34,
    /** How far the aim pans towards the person at full portrait, as a share of half the visible width, so their head is not cut off. */
    shift: 0.22,
    /** At or below this aspect the subject is fully raised... */
    fullRaiseAtAspect: 0.55,
    /** ...and at or above this it is not raised at all. */
    noRaiseAtAspect: 0.95,
  },
} as const

/** Exact at both ends (unlike `a + (b - a) * t`), so a pose lands precisely on its target. */
const lerp = (from: number, to: number, t: number): number => from * (1 - t) + to * t

const lerp3 = (from: Vec3, to: Vec3, t: number): Vec3 => [
  lerp(from[0], to[0], t),
  lerp(from[1], to[1], t),
  lerp(from[2], to[2], t),
]

/** A zero, negative or non-finite aspect means "unknown": use the default rather than let the maths go NaN. */
const usableAspect = (aspect: number): number =>
  aspect > 0 && Number.isFinite(aspect) ? aspect : DEFAULT_FRAME.aspect

/** The vertical lens, in degrees, that gives at least this horizontal view on a screen of this shape. */
export function fovForHorizontal(horizontalDegrees: number, aspect: number): number {
  const halfHorizontal = Math.tan((horizontalDegrees * Math.PI) / 360)
  return ((2 * Math.atan(halfHorizontal / usableAspect(aspect))) * 180) / Math.PI
}

/**
 * Where the camera is, and what it looks at, for a given story progress.
 *
 * Pure: it is a function of the damped scalar alone, so the camera always sits
 * exactly on the authored curve. It has inertia because the *scalar* is
 * damped, not because the camera chases a target and cuts corners through the desk.
 *
 * The frame only changes the lens and the aim, never the position, and does
 * nothing on a landscape screen: the shot is authored for those.
 */
export function sampleCameraPose(progress: number, frame: CameraFrame = DEFAULT_FRAME): CameraPose {
  const p = clamp01(progress)
  const aspect = usableAspect(frame.aspect)
  const pushIn = smoothstep(beat(p, ACT1_BEATS.pushIn))
  const orbit = smoothstep(beat(p, ACT1_BEATS.orbit))
  const dock = frame.docks ? smoothstep(beat(p, ACT1_BEATS.dock)) : 0

  const { radius, elevation, azimuthEnd, target, fov, portrait } = CAMERA_PATH

  // Additive, not nested lerps: both terms only ever grow, so the radius can
  // never pull back even where the push-in and orbit beats overlap.
  const r =
    radius.start +
    (radius.pushedIn - radius.start) * pushIn +
    (radius.end - radius.pushedIn) * orbit
  const azimuth = azimuthEnd * orbit
  const elevationAngle = lerp(elevation.start, elevation.end, orbit)
  const lookAt = lerp3(target.front, target.laptop, orbit)

  const horizontal = r * Math.cos(elevationAngle)

  const lens = Math.max(
    lerp(fov.act1, fov.docked, dock),
    fovForHorizontal(portrait.minHorizontalFov, aspect),
  )

  const position: Vec3 = [
    lookAt[0] + horizontal * Math.sin(azimuth),
    lookAt[1] + r * Math.sin(elevationAngle),
    lookAt[2] + horizontal * Math.cos(azimuth),
  ]

  // Eased in as the screen gets taller: 0 on any landscape screen, 1 at full portrait.
  const tallness = smoothstep(
    1 - beat(aspect, [portrait.fullRaiseAtAspect, portrait.noRaiseAtAspect]),
  )
  const halfHeight = r * Math.tan((lens * Math.PI) / 360)

  // Looking lower puts the subject higher in the frame, leaving room for text below it.
  const lookDown = portrait.raise * tallness * halfHeight

  // Panning towards the camera's right, where the person sits, shifts everything left in the frame.
  const dx = lookAt[0] - position[0]
  const dz = lookAt[2] - position[2]
  const level = Math.hypot(dx, dz)
  const aside = (portrait.shift * tallness * halfHeight * aspect) / level

  return {
    position,
    target: [lookAt[0] - dz * aside, lookAt[1] - lookDown, lookAt[2] + dx * aside],
    fov: lens,
  }
}

let lastFrame: { width: number; height: number; frame: CameraFrame } | undefined

/**
 * The frame for a viewport. The rig only docks where there is a side band,
 * which is the split width and up. Remembered for the last size, so calling
 * it every frame allocates nothing.
 */
export function cameraFrameFor(width: number, height: number): CameraFrame {
  if (lastFrame?.width === width && lastFrame.height === height) return lastFrame.frame
  const frame: CameraFrame = {
    aspect: usableAspect(width / height),
    docks: width >= SPLIT_MIN_WIDTH,
  }
  lastFrame = { width, height, frame }
  return frame
}
