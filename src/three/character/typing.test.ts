import { describe, expect, it } from 'vitest'
import { ACT1_BEATS } from '../../scroll/beats.ts'
import { TYPING_BLEND, typingWeightAt } from './typing.ts'

describe('typingWeightAt', () => {
  it('is pure sitting before the lid finishes opening', () => {
    expect(typingWeightAt(0)).toBe(0)
    expect(typingWeightAt(ACT1_BEATS.lid[0])).toBe(0)
    expect(typingWeightAt(ACT1_BEATS.lid[1])).toBe(0)
  })

  it('is pure typing once the blend range ends', () => {
    expect(typingWeightAt(TYPING_BLEND[1])).toBe(1)
    expect(typingWeightAt(1)).toBe(1)
  })

  it('rises monotonically through the blend range', () => {
    const [start, end] = TYPING_BLEND
    const mid = (start + end) / 2
    expect(typingWeightAt(mid)).toBeGreaterThan(typingWeightAt(start))
    expect(typingWeightAt(end)).toBeGreaterThan(typingWeightAt(mid))
  })

  it('reverses cleanly: the weight at a progress depends only on that progress', () => {
    const [, end] = TYPING_BLEND
    const p = end - 0.01
    expect(typingWeightAt(p)).toBe(typingWeightAt(p))
  })
})
