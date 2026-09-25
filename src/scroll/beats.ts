/**
 * A `[start, end]` span of overall story progress, both in 0..1. Named
 * `BeatRange` so it can never be confused with the DOM's global `Range`.
 */
export type BeatRange = readonly [start: number, end: number]

export const clamp01 = (value: number): number =>
  Number.isNaN(value) ? 0 : Math.min(1, Math.max(0, value))

/** Ease-in-out on 0..1: gentle at both ends, so motion never starts or stops abruptly. */
export const smoothstep = (t: number): number => {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

/** How far `p` is through `range`, as 0..1. A zero-width or inverted range acts as a hard step at its start. */
export function beat(p: number, [start, end]: BeatRange): number {
  if (end <= start) return p >= start ? 1 : 0
  return clamp01((p - start) / (end - start))
}

/**
 * The Act 1 timeline, in overall story progress (0 = top of page, 1 = docked).
 *
 * Every scroll-driven value (camera, lid, lighting, dock) is derived from one
 * scalar by sampling these ranges, so they can never drift out of sync: the
 * lid cannot be open at the wrong camera angle. Ranges overlap on purpose: the
 * story is one continuous move, not a sequence of separate animations.
 *
 * What each beat is *for*, not just what it moves — check new timing against
 * this before changing a range:
 *   pushIn [0, 0.30]    "The Approach" — closing distance on a closed laptop, nothing decided yet.
 *   orbit  [0.25, 0.68] "The Turn" — the camera moves from an anonymous back view to the working side.
 *   lid    [0.58, 0.74] "The Open" — the machine wakes as the turn resolves.
 *   motto  [0.70, 0.84] "The Words" — the screen lights and states what this is.
 *   dock   [0.80, 1.00] "The Settle" — the camera stops being a camera; the work begins.
 * (`READOUT_FADE` in actOne.ts, [0.76, 0.84], is that last line made literal:
 * the viewfinder HUD dies just as the settle begins. The story captions in
 * actOne.ts, one line per beat from content/story.ts, run from the end of the
 * name's fade to the start of "The Words", narrating the approach and the turn.)
 */
export const ACT1_BEATS = {
  pushIn: [0, 0.3],
  orbit: [0.25, 0.68],
  lid: [0.58, 0.74],
  motto: [0.7, 0.84],
  dock: [0.8, 1],
} as const satisfies Record<string, BeatRange>
