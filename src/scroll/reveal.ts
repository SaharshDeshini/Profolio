import { clamp01, smoothstep } from './beats.ts'

/**
 * The opening, after the loading screen: one timeline so every piece of it
 * (the veil lifting, the rim light finding the figure, the overhead spot
 * switching on, the dust, the words) comes from the same clock and can never
 * drift out of order. Measured in ms after the arrival screen is dismissed
 * (`ArrivalState.dismissedAt`), so it is wall-clock, not scroll.
 *
 * The order is the story of a dark room coming on: first you make out a
 * figure, then a light finds him, then the air in the room, then the words.
 */
export type RevealLayer = 'veil' | 'model' | 'spotlight' | 'particles' | 'text'

export const REVEAL_WINDOWS: Readonly<Record<RevealLayer, readonly [start: number, end: number]>> = {
  /** The loading screen fading away. */
  veil: [0, 1600],
  /** Rim lights come up: the figure emerges as a silhouette. */
  model: [400, 2000],
  /** The overhead key light switches on, with its visible shaft. */
  spotlight: [1900, 3100],
  /** Dust in the air. */
  particles: [2900, 4100],
  /** The name, the readouts, the scroll cue. */
  text: [3800, 4800],
}

/** How long the whole opening takes: the end of its last layer. */
export const REVEAL_TOTAL_MS = Math.max(...Object.values(REVEAL_WINDOWS).map(([, end]) => end))

/** Extra delay per text element, so the name, the readouts and the cue resolve one after another. */
export const TEXT_STAGGER_MS = 150

/**
 * How far `layer` has revealed, 0..1, eased at both ends. Before dismissal
 * (`msSinceDismiss` null) nothing is revealed; a skipped or reduced-motion
 * visitor gets everything at once.
 */
export function revealAt(
  layer: RevealLayer,
  msSinceDismiss: number | null,
  instant = false,
  delayMs = 0,
): number {
  if (instant) return 1
  if (msSinceDismiss === null) return 0
  const [start, end] = REVEAL_WINDOWS[layer]
  return smoothstep(clamp01((msSinceDismiss - start - delayMs) / (end - start)))
}
