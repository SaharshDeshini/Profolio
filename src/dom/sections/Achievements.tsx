import { achievements } from '../../content/achievements.ts'
import { chapterIndex } from '../../scroll/chapters.ts'
import { SectionHeader } from './SectionHeader.tsx'

/**
 * A record, not a list of cards: each entry is led by its year as a large
 * outlined numeral, with the title beside it and the issuer as a mono stamp.
 * No borders and no boxes; the numerals carry the rhythm. Most recent first.
 */
export function Achievements() {
  return (
    <section id="achievements" className="section" aria-labelledby="achievements-title">
      <SectionHeader
        index={chapterIndex('achievements')}
        label="Achievements"
        titleId="achievements-title"
        title="On the record"
      />
      <ol className="record">
        {achievements.map((entry) => (
          <li key={entry.id} className="record__entry">
            <p className="record__year" aria-hidden="true">
              {entry.year}
            </p>
            <div className="record__body">
              <p className="label record__stamp">
                <span className="sr-only">{entry.year}, </span>
                {entry.issuer}
              </p>
              <h3 className="record__title">{entry.title}</h3>
              <p className="record__note">{entry.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
