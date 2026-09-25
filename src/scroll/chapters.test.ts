import { describe, expect, it } from 'vitest'
import { CHAPTERS, CHAPTER_LABELS, chapterIndex, pickActiveChapter } from './chapters.ts'
import { SECTION_IDS } from './sections.ts'

describe('chapters', () => {
  it('numbers the sections 01 to 06 in page order', () => {
    expect(CHAPTERS.map((chapter) => chapter.index)).toEqual(['01', '02', '03', '04', '05', '06'])
    expect(CHAPTERS.map((chapter) => chapter.id)).toEqual([...SECTION_IDS])
  })

  it('labels every section', () => {
    for (const id of SECTION_IDS) expect(CHAPTER_LABELS[id].length).toBeGreaterThan(0)
  })

  it('looks a chapter number up by id', () => {
    expect(chapterIndex('intro')).toBe('01')
    expect(chapterIndex('achievements')).toBe('04')
    expect(chapterIndex('connect')).toBe('06')
  })

  it('returns an empty number for an id that is not a chapter', () => {
    expect(chapterIndex('nowhere' as never)).toBe('')
  })
})

describe('pickActiveChapter', () => {
  it('is null when nothing is in the band', () => {
    expect(pickActiveChapter(new Set())).toBeNull()
  })

  it('picks the single visible section', () => {
    expect(pickActiveChapter(new Set(['skills']))).toBe('skills')
  })

  it('prefers the later section when two overlap the band', () => {
    expect(pickActiveChapter(new Set(['skills', 'projects']))).toBe('projects')
  })

  it('ignores ids that are not sections', () => {
    expect(pickActiveChapter(new Set(['footer']))).toBeNull()
  })
})
