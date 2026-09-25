/**
 * Room measurements in metres, in one place. The desk and chair are built to
 * the character's proportions, not the other way round, so when the real
 * model lands these are the numbers to adjust.
 */
export const DESK = {
  topY: 0.75,
  thickness: 0.05,
  width: 1.8,
  depth: 0.8,
  centerZ: 0.15,
  panelThickness: 0.04,
} as const

export const SEAT = { y: 0.46, z: -0.62, width: 0.46, depth: 0.46 } as const

export const LAPTOP = {
  z: 0.12,
  width: 0.34,
  depth: 0.23,
  baseHeight: 0.012,
  lidThickness: 0.008,
  screenWidth: 0.31,
  screenHeight: 0.2,
} as const

/**
 * Where the Mixamo rig sits. The model's origin is on the floor under the hips
 * and it faces +z, towards the laptop. Nudge these to fit the seat.
 */
export const CHARACTER = { position: [0, 0.04, SEAT.z] as const, rotationY: 0, scale: 1 } as const

/** Name the laptop's group carries so the focus pull can find it after the dock has moved it. */
export const FOCUS_TARGET_NAME = 'focus-laptop'

export const ROOM = { width: 16, height: 6, depth: 16 } as const

/**
 * The reading lamp on the far side of the room. The docked (Act 2) camera sits
 * about head height and looks down, so anything much taller than this goes off
 * the top of the frame: kept low and close enough that the whole lamp, base to
 * shade, stands inside the frame just behind the docked figure's head. It is
 * out of frame through the opening and the turn (Act 1 p < 0.5).
 */
export const READING_LAMP = { x: -1.8, z: 3.6, height: 0.8 } as const
