import { afterEach, describe, expect, it } from 'vitest'
import { projectCover, reportSlideMix, resetSlideMixes } from './screenCover.ts'

afterEach(resetSlideMixes)

describe('projectCover', () => {
  it('is 0 when no slide has reported', () => {
    expect(projectCover()).toBe(0)
  })

  it('is the most visible slide, so the motto stays hidden while any project shows', () => {
    reportSlideMix('a', 0.2)
    reportSlideMix('b', 0.9)
    expect(projectCover()).toBe(0.9)
  })

  it('follows a slide as it fades out', () => {
    reportSlideMix('a', 1)
    reportSlideMix('a', 0.25)
    expect(projectCover()).toBe(0.25)
  })

  it('clamps a nonsense report into 0..1', () => {
    reportSlideMix('a', 4)
    expect(projectCover()).toBe(1)
    reportSlideMix('a', -3)
    expect(projectCover()).toBe(0)
  })

  it('treats NaN as hidden rather than poisoning the total', () => {
    reportSlideMix('a', Number.NaN)
    expect(projectCover()).toBe(0)
  })
})
