import { MAX_DELTA } from '../../../scroll/progress.ts'

/** How quickly a project slide fades on the laptop screen: a short, soft cross-fade. */
export const SLIDE_SMOOTH_TIME = 0.14

/**
 * One step of exponential smoothing towards `target`. Exactly frame-rate
 * independent and unable to overshoot, so a slide's opacity can never flicker
 * past 0 or 1. A non-positive time constant means "no smoothing": snap.
 */
export function dampToward(
  current: number,
  target: number,
  delta: number,
  smoothTime: number = SLIDE_SMOOTH_TIME,
): number {
  if (!(delta > 0)) return current
  if (!(smoothTime > 0)) return target
  const blend = 1 - Math.exp(-Math.min(delta, MAX_DELTA) / smoothTime)
  return current + (target - current) * blend
}
