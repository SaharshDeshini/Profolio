import { useRef } from 'react'
import { CHAPTERS } from '../scroll/chapters.ts'
import { useActiveSection, useJumpToSection, useRevealAfterDock } from './useChapterIndex.ts'

/**
 * The chapter index: one tick per section down the right edge, the current one longer and
 * labelled. It is real navigation (anchor links), so it works without
 * JavaScript-driven scrolling and is reachable by keyboard.
 */
export function ChapterIndex() {
  const ref = useRef<HTMLElement>(null)
  const active = useActiveSection()
  const jump = useJumpToSection()
  useRevealAfterDock(ref)

  return (
    <nav ref={ref} className="chapter-index" aria-label="Chapters" data-visible="false">
      <ol>
        {CHAPTERS.map((chapter) => (
          <li key={chapter.id}>
            <a
              href={`#${chapter.id}`}
              className="chapter-index__link"
              aria-current={active === chapter.id ? 'location' : undefined}
              onClick={(event) => {
                event.preventDefault()
                jump(chapter.id)
              }}
            >
              <span className="label chapter-index__label">
                {chapter.index} {chapter.label}
              </span>
              <span className="chapter-index__tick" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
