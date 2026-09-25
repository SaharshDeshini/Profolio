import { ACT1_BEATS, beat, smoothstep } from '../../scroll/beats.ts'

/** Radians from shut (0). About 110 degrees: past upright and tilted back, like a laptop in use. */
export const LID_OPEN_ANGLE = 1.92

/**
 * Lid rotation about its hinge, driven only by the lid beat, so the lid can
 * never be open at the wrong camera angle.
 */
export function lidAngleAt(progress: number): number {
  return LID_OPEN_ANGLE * smoothstep(beat(progress, ACT1_BEATS.lid))
}
