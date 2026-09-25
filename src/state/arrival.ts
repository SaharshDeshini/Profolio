import { revealAt, type RevealLayer } from '../scroll/reveal.ts'

/**
 * Arrival state: how far the 3D scene has loaded, and whether the arrival
 * screen has been dismissed. A module store (like activeProject) so the
 * arrival UI, the Lenis wiring and the scene can all read it without props,
 * and so it never pulls three.js into the landing bundle.
 */

export interface ArrivalState {
  /** Overall load, 0..1: the 3D code chunk first, then the scene's assets. */
  readonly progress: number
  /** The scene has committed its first real frame. */
  readonly ready: boolean
  readonly dismissed: boolean
  /** `performance.now()` when `dismissed` flipped true, so the 3D side can stage its reveal off the same clock as the DOM fade. */
  readonly dismissedAt: number | null
  /**
   * The opening plays at once instead of in layers: the visitor skipped,
   * arrived on a deep link, or prefers reduced motion. See `revealNow`.
   */
  readonly instant: boolean
}

/** The bar never starts empty: something is already happening. */
const INITIAL_PROGRESS = 0.06
/** Downloading the 3D code is the first slice of the bar; assets fill the rest. */
export const CODE_LOADED = 0.3
/** Long enough that a fast connection shows a loader, not a flash. */
export const MIN_VISIBLE_MS = 1400
export const MIN_VISIBLE_REDUCED_MS = 200
/** A hung asset must never trap the visitor behind the arrival screen. */
export const MAX_VISIBLE_MS = 9000

const INITIAL: ArrivalState = {
  progress: INITIAL_PROGRESS,
  ready: false,
  dismissed: false,
  dismissedAt: null,
  instant: false,
}

let state: ArrivalState = INITIAL
const listeners = new Set<() => void>()

function set(next: ArrivalState): void {
  state = next
  for (const listener of listeners) listener()
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

export function getArrival(): ArrivalState {
  return state
}

export function subscribeArrival(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Progress only ever moves forward, so the bar never jitters backwards. */
export function setArrivalProgress(progress: number): void {
  const next = clamp01(progress)
  if (next <= state.progress) return
  set({ ...state, progress: next })
}

export function markArrivalReady(): void {
  if (state.ready) return
  set({ ...state, progress: 1, ready: true })
}

/** `instant` skips the layered opening (see `revealNow`): for a skip, a deep link or reduced motion. */
export function dismissArrival(instant = false): void {
  if (state.dismissed) return
  set({ ...state, dismissed: true, dismissedAt: performance.now(), instant })
}

/**
 * How far one layer of the opening has revealed right now, 0..1: the one call
 * the scene and the DOM make, so they all read the same clock.
 */
export function revealNow(layer: RevealLayer, now: number = performance.now(), delayMs = 0): number {
  const since = state.dismissedAt === null ? null : now - state.dismissedAt
  return revealAt(layer, since, state.instant, delayMs)
}

/** Maps a 0..100 asset percentage onto the slice of the bar after the code chunk. */
export function overallProgress(assetPercent: number): number {
  return CODE_LOADED + (1 - CODE_LOADED) * clamp01(assetPercent / 100)
}

/**
 * How far ahead of the real load the bar may run. Real progress arrives in
 * lumps (code chunk, then one small model), so the bar creeps toward just
 * ahead of it instead of jumping, and only the scene's first frame lets it finish.
 */
export const DISPLAY_LEAD = 0.35
/** The bar never claims done before the scene has actually drawn. */
export const DISPLAY_CEILING = 0.92
/** Creep time constant: the bar closes ~63% of the gap to its target every this many ms, so it slows as it nears it. */
export const CREEP_TAU_MS = 900
/** Once ready, the last stretch fills quickly. */
export const FINISH_TAU_MS = 110
/** Close enough to full to call it full, so the finish does not crawl forever. */
const FULL = 0.998

const approach = (from: number, to: number, dtMs: number, tauMs: number): number =>
  from + (to - from) * (1 - Math.exp(-Math.max(0, dtMs) / tauMs))

/**
 * The value the loading bar shows, stepped forward by one frame of `dtMs`.
 * It only moves forward, never runs ahead of `DISPLAY_CEILING` before the scene
 * is ready, and never trails the real progress by more than the creep takes to catch up.
 */
export function displayedProgress(shown: number, real: number, ready: boolean, dtMs: number): number {
  if (ready) {
    const next = approach(shown, 1, dtMs, FINISH_TAU_MS)
    return next >= FULL ? 1 : next
  }
  const target = Math.min(DISPLAY_CEILING, clamp01(real) + DISPLAY_LEAD)
  return Math.min(DISPLAY_CEILING, Math.max(shown, approach(shown, target, dtMs, CREEP_TAU_MS)))
}

/**
 * When to let the visitor in: the scene is ready, the bar has visibly reached
 * the end and it has been shown long enough, or it has waited too long.
 */
export function shouldDismiss(
  current: ArrivalState,
  elapsedMs: number,
  reducedMotion: boolean,
  displayed: number = 1,
): boolean {
  if (current.dismissed) return false
  if (elapsedMs >= MAX_VISIBLE_MS) return true
  const minimum = reducedMotion ? MIN_VISIBLE_REDUCED_MS : MIN_VISIBLE_MS
  return current.ready && displayed >= 1 && elapsedMs >= minimum
}

/** Test seam: the store is module state, so tests reset it between cases. */
export function resetArrival(): void {
  state = INITIAL
  listeners.clear()
}
