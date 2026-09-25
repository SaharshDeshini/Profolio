import { ACT1_BEATS, beat, smoothstep } from '../../../scroll/beats.ts'

/** "Problems come first. Code later." becomes one line per sentence, so the second can land a beat after the first. */
export function splitMotto(motto: string): string[] {
  return motto
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

/** Each line fades in over the first 80% of its slot, leaving a short pause before the next one starts. */
const FADE_SHARE = 0.8

/**
 * Opacity of each motto line at a given story progress. Every line gets an
 * equal slot of the motto beat, so a later line never shows before the earlier
 * one is fully in, and all of them are done by the end of the beat.
 */
export function mottoOpacities(progress: number, lineCount: number): number[] {
  const [start, end] = ACT1_BEATS.motto
  const slot = (end - start) / Math.max(lineCount, 1)

  return Array.from({ length: Math.max(lineCount, 0) }, (_, index) => {
    const lineStart = start + index * slot
    return smoothstep(beat(progress, [lineStart, lineStart + slot * FADE_SHARE]))
  })
}
