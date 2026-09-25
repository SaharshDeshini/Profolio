import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { projects, type Project } from '../../../content/projects.ts'
import { getActiveProject } from '../../../state/activeProject.ts'
import { reportSlideMix } from './screenCover.ts'
import { SCREEN_FONT_URL, SCREEN_THEME } from './screenTheme.ts'
import { dampToward } from './slides.ts'

/** Left edge of the text block, in the screen scene's units (its visible width is about +-3.6). */
const LEFT = -3.0
const TEXT_WIDTH = 6

interface FadeableText {
  fillOpacity: number
}

interface SlideLine {
  readonly key: string
  readonly text: string
  /** How opaque this line is at full fade. The title leads; the rest recede. */
  readonly weight: number
  readonly anchorY: 'top' | 'middle' | 'bottom'
  readonly y: number
  readonly fontSize: number
  readonly color: string
  readonly maxWidth?: number
  readonly lineHeight?: number
  readonly letterSpacing?: number
}

function slideLines(project: Project, index: number): readonly SlideLine[] {
  return [
    {
      key: 'eyebrow',
      text: `PROJECT ${String(index + 1).padStart(2, '0')}`,
      weight: 1,
      anchorY: 'middle',
      y: 1.35,
      fontSize: 0.2,
      letterSpacing: 0.12,
      color: SCREEN_THEME.accent,
    },
    {
      key: 'title',
      text: project.title,
      weight: 1,
      anchorY: 'bottom',
      y: 0.15,
      fontSize: 0.62,
      maxWidth: TEXT_WIDTH,
      color: SCREEN_THEME.text,
    },
    {
      key: 'tagline',
      text: project.tagline,
      weight: 0.72,
      anchorY: 'top',
      y: -0.1,
      fontSize: 0.24,
      maxWidth: TEXT_WIDTH - 0.4,
      lineHeight: 1.35,
      color: SCREEN_THEME.text,
    },
    {
      key: 'stack',
      text: project.stack.join('   ·   '),
      weight: 0.9,
      anchorY: 'middle',
      y: -1.55,
      fontSize: 0.19,
      maxWidth: TEXT_WIDTH,
      color: SCREEN_THEME.accent,
    },
  ]
}

interface ProjectSlideProps {
  readonly project: Project
  readonly index: number
}

/**
 * One project on the laptop screen. Every project has its own slide that fades
 * with the active project, rather than one slide whose text is swapped: changing
 * a text's content makes it re-typeset, which would pop mid-fade.
 */
function ProjectSlide({ project, index }: ProjectSlideProps) {
  const mix = useRef(0)
  const texts = useRef<(FadeableText | null)[]>([])
  const lines = slideLines(project, index)

  useFrame((_state, delta) => {
    mix.current = dampToward(mix.current, getActiveProject() === project.slug ? 1 : 0, delta)
    reportSlideMix(project.slug, mix.current)
    lines.forEach((line, i) => {
      const text = texts.current[i]
      if (text) text.fillOpacity = mix.current * line.weight
    })
  })

  return (
    <group>
      {lines.map((line, i) => (
        <Text
          key={line.key}
          ref={(node: FadeableText | null) => {
            texts.current[i] = node
          }}
          font={SCREEN_FONT_URL}
          anchorX="left"
          anchorY={line.anchorY}
          position={[LEFT, line.y, 0]}
          fontSize={line.fontSize}
          maxWidth={line.maxWidth}
          lineHeight={line.lineHeight}
          letterSpacing={line.letterSpacing}
          color={line.color}
          fillOpacity={0}
        >
          {line.text}
        </Text>
      ))}
    </group>
  )
}

/** All the project slides. Only the active project's is visible; none is when the reader is between cards. */
export function ProjectScreens() {
  return (
    <>
      {projects.map((project, index) => (
        <ProjectSlide key={project.slug} project={project} index={index} />
      ))}
    </>
  )
}
