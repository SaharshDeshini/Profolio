import { beforeEach, describe, expect, it } from 'vitest'
import {
  dampProgress,
  MAX_DELTA,
  progress,
  SCROLL_DRIVER_PRIORITY,
  setRawProgress,
  snapProgress,
} from './progress.ts'

beforeEach(() => {
  snapProgress(0)
})

describe('setRawProgress', () => {
  it('stores in-range values', () => {
    setRawProgress(0.42)
    expect(progress.raw).toBe(0.42)
  })

  it('clamps out-of-range values to [0, 1]', () => {
    setRawProgress(-0.5)
    expect(progress.raw).toBe(0)
    setRawProgress(1.5)
    expect(progress.raw).toBe(1)
  })

  it('ignores non-finite input rather than poisoning the state', () => {
    setRawProgress(0.6)
    setRawProgress(Number.NaN)
    setRawProgress(Number.POSITIVE_INFINITY)
    setRawProgress(Number.NEGATIVE_INFINITY)
    expect(progress.raw).toBe(0.6)
  })
})

describe('snapProgress', () => {
  it('sets raw and smooth together so nothing animates', () => {
    snapProgress(0.8)
    expect(progress.raw).toBe(0.8)
    expect(progress.smooth).toBe(0.8)
  })

  it('clamps to [0, 1]', () => {
    snapProgress(9)
    expect(progress.smooth).toBe(1)
    snapProgress(-9)
    expect(progress.smooth).toBe(0)
  })

  it('ignores non-finite input, exactly as setRawProgress does', () => {
    snapProgress(0.4)
    snapProgress(Number.NaN)
    expect(progress.raw).toBe(0.4)
    expect(progress.smooth).toBe(0.4)
  })
})

describe('dampProgress', () => {
  it('moves smooth toward raw without overshooting', () => {
    setRawProgress(1)
    dampProgress(1 / 60)
    expect(progress.smooth).toBeGreaterThan(0)
    expect(progress.smooth).toBeLessThan(1)
  })

  it('closes 1 - 1/e of the gap after one time constant, whatever the default is', () => {
    setRawProgress(1)
    dampProgress(0.02, 0.04)
    dampProgress(0.02, 0.04)
    expect(progress.smooth).toBeCloseTo(1 - Math.exp(-1), 10)
  })

  it('converges to raw given enough time', () => {
    setRawProgress(0.7)
    for (let i = 0; i < 600; i++) dampProgress(1 / 60)
    expect(progress.smooth).toBeCloseTo(0.7, 4)
  })

  it('never overshoots when scrolling back down', () => {
    snapProgress(1)
    setRawProgress(0.2)
    for (let i = 0; i < 300; i++) {
      dampProgress(1 / 60)
      expect(progress.smooth).toBeGreaterThanOrEqual(0.2)
    }
  })

  it('is frame-rate independent: one 32ms step equals two 16ms steps', () => {
    setRawProgress(1)
    dampProgress(0.032)
    const oneStep = progress.smooth

    snapProgress(0)
    setRawProgress(1)
    dampProgress(0.016)
    dampProgress(0.016)

    expect(progress.smooth).toBeCloseTo(oneStep, 10)
  })

  it('clamps huge deltas so a tab refocus cannot jump or produce NaN', () => {
    setRawProgress(1)
    dampProgress(5)
    expect(Number.isFinite(progress.smooth)).toBe(true)
    expect(progress.smooth).toBeLessThan(1)

    snapProgress(0)
    setRawProgress(1)
    dampProgress(MAX_DELTA)
    const atClamp = progress.smooth

    snapProgress(0)
    setRawProgress(1)
    dampProgress(5)
    expect(progress.smooth).toBeCloseTo(atClamp, 10)
  })

  it('does nothing for a zero or negative delta', () => {
    snapProgress(0.3)
    setRawProgress(0.9)
    dampProgress(0)
    dampProgress(-1)
    expect(progress.smooth).toBe(0.3)
  })

  it('ignores a NaN delta and clamps an infinite one', () => {
    snapProgress(0.3)
    setRawProgress(0.9)
    dampProgress(Number.NaN)
    expect(progress.smooth).toBe(0.3)
    dampProgress(Number.POSITIVE_INFINITY)
    expect(progress.smooth).toBeGreaterThan(0.3)
    expect(progress.smooth).toBeLessThan(0.9)
  })

  it.each([0, -0, -0.06, Number.NaN])(
    'treats smoothTime=%s as "no smoothing": finite, and never outside smooth..raw',
    (smoothTime) => {
      snapProgress(0.2)
      setRawProgress(0.8)
      dampProgress(1 / 60, smoothTime)
      expect(Number.isFinite(progress.smooth)).toBe(true)
      expect(progress.smooth).toBeGreaterThanOrEqual(0.2)
      expect(progress.smooth).toBeLessThanOrEqual(0.8)
    },
  )
})

describe('SCROLL_DRIVER_PRIORITY', () => {
  it('is negative: any positive priority takes over the render loop and leaves a black canvas', () => {
    expect(SCROLL_DRIVER_PRIORITY).toBeLessThan(0)
  })
})
