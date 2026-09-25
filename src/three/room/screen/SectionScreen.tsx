import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { achievements } from '../../../content/achievements.ts'
import { education } from '../../../content/education.ts'
import { profile } from '../../../content/profile.ts'
import { projects } from '../../../content/projects.ts'
import { skillGroups } from '../../../content/skills.ts'
import type { SectionId } from '../../../scroll/sections.ts'
import { getActiveProject } from '../../../state/activeProject.ts'
import { getActiveSection } from '../../../state/activeSection.ts'
import { reportSlideMix } from './screenCover.ts'
import { SCREEN_FONT_URL, SCREEN_SAFE_HALF_WIDTH, SCREEN_THEME, fitFontSize } from './screenTheme.ts'
import { dampToward } from './slides.ts'

/** Left edge of the text block, in the screen scene's units: the lid's safe margin. */
const LEFT = -SCREEN_SAFE_HALF_WIDTH

interface FadeableText {
  fillOpacity: number
}

interface SlideLine {
  readonly key: string
  readonly text: string
  /** How opaque this line is at full fade. The eyebrow leads; the body recedes slightly. */
  readonly weight: number
  readonly anchorY: 'top' | 'middle' | 'bottom'
  readonly y: number
  readonly fontSize: number
  readonly color: string
  readonly letterSpacing?: number
}

type Act2SectionId = Exclude<SectionId, 'intro'>

const ACT2_SECTION_IDS: readonly Act2SectionId[] = ['skills', 'projects', 'achievements', 'education', 'connect']

/** What each section's screen says: one large word or number, and one short line under it. */
interface Readout {
  readonly headline: string
  readonly detail: string
}

function readoutFor(id: Act2SectionId): Readout {
  switch (id) {
    case 'skills':
      return { headline: 'SKILLS', detail: `${skillGroups.length} AREAS` }
    case 'projects':
      return { headline: `${projects.length} FILE${projects.length === 1 ? '' : 'S'}`, detail: 'SELECTED WORK' }
    case 'achievements':
      return { headline: 'RECORD', detail: achievements[0]?.title ?? '' }
    case 'education':
      return { headline: 'EDUCATION', detail: education[0]?.institution ?? '' }
    case 'connect':
      return { headline: 'SAY HELLO', detail: profile.email }
  }
}

const SAFE_WIDTH = SCREEN_SAFE_HALF_WIDTH * 2
const HEADLINE_MAX_SIZE = 1.0
const DETAIL_MAX_SIZE = 0.38

/**
 * One readout per Act 2 section, designed for the size the screen actually is
 * once docked: the rig sits at 0.4 scale, so anything under ~0.3 units turns
 * to mush. A large word the eye can read at a glance, one short accent line
 * under it, both fitted to the lid's width, never a list.
 */
function linesFor(id: Act2SectionId): readonly SlideLine[] {
  const { headline, detail } = readoutFor(id)
  const lines: SlideLine[] = [
    {
      key: 'headline',
      text: headline,
      weight: 1,
      anchorY: 'bottom',
      y: 0.15,
      fontSize: fitFontSize(headline, SAFE_WIDTH, HEADLINE_MAX_SIZE),
      letterSpacing: 0.02,
      color: SCREEN_THEME.text,
    },
  ]
  if (detail) {
    lines.push({
      key: 'detail',
      text: detail,
      weight: 0.95,
      anchorY: 'top',
      y: -0.25,
      fontSize: fitFontSize(detail, SAFE_WIDTH, DETAIL_MAX_SIZE),
      letterSpacing: 0.04,
      color: SCREEN_THEME.accent,
    })
  }
  return lines
}

interface SectionSlideProps {
  readonly id: Act2SectionId
}

/**
 * One Act 2 section's readout on the laptop screen, faded with
 * `getActiveSection` the same way `ProjectScreen`'s slides fade with
 * `getActiveProject`, and reporting into the same `screenCover` registry so
 * the motto and any active project slide cede the screen correctly.
 */
function SectionSlide({ id }: SectionSlideProps) {
  const mix = useRef(0)
  const texts = useRef<(FadeableText | null)[]>([])
  const lines = linesFor(id)

  useFrame((_state, delta) => {
    // Projects has its own individual slides (ProjectScreens); this is only
    // its resting state, shown until a specific project takes over.
    const active = getActiveSection() === id && (id !== 'projects' || getActiveProject() === null)
    mix.current = dampToward(mix.current, active ? 1 : 0, delta)
    reportSlideMix(`section:${id}`, mix.current)
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
          maxWidth={SAFE_WIDTH}
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

/**
 * The laptop screen's Act 2 voice. About keeps the existing motto (still
 * rendered by `MottoScreen`, unchanged, so the Act 1 handoff stays exact);
 * every other section gets a short system-style readout that fades in while
 * it is being read, so the screen — the one object the scene's depth of field
 * is locked onto — stays a live instrument for the whole scroll, not just Act 1.
 */
export function SectionScreen() {
  return (
    <>
      {ACT2_SECTION_IDS.map((id) => (
        <SectionSlide key={id} id={id} />
      ))}
    </>
  )
}
