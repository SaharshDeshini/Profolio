import { clamp01 } from '../../../scroll/beats.ts'

/**
 * How visible each project slide currently is on the laptop screen.
 *
 * A small module singleton for the same reason `progress` is one: the slides
 * write it every frame from inside the render loop and the motto reads it
 * there, so routing it through React state or props would re-render per frame.
 */
const mixes = new Map<string, number>()

export function reportSlideMix(slug: string, mix: number): void {
  mixes.set(slug, clamp01(mix))
}

/** How much of the screen the project slides cover, 0..1: the most visible slide sets it. */
export function projectCover(): number {
  let cover = 0
  for (const mix of mixes.values()) cover = Math.max(cover, mix)
  return cover
}

/** Forget every slide. For tests; the app never needs it. */
export function resetSlideMixes(): void {
  mixes.clear()
}
