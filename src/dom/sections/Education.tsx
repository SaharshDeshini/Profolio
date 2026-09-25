import { education } from '../../content/education.ts'
import { chapterIndex } from '../../scroll/chapters.ts'
import { SectionHeader } from './SectionHeader.tsx'

/** A timeline spine: a full-height rule down the left edge, each entry offset from it by a tick. Most recent first. */
export function Education() {
  return (
    <section id="education" className="section" aria-labelledby="education-title">
      <SectionHeader index={chapterIndex('education')} label="Education" titleId="education-title" title="Where I learned" />
      <ol className="edu-timeline">
        {education.map((entry) => (
          <li key={entry.code} className="edu-entry">
            <span className="edu-entry__tick" aria-hidden="true" />
            <p className="label">{entry.period}</p>
            <div className="edu-row__body">
              <h3 className="edu-row__institution">{entry.institution}</h3>
              <p className="edu-row__credential">{entry.credential}</p>
              <p className="edu-row__note">{entry.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
