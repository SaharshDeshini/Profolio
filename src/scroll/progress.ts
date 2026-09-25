import { clamp01 } from './beats.ts'

export interface StoryProgress {
  /** Written by ScrollTrigger. Already smoothed by Lenis, so it is used as-is. */
  raw: number
  /** `raw` after a token amount of frame-rate-independent damping. Everything reads this. */
  smooth: number
}

const state: StoryProgress = { raw: 0, smooth: 0 }

/**
 * The single scalar every scroll-driven system derives from.
 *
 * Deliberately a mutable module singleton rather than React state or an
 * immutable store: it changes every frame and is read inside `useFrame`, where
 * a re-render per scroll event would defeat the point. This is the one place in
 * the codebase where mutation is intentional.
 *
 * The exported view is read-only, so only the functions below can write it and
 * their clamping and NaN guards cannot be bypassed.
 */
export const progress: Readonly<StoryProgress> = state

/**
 * Lenis is the sole smoothing authority, so this is only enough damping to make
 * the render loop frame-rate independent, not to add feel.
 */
export const SMOOTH_TIME = 0.06

/** Caps a frame's delta so a backgrounded tab resuming cannot fling `smooth` around. */
export const MAX_DELTA = 1 / 30

/**
 * `useFrame` priority for the driver that damps progress. It must stay
 * negative: a negative priority only orders callbacks, while any positive one
 * takes over the render loop and leaves a black canvas.
 */
export const SCROLL_DRIVER_PRIORITY = -1000

export function setRawProgress(value: number): void {
  if (!Number.isFinite(value)) return
  state.raw = clamp01(value)
}

/** Jump both values without animating: used for reduced motion, mobile and reloads part-way down. */
export function snapProgress(value: number): void {
  if (!Number.isFinite(value)) return
  const clamped = clamp01(value)
  state.raw = clamped
  state.smooth = clamped
}

/**
 * Exponential smoothing: exactly frame-rate independent (two half-steps equal
 * one full step) and cannot overshoot, unlike a lerp with a fixed factor.
 */
export function dampProgress(delta: number, smoothTime: number = SMOOTH_TIME): void {
  if (!(delta > 0)) return
  const dt = Math.min(delta, MAX_DELTA)
  // A zero, negative or NaN time constant means "no smoothing": snap, rather than let exp() diverge.
  const blend = smoothTime > 0 ? 1 - Math.exp(-dt / smoothTime) : 1
  state.smooth += (state.raw - state.smooth) * blend
}
