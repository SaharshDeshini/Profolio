import { useRef, useState } from 'react'
import { skillGroups } from '../../content/skills.ts'
import { chapterIndex } from '../../scroll/chapters.ts'
import { useCentreBand } from '../useCentreBand.ts'
import { SectionHeader } from './SectionHeader.tsx'

/**
 * A scroll-lit list: large group titles, dim until one crosses the middle of
 * the screen, when it lights up and its skills fade in beneath it. The same
 * centre-band rule as the Projects rows, so the whole site agrees on what
 * "active" means. The skills are always in the DOM; only their brightness changes.
 */
export function Skills() {
  const list = useRef<HTMLOListElement>(null)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  useCentreBand(list, 'skillGroup', setActiveGroup)

  return (
    <section id="skills" className="section section--skills" aria-labelledby="skills-title">
      <SectionHeader index={chapterIndex('skills')} label="Skills" titleId="skills-title" title="What I work with" />
      <ol ref={list} className="skill-list">
        {skillGroups.map((group, index) => (
          <li
            key={group.id}
            className="skill-line"
            data-skill-group={group.id}
            data-active={activeGroup === group.id ? 'true' : undefined}
          >
            <span className="label skill-line__index" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="skill-line__title">{group.title}</h3>
            <ul className="skill-line__items" aria-label={`${group.title} skills`}>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  )
}
