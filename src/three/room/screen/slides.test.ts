import { describe, expect, it } from 'vitest'
import { MAX_DELTA } from '../../../scroll/progress.ts'
import { dampToward } from './slides.ts'

describe('dampToward', () => {
  it('moves towards the target without reaching or passing it in one step', () => {
    const next = dampToward(0, 1, 1 / 60)
    expect(next).toBeGreaterThan(0)
    expect(next).toBeLessThan(1)
  })

  it('never overshoots, however long the frame', () => {
    expect(dampToward(0, 1, 10)).toBeLessThanOrEqual(1)
    expect(dampToward(1, 0, 10)).toBeGreaterThanOrEqual(0)
  })

  it('is frame-rate independent: two half steps equal one whole step', () => {
    const whole = dampToward(0, 1, 1 / 30)
    const halves = dampToward(dampToward(0, 1, 1 / 60), 1, 1 / 60)
    expect(halves).toBeCloseTo(whole, 10)
  })

  it('converges on the target over enough frames', () => {
    let value = 0
    for (let i = 0; i < 120; i++) value = dampToward(value, 1, 1 / 60)
    expect(value).toBeCloseTo(1, 3)
  })

  it('caps a huge frame so a resumed tab cannot jump the fade', () => {
    expect(dampToward(0, 1, 5)).toBeCloseTo(dampToward(0, 1, MAX_DELTA), 10)
  })

  it('leaves the value alone for a zero, negative or NaN delta', () => {
    for (const delta of [0, -1, Number.NaN]) expect(dampToward(0.4, 1, delta)).toBe(0.4)
  })

  it('snaps for a zero, negative or NaN time constant', () => {
    for (const smoothTime of [0, -1, Number.NaN]) expect(dampToward(0, 1, 1 / 60, smoothTime)).toBe(1)
  })
})
