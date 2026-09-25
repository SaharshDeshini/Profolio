import { describe, expect, it } from 'vitest'
import { playsActOne, resolveStoryMode, type StoryEnvironment } from './storyMode.ts'

const environment = (overrides: Partial<StoryEnvironment>): StoryEnvironment => ({
  isMobile: false,
  prefersReducedMotion: false,
  hasWebGL: true,
  ...overrides,
})

describe('resolveStoryMode', () => {
  it('plays the full cinematic on a capable desktop', () => {
    expect(resolveStoryMode(environment({}))).toBe('cinematic')
  })

  it('skips the flight for people who asked for less motion', () => {
    expect(resolveStoryMode(environment({ prefersReducedMotion: true }))).toBe('reduced')
  })

  it('plays a shortened, light Act 1 on a phone', () => {
    expect(resolveStoryMode(environment({ isMobile: true }))).toBe('mobile')
  })

  it('lets reduced motion win over the phone layout: no flight for someone who asked for none', () => {
    expect(resolveStoryMode(environment({ isMobile: true, prefersReducedMotion: true }))).toBe(
      'reduced',
    )
  })

  it('falls back to content-only when there is no WebGL, whatever else is true', () => {
    for (const isMobile of [false, true]) {
      for (const prefersReducedMotion of [false, true]) {
        expect(resolveStoryMode({ isMobile, prefersReducedMotion, hasWebGL: false })).toBe('static')
      }
    }
  })
})

describe('playsActOne', () => {
  it('is true for the cinematic and mobile modes: both have a runway to scroll through', () => {
    expect(playsActOne('cinematic')).toBe(true)
    expect(playsActOne('mobile')).toBe(true)
  })

  it('is false for reduced motion and for a page with no scene, which go straight to the end', () => {
    expect(playsActOne('reduced')).toBe(false)
    expect(playsActOne('static')).toBe(false)
  })
})
