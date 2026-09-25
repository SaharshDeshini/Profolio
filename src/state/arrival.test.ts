import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CODE_LOADED,
  DISPLAY_CEILING,
  DISPLAY_LEAD,
  MAX_VISIBLE_MS,
  MIN_VISIBLE_MS,
  MIN_VISIBLE_REDUCED_MS,
  dismissArrival,
  displayedProgress,
  revealNow,
  getArrival,
  markArrivalReady,
  overallProgress,
  resetArrival,
  setArrivalProgress,
  shouldDismiss,
  subscribeArrival,
  type ArrivalState,
} from './arrival.ts'

beforeEach(resetArrival)

describe('arrival store', () => {
  it('starts visible, not ready, with a non-empty bar', () => {
    const initial = getArrival()
    expect(initial.dismissed).toBe(false)
    expect(initial.ready).toBe(false)
    expect(initial.progress).toBeGreaterThan(0)
  })

  it('only ever moves progress forward and clamps it to 0..1', () => {
    setArrivalProgress(0.5)
    setArrivalProgress(0.2)
    expect(getArrival().progress).toBe(0.5)
    setArrivalProgress(4)
    expect(getArrival().progress).toBe(1)
  })

  it('marking ready fills the bar and is idempotent', () => {
    const listener = vi.fn()
    subscribeArrival(listener)
    markArrivalReady()
    markArrivalReady()
    expect(getArrival()).toMatchObject({ ready: true, progress: 1 })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('dismisses once and notifies subscribers once', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeArrival(listener)
    dismissArrival()
    dismissArrival()
    expect(getArrival().dismissed).toBe(true)
    expect(getArrival().dismissedAt).toEqual(expect.any(Number))
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    resetArrival()
    dismissArrival()
    expect(listener).toHaveBeenCalledTimes(1)
  })
})

describe('overallProgress', () => {
  it('leaves the first slice for the code chunk and fills the rest with assets', () => {
    expect(overallProgress(0)).toBe(CODE_LOADED)
    expect(overallProgress(100)).toBe(1)
    expect(overallProgress(50)).toBeCloseTo(CODE_LOADED + (1 - CODE_LOADED) / 2)
  })

  it('clamps out-of-range percentages', () => {
    expect(overallProgress(-20)).toBe(CODE_LOADED)
    expect(overallProgress(250)).toBe(1)
  })
})

describe('shouldDismiss', () => {
  const ready: ArrivalState = { progress: 1, ready: true, dismissed: false, dismissedAt: null, instant: false }
  const loading: ArrivalState = { progress: 0.5, ready: false, dismissed: false, dismissedAt: null, instant: false }

  it('waits for the scene and for the minimum time', () => {
    expect(shouldDismiss(loading, MIN_VISIBLE_MS + 1, false)).toBe(false)
    expect(shouldDismiss(ready, MIN_VISIBLE_MS - 1, false)).toBe(false)
    expect(shouldDismiss(ready, MIN_VISIBLE_MS, false)).toBe(true)
  })

  it('uses a much shorter minimum for reduced motion', () => {
    expect(shouldDismiss(ready, MIN_VISIBLE_REDUCED_MS, true)).toBe(true)
    expect(shouldDismiss(ready, MIN_VISIBLE_REDUCED_MS, false)).toBe(false)
  })

  it('never traps the visitor: gives up after the maximum even if not ready', () => {
    expect(shouldDismiss(loading, MAX_VISIBLE_MS, false)).toBe(true)
  })

  it('waits for the bar to visibly reach the end', () => {
    expect(shouldDismiss(ready, MIN_VISIBLE_MS, false, 0.95)).toBe(false)
    expect(shouldDismiss(ready, MIN_VISIBLE_MS, false, 1)).toBe(true)
  })

  it('does nothing once dismissed', () => {
    expect(shouldDismiss({ ...ready, dismissed: true }, MAX_VISIBLE_MS, false)).toBe(false)
  })
})

describe('displayedProgress', () => {
  const FRAME = 16

  it('creeps forward every frame instead of jumping to the real value', () => {
    const next = displayedProgress(0.06, 1, false, FRAME)
    expect(next).toBeGreaterThan(0.06)
    expect(next).toBeLessThan(0.2)
  })

  it('never shows done before the scene is ready, however long it waits', () => {
    let shown = 0.06
    for (let i = 0; i < 2000; i += 1) shown = displayedProgress(shown, 1, false, FRAME)
    expect(shown).toBeLessThanOrEqual(DISPLAY_CEILING)
    expect(shown).toBeGreaterThan(DISPLAY_CEILING - 0.01)
  })

  it('stays within a lead of the real load while it is slow', () => {
    let shown = 0.06
    for (let i = 0; i < 2000; i += 1) shown = displayedProgress(shown, 0.3, false, FRAME)
    expect(shown).toBeLessThanOrEqual(0.3 + DISPLAY_LEAD + 1e-9)
  })

  it('only ever moves forward, even if the real value is lower than shown', () => {
    expect(displayedProgress(0.8, 0.1, false, FRAME)).toBe(0.8)
  })

  it('finishes quickly once ready and lands exactly on 1', () => {
    let shown = 0.7
    let frames = 0
    while (shown < 1 && frames < 200) {
      shown = displayedProgress(shown, 1, true, FRAME)
      frames += 1
    }
    expect(shown).toBe(1)
    expect(frames * FRAME).toBeLessThan(1000)
  })

  it('treats a negative frame time as no time', () => {
    expect(displayedProgress(0.5, 1, false, -50)).toBe(0.5)
  })
})

describe('revealNow', () => {
  it('reveals nothing until the arrival screen is dismissed', () => {
    expect(revealNow('model', 10_000)).toBe(0)
  })

  it('plays the opening in layers from the moment of dismissal', () => {
    dismissArrival()
    const at = getArrival().dismissedAt ?? 0
    expect(revealNow('model', at + 5000)).toBe(1)
    expect(revealNow('text', at + 100)).toBe(0)
  })

  it('reveals everything at once when dismissed as instant', () => {
    dismissArrival(true)
    const at = getArrival().dismissedAt ?? 0
    expect(getArrival().instant).toBe(true)
    expect(revealNow('text', at)).toBe(1)
  })
})
