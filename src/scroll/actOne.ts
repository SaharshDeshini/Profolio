import { beat, smoothstep, type BeatRange } from './beats.ts'
import { story, type StoryLine } from '../content/story.ts'
import { DEFAULT_FRAME, sampleCameraPose, type CameraFrame } from '../three/cameraPath.ts'

/**
 * The DOM layer of Act 1: the headline, viewfinder readout and captions that
 * sit over the 3D flight. Like the camera, every value is a pure function of
 * the one story scalar, so it reverses cleanly when the visitor scrolls back
 * and nothing runs on its own timer.
 */

/** Full-frame sensor height. Turns the camera's vertical field of view into a lens people recognise. */
export const SENSOR_HEIGHT_MM = 24

/**
 * The name fades and drifts up as the camera pushes through it. Quick on
 * purpose: it has already been read while the opening played, and every bit
 * of scroll it holds is taken from the story lines that follow.
 */
export const HEADLINE_FADE: BeatRange = [0.02, 0.1]
export const HEADLINE_MAX_SCALE = 1.12
/** How far the headline drifts up while fading, in vh. */
export const HEADLINE_LIFT_VH = 8

/** The scroll cue only makes sense before the first scroll. */
export const CUE_FADE: BeatRange = [0, 0.06]

/** The viewfinder readout goes as the rig docks: the camera stops being a camera. */
export const READOUT_FADE: BeatRange = [0.76, 0.84]

/** Past this the whole layer is hidden, so it stops costing anything. */
export const HERO_HIDDEN_AFTER = 0.86

export type CaptionId = StoryLine['id']

export interface CaptionSpec {
  readonly id: CaptionId
  readonly side: 'left' | 'right'
  readonly range: BeatRange
}

/**
 * The story told over the flight, one line per beat (see `ACT1_BEATS` in
 * beats.ts). They start only once the name has gone (`HEADLINE_FADE`) and
 * finish before the motto lights the screen (`ACT1_BEATS.motto`), so no two
 * pieces of copy compete.
 *
 * Each side is chosen for where the figure is NOT during that beat, not
 * alternated: by "The Open" the orbit has brought him large into the right of
 * frame, so that line sits left or it would be lost against him.
 */
const CAPTION_LAYOUT: Readonly<Record<CaptionId, Omit<CaptionSpec, 'id'>>> = {
  approach: { side: 'left', range: [0.1, 0.26] },
  turn: { side: 'right', range: [0.26, 0.42] },
  side: { side: 'left', range: [0.42, 0.57] },
  open: { side: 'left', range: [0.57, 0.7] },
}

export const CAPTIONS: readonly CaptionSpec[] = story.map((line) => ({ id: line.id, ...CAPTION_LAYOUT[line.id] }))

/** Share of a caption's span spent fading in, and again fading out: short, so most of the span is spent fully readable. */
const CAPTION_EDGE = 0.18

export function focalLengthMm(fovDegrees: number): number {
  return SENSOR_HEIGHT_MM / 2 / Math.tan((fovDegrees * Math.PI) / 360)
}

export interface CameraReadout {
  readonly focalMm: number
  readonly distanceM: number
}

/** What a real camera's display would say at this point in the flight. */
export function cameraReadout(progress: number, frame: CameraFrame = DEFAULT_FRAME): CameraReadout {
  const { position, target, fov } = sampleCameraPose(progress, frame)
  const distanceM = Math.hypot(position[0] - target[0], position[1] - target[1], position[2] - target[2])
  return { focalMm: Math.round(focalLengthMm(fov)), distanceM }
}

/** Fixed-width so the readout never jitters as digits change. */
export function formatReadout({ focalMm, distanceM }: CameraReadout): string {
  return `${String(focalMm).padStart(3, '0')}MM  ${distanceM.toFixed(1)}M`
}

export interface HeadlineFrame {
  readonly opacity: number
  readonly scale: number
  /** 0..1 of HEADLINE_LIFT_VH. */
  readonly lift: number
}

export function headlineFrame(progress: number): HeadlineFrame {
  const t = smoothstep(beat(progress, HEADLINE_FADE))
  return { opacity: 1 - t, scale: 1 + (HEADLINE_MAX_SCALE - 1) * t, lift: t }
}

export const cueOpacity = (progress: number): number => 1 - smoothstep(beat(progress, CUE_FADE))

export const readoutOpacity = (progress: number): number => 1 - smoothstep(beat(progress, READOUT_FADE))

/** Fades in over the first edge of its span, holds, then fades out over the last. */
export function captionOpacity(progress: number, range: BeatRange): number {
  const t = beat(progress, range)
  return smoothstep(t / CAPTION_EDGE) * (1 - smoothstep((t - (1 - CAPTION_EDGE)) / CAPTION_EDGE))
}

/** Where the lens starts while the scene loads: focused on nothing, far out. */
export const FOCUS_FAR_M = 99.9

/**
 * The loading screen's readout: the camera pulling focus. While the scene
 * loads the distance racks in from far out, landing on exactly the opening
 * shot's distance. The loading screen then crossfades from this line to the
 * viewfinder's own first reading (`formatReadout` at progress 0), so it hands
 * over to the Hero's HUD on the same number instead of a generic percentage.
 */
export function focusReadout(loaded: number, frame: CameraFrame = DEFAULT_FRAME): string {
  const { distanceM } = cameraReadout(0, frame)
  const t = smoothstep(Math.min(1, Math.max(0, loaded)))
  const distance = FOCUS_FAR_M + (distanceM - FOCUS_FAR_M) * t
  return `FOCUSING  ${distance.toFixed(1)}M`
}
