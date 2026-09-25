import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { profile } from '../../../content/profile.ts'
import { progress } from '../../../scroll/progress.ts'
import { mottoOpacities, splitMotto } from './motto.ts'
import { projectCover } from './screenCover.ts'
import { SCREEN_FONT_URL, SCREEN_SAFE_HALF_WIDTH, SCREEN_TEXT_OUTLINE, SCREEN_THEME, fitFontSize } from './screenTheme.ts'

const LINES = splitMotto(profile.motto)
const MAX_FONT_SIZE = 0.74
const SAFE_WIDTH = SCREEN_SAFE_HALF_WIDTH * 2
/**
 * One size for every line, the one that fits the longest, so the motto reads
 * as one statement rather than lines of different sizes. Fitted, not fixed: at
 * the old flat 0.74, "Problems come first." ran off the edge of the lid.
 */
const FONT_SIZE = Math.min(MAX_FONT_SIZE, ...LINES.map((line) => fitFontSize(line, SAFE_WIDTH, MAX_FONT_SIZE)))
const LINE_HEIGHT = FONT_SIZE * 1.45

interface FadeableText {
  fillOpacity: number
}

/**
 * The motto, one line per sentence. The last line is the punchline, so it takes
 * the accent colour. It steps back whenever a project slide covers the screen.
 */
export function MottoScreen() {
  const lines = useRef<(FadeableText | null)[]>([])

  useFrame(() => {
    const visible = 1 - projectCover()
    mottoOpacities(progress.smooth, LINES.length).forEach((opacity, index) => {
      const line = lines.current[index]
      if (line) line.fillOpacity = opacity * visible
    })
  })

  const top = ((LINES.length - 1) * LINE_HEIGHT) / 2

  return (
    <>
      {LINES.map((line, index) => (
        <Text
          key={line}
          ref={(node: FadeableText | null) => {
            lines.current[index] = node
          }}
          font={SCREEN_FONT_URL}
          fontSize={FONT_SIZE}
          maxWidth={SAFE_WIDTH}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          position={[0, top - index * LINE_HEIGHT, 0]}
          color={index === LINES.length - 1 ? SCREEN_THEME.accent : SCREEN_THEME.text}
          outlineWidth={SCREEN_TEXT_OUTLINE.width}
          outlineColor={SCREEN_TEXT_OUTLINE.color}
          outlineOpacity={SCREEN_TEXT_OUTLINE.opacity}
          fillOpacity={0}
        >
          {line}
        </Text>
      ))}
    </>
  )
}
