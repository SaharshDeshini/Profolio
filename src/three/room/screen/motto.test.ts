import { describe, expect, it } from 'vitest'
import { ACT1_BEATS } from '../../../scroll/beats.ts'
import { mottoOpacities, splitMotto } from './motto.ts'

const STEPS = 400
const samples = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS)

describe('splitMotto', () => {
  it('splits a two-sentence line into its sentences, in order', () => {
    expect(splitMotto('Problems come first. Code later.')).toEqual([
      'Problems come first.',
      'Code later.',
    ])
  })

  it('keeps a single sentence as one line', () => {
    expect(splitMotto('Just one.')).toEqual(['Just one.'])
  })

  it('splits on any sentence-ending punctuation and drops empty pieces', () => {
    expect(splitMotto('  One!  Two?   Three.  ')).toEqual(['One!', 'Two?', 'Three.'])
    expect(splitMotto('')).toEqual([])
  })
})

describe('mottoOpacities', () => {
  it('shows nothing until the motto beat starts', () => {
    expect(mottoOpacities(0, 2)).toEqual([0, 0])
    expect(mottoOpacities(ACT1_BEATS.motto[0], 2)).toEqual([0, 0])
  })

  it('has every line fully in by the end of the motto beat, and keeps it there', () => {
    expect(mottoOpacities(ACT1_BEATS.motto[1], 2)).toEqual([1, 1])
    expect(mottoOpacities(1, 2)).toEqual([1, 1])
  })

  it('lands the lines one after another: a later line never shows before the earlier is fully in', () => {
    for (const p of samples) {
      const [first, second] = mottoOpacities(p, 2) as [number, number]
      if (second > 0) expect(first, `p=${p}`).toBe(1)
    }
  })

  it('only ever fades in, never back out', () => {
    let previous = [0, 0]
    for (const p of samples) {
      const current = mottoOpacities(p, 2)
      current.forEach((value, i) => expect(value).toBeGreaterThanOrEqual((previous[i] ?? 0) - 1e-9))
      previous = current
    }
  })

  it('stays within 0..1', () => {
    for (const p of samples) {
      for (const value of mottoOpacities(p, 3)) {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      }
    }
  })

  it('works for any number of lines, finishing them all by the end of the beat', () => {
    for (const lines of [1, 2, 3, 4]) {
      const done = mottoOpacities(ACT1_BEATS.motto[1], lines)
      expect(done).toHaveLength(lines)
      expect(done.every((value) => value === 1)).toBe(true)
    }
  })

  it('returns no opacities for no lines', () => {
    expect(mottoOpacities(0.8, 0)).toEqual([])
  })

  it('treats NaN as the start rather than producing NaN opacity', () => {
    expect(mottoOpacities(Number.NaN, 2)).toEqual([0, 0])
  })
})
