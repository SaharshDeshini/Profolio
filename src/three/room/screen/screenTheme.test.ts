import { describe, expect, it } from 'vitest'
import { LAPTOP } from '../dimensions.ts'
import { SCREEN_FONT_URL, SCREEN_SAFE_HALF_WIDTH, SCREEN_TEXTURE, SCREEN_THEME, fitFontSize } from './screenTheme.ts'

describe('screen font', () => {
  it('is a .woff file, because the in-scene text renderer cannot read .woff2', () => {
    expect(SCREEN_FONT_URL).toMatch(/\.woff(\?.*)?$/)
    expect(SCREEN_FONT_URL).not.toMatch(/\.woff2/)
  })
})

describe('screen texture', () => {
  it('has the same aspect ratio as the screen surface, so text is never stretched', () => {
    const textureAspect = SCREEN_TEXTURE.width / SCREEN_TEXTURE.height
    const surfaceAspect = LAPTOP.screenWidth / LAPTOP.screenHeight
    expect(textureAspect).toBeCloseTo(surfaceAspect, 2)
  })

  it('is large enough to stay crisp when the docked screen is downscaled', () => {
    expect(SCREEN_TEXTURE.width).toBeGreaterThanOrEqual(1024)
  })
})

describe('screen theme', () => {
  it('uses the three brand colours: near-black, white and electric cyan', () => {
    expect(SCREEN_THEME.text).toBe('#f6f6f4')
    expect(SCREEN_THEME.accent).toBe('#00e5ff')
    expect(SCREEN_THEME.background).toMatch(/^#0[0-9a-f]{5}$/i)
  })
})

describe('fitFontSize', () => {
  const width = SCREEN_SAFE_HALF_WIDTH * 2

  it('keeps a short line at the largest size', () => {
    expect(fitFontSize('Hi', width, 0.74)).toBe(0.74)
  })

  it('shrinks a long line so it no longer overflows the lid', () => {
    const size = fitFontSize('Problems come first.', width, 0.74)
    expect(size).toBeLessThan(0.74)
    expect(size * 'Problems come first.'.length * 0.6).toBeLessThanOrEqual(width + 1e-9)
  })

  it('treats capitals as wider than mixed case', () => {
    expect(fitFontSize('ABCDEFGHIJKLMNOPQRST', width, 1)).toBeLessThan(fitFontSize('abcdefghijklmnopqrst', width, 1))
  })

  it('returns the largest size for an empty line', () => {
    expect(fitFontSize('   ', width, 0.5)).toBe(0.5)
  })
})
