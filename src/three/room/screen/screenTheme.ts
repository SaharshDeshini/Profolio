import fontUrl from '@fontsource/geist-sans/files/geist-sans-latin-600-normal.woff?url'
import { LAPTOP } from '../dimensions.ts'

/** troika-three-text reads .woff and .ttf but not .woff2, hence the explicit .woff file.
 * 600 (semibold) rather than 500: at screen scale the thinner weight's strokes were only
 * a pixel or two of the render texture, so they read as grey and soft-edged; the heavier
 * weight holds up under the RenderTexture's own resolution and the scene's bloom. */
export const SCREEN_FONT_URL: string = fontUrl

/**
 * The texture's resolution is independent of how small the screen ends up on
 * the page, so text stays crisp once the rig has docked and shrunk.
 */
export const SCREEN_TEXTURE = {
  width: 1024,
  height: Math.round((1024 * LAPTOP.screenHeight) / LAPTOP.screenWidth),
} as const

export const SCREEN_THEME = {
  background: '#03080a',
  text: '#f6f6f4',
  accent: '#00e5ff',
} as const

/**
 * A thin, near-background-coloured stroke behind every screen glyph. The screen's own glow
 * bleeds into bright edges under bloom, which softened text into a grey smear; cutting a dark
 * edge back in sharpens the letterforms again without darkening the fill itself.
 */
export const SCREEN_TEXT_OUTLINE = {
  width: '4%',
  color: SCREEN_THEME.background,
  opacity: 0.75,
} as const

/** Half the lid's usable width in the screen scene's units (its visible width is about +-3.6), leaving a margin. */
export const SCREEN_SAFE_HALF_WIDTH = 3.0

/**
 * Average advance of one glyph as a share of the font size, for Geist Semibold.
 * Capitals run wider than mixed case, so an all-caps line gets the wider figure.
 * Estimates, erring wide: a line fitted with these can come out a little small, never clipped.
 */
const MIXED_CASE_ADVANCE = 0.6
const CAPS_ADVANCE = 0.7

/**
 * The largest font size, up to `maxSize`, at which `text` fits on one line
 * inside `maxWidth`. troika only knows a line's true width after it has laid
 * it out, so this estimates from the character count instead, which is enough
 * to stop a motto running off the edge of the lid.
 */
export function fitFontSize(text: string, maxWidth: number, maxSize: number): number {
  const length = text.trim().length
  if (length === 0) return maxSize
  const advance = text === text.toUpperCase() ? CAPS_ADVANCE : MIXED_CASE_ADVANCE
  return Math.min(maxSize, maxWidth / (length * advance))
}
