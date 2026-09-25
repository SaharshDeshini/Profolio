import { ACT1_BEATS, beat, smoothstep, type BeatRange } from '../../scroll/beats.ts'

/**
 * Once the lid is open, the person moves their hands to the keyboard: a short
 * blend right after `ACT1_BEATS.lid` ends, well before the motto beat starts
 * so the switch never fights for attention with the screen's own animation.
 */
export const TYPING_BLEND: BeatRange = [ACT1_BEATS.lid[1], ACT1_BEATS.lid[1] + 0.1]

/** How much of the "Type" clip to mix in, 0 (all "Sit") to 1 (all "Type"). Reverses cleanly on scroll-back. */
export const typingWeightAt = (progress: number): number => smoothstep(beat(progress, TYPING_BLEND))
