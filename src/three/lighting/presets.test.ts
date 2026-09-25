import { describe, expect, it } from 'vitest'
import { ACT1_BEATS } from '../../scroll/beats.ts'
import { SECTION_IDS } from '../../scroll/sections.ts'
import { ACT1_MOOD, ACT2_MOOD, ACT2_SECTION_MOOD, type LightMood, mixMood, moodAt, sectionMood } from './presets.ts'

const STEPS = 400
const samples = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS)

const between = (value: number, a: number, b: number): boolean =>
  value >= Math.min(a, b) - 1e-9 && value <= Math.max(a, b) + 1e-9

describe('mixMood', () => {
  it('returns the first mood at t=0 and the second at t=1', () => {
    expect(mixMood(ACT1_MOOD, ACT2_MOOD, 0)).toEqual(ACT1_MOOD)
    expect(mixMood(ACT1_MOOD, ACT2_MOOD, 1)).toEqual(ACT2_MOOD)
  })

  it('lands halfway at t=0.5', () => {
    const halfway = mixMood(ACT1_MOOD, ACT2_MOOD, 0.5)
    expect(halfway.key).toBeCloseTo((ACT1_MOOD.key + ACT2_MOOD.key) / 2, 10)
    expect(halfway.rim).toBeCloseTo((ACT1_MOOD.rim + ACT2_MOOD.rim) / 2, 10)
  })
})

describe('moodAt', () => {
  it('starts as the dark opening: act-one lighting, screen off', () => {
    expect(moodAt(0)).toEqual({ ...ACT1_MOOD, screen: 0 })
  })

  it('ends exactly on the act-two preset', () => {
    expect(moodAt(1)).toEqual(ACT2_MOOD)
  })

  it('keeps the screen dark until the lid starts to open', () => {
    for (const p of samples) {
      if (p <= ACT1_BEATS.lid[0]) expect(moodAt(p).screen, `p=${p}`).toBe(0)
    }
  })

  it('only ever brings the screen up, never back down', () => {
    let previous = -1
    for (const p of samples) {
      const { screen } = moodAt(p)
      expect(screen).toBeGreaterThanOrEqual(previous - 1e-9)
      previous = screen
    }
  })

  it('never overshoots either preset while cross-fading', () => {
    for (const p of samples) {
      const mood: LightMood = moodAt(p)
      expect(between(mood.ambient, ACT1_MOOD.ambient, ACT2_MOOD.ambient), `ambient p=${p}`).toBe(true)
      expect(between(mood.rim, ACT1_MOOD.rim, ACT2_MOOD.rim), `rim p=${p}`).toBe(true)
      expect(between(mood.key, ACT1_MOOD.key, ACT2_MOOD.key), `key p=${p}`).toBe(true)
      expect(between(mood.screen, 0, 1), `screen p=${p}`).toBe(true)
    }
  })

  it('keeps the room dark: fill light stays low so the screen is the light source', () => {
    for (const p of samples) expect(moodAt(p).ambient).toBeLessThanOrEqual(0.1)
  })

  it('treats NaN as the start rather than producing NaN lights', () => {
    expect(moodAt(Number.NaN)).toEqual(moodAt(0))
  })
})

describe('sectionMood', () => {
  it("keeps 'intro' identical to ACT2_MOOD, so the Act 1 handoff stays silent", () => {
    expect(ACT2_SECTION_MOOD.intro).toEqual({})
    expect(sectionMood('intro')).toEqual(ACT2_MOOD)
  })

  it('overlays only the fields a section defines, keeping the rest at ACT2_MOOD', () => {
    for (const id of SECTION_IDS) {
      const mood = sectionMood(id)
      const overlay = ACT2_SECTION_MOOD[id]
      for (const key of Object.keys(ACT2_MOOD) as (keyof LightMood)[]) {
        const expected = key in overlay ? (overlay[key] as number) : ACT2_MOOD[key]
        expect(mood[key], `${id}.${key}`).toBe(expected)
      }
    }
  })

  it('never darkens the room past ACT1/ACT2’s own low-ambient discipline', () => {
    for (const id of SECTION_IDS) expect(sectionMood(id).ambient).toBeLessThanOrEqual(0.1)
  })
})
