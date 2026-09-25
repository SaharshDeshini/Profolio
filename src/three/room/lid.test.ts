import { describe, expect, it } from 'vitest'
import { ACT1_BEATS, beat } from '../../scroll/beats.ts'
import { LID_OPEN_ANGLE, lidAngleAt } from './lid.ts'

const STEPS = 400
const samples = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS)

describe('lidAngleAt', () => {
  it('is shut at the start and until the lid beat begins', () => {
    expect(lidAngleAt(0)).toBe(0)
    expect(lidAngleAt(ACT1_BEATS.lid[0])).toBe(0)
  })

  it('is fully open by the end of the lid beat, and stays open', () => {
    expect(lidAngleAt(ACT1_BEATS.lid[1])).toBeCloseTo(LID_OPEN_ANGLE, 10)
    expect(lidAngleAt(1)).toBeCloseTo(LID_OPEN_ANGLE, 10)
  })

  it('opens steadily and never closes again', () => {
    let previous = -1
    for (const p of samples) {
      const angle = lidAngleAt(p)
      expect(angle).toBeGreaterThanOrEqual(previous)
      previous = angle
    }
  })

  it('never leaves the range between shut and fully open', () => {
    for (const p of samples) {
      expect(lidAngleAt(p)).toBeGreaterThanOrEqual(0)
      expect(lidAngleAt(p)).toBeLessThanOrEqual(LID_OPEN_ANGLE)
    }
  })

  it('stays shut while the camera is still in front, so the lid cannot open at the wrong angle', () => {
    for (const p of samples) {
      if (beat(p, ACT1_BEATS.orbit) < 0.5) expect(lidAngleAt(p), `p=${p}`).toBe(0)
    }
  })

  it('treats NaN as shut', () => {
    expect(lidAngleAt(Number.NaN)).toBe(0)
  })
})

describe('LID_OPEN_ANGLE', () => {
  it('is a believable laptop angle: past upright, tilted back, short of flat', () => {
    expect(LID_OPEN_ANGLE).toBeGreaterThan(Math.PI / 2)
    expect(LID_OPEN_ANGLE).toBeLessThan((130 * Math.PI) / 180)
  })
})
