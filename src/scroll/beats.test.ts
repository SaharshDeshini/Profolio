import { describe, expect, it } from 'vitest'
import { ACT1_BEATS, beat, clamp01, smoothstep } from './beats.ts'

describe('clamp01', () => {
  it('clamps values below 0 and above 1', () => {
    expect(clamp01(-3)).toBe(0)
    expect(clamp01(7)).toBe(1)
  })

  it('passes values that are already in range', () => {
    expect(clamp01(0.37)).toBe(0.37)
  })

  it('maps NaN to 0 instead of propagating it', () => {
    expect(clamp01(Number.NaN)).toBe(0)
  })

  it('saturates at plus and minus infinity', () => {
    expect(clamp01(Number.POSITIVE_INFINITY)).toBe(1)
    expect(clamp01(Number.NEGATIVE_INFINITY)).toBe(0)
  })
})

describe('smoothstep', () => {
  it('is 0 at the start, 1 at the end and 0.5 in the middle', () => {
    expect(smoothstep(0)).toBe(0)
    expect(smoothstep(1)).toBe(1)
    expect(smoothstep(0.5)).toBeCloseTo(0.5, 10)
  })

  it('is monotonic, including both endpoints', () => {
    let previous = Number.NEGATIVE_INFINITY
    for (let i = 0; i <= 100; i++) {
      const value = smoothstep(i / 100)
      expect(value, `t=${i / 100}`).toBeGreaterThanOrEqual(previous)
      previous = value
    }
  })

  it('is the cubic 3t^2 - 2t^3, not some other ease', () => {
    expect(smoothstep(0.25)).toBeCloseTo(0.15625, 10)
    expect(smoothstep(0.75)).toBeCloseTo(0.84375, 10)
  })

  it('eases in: slower than linear near the start', () => {
    expect(smoothstep(0.1)).toBeLessThan(0.1)
  })

  it('clamps inputs outside 0..1', () => {
    expect(smoothstep(-1)).toBe(0)
    expect(smoothstep(2)).toBe(1)
  })
})

describe('beat', () => {
  it('is 0 before the range and 1 after it', () => {
    expect(beat(0.1, [0.2, 0.6])).toBe(0)
    expect(beat(0.9, [0.2, 0.6])).toBe(1)
  })

  it('is linear inside the range', () => {
    expect(beat(0.4, [0.2, 0.6])).toBeCloseTo(0.5, 10)
    expect(beat(0.3, [0.2, 0.6])).toBeCloseTo(0.25, 10)
  })

  it('treats a zero-width range as a hard step and never returns NaN', () => {
    expect(beat(0.29, [0.3, 0.3])).toBe(0)
    expect(beat(0.3, [0.3, 0.3])).toBe(1)
    expect(Number.isNaN(beat(0.3, [0.3, 0.3]))).toBe(false)
  })

  it('treats an inverted range as a hard step at its start, ignoring the end', () => {
    expect(beat(0.35, [0.5, 0.2])).toBe(0)
    expect(beat(0.49, [0.5, 0.2])).toBe(0)
    expect(beat(0.5, [0.5, 0.2])).toBe(1)
  })

  it('is total for NaN and infinite progress', () => {
    expect(beat(Number.NaN, [0.2, 0.6])).toBe(0)
    expect(beat(Number.POSITIVE_INFINITY, [0.2, 0.6])).toBe(1)
    expect(beat(Number.NEGATIVE_INFINITY, [0.2, 0.6])).toBe(0)
  })
})

describe('ACT1_BEATS invariants', () => {
  const entries = Object.entries(ACT1_BEATS)

  it('keeps every range ordered and inside [0, 1]', () => {
    for (const [name, [start, end]] of entries) {
      expect(start, `${name} start`).toBeGreaterThanOrEqual(0)
      expect(end, `${name} end`).toBeLessThanOrEqual(1)
      expect(start, `${name} is ordered`).toBeLessThan(end)
    }
  })

  it('has no dead zone: something is always moving, so it plays as one continuous move', () => {
    const ranges = Object.values(ACT1_BEATS)
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000
      expect(
        ranges.some(([start, end]) => p >= start && p <= end),
        `p=${p}`,
      ).toBe(true)
    }
  })

  it('only opens the lid once the orbit to behind the person is mostly complete', () => {
    expect(beat(ACT1_BEATS.lid[0], ACT1_BEATS.orbit)).toBeGreaterThanOrEqual(0.7)
  })

  it('starts the motto only after the lid has started opening', () => {
    expect(ACT1_BEATS.motto[0]).toBeGreaterThan(ACT1_BEATS.lid[0])
  })

  it('starts the dock only after the motto has begun to appear', () => {
    expect(ACT1_BEATS.dock[0]).toBeGreaterThan(ACT1_BEATS.motto[0])
  })

  it('finishes the dock exactly at the end of Act 1', () => {
    expect(ACT1_BEATS.dock[1]).toBe(1)
  })
})
