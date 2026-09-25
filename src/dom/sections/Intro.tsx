import { profile } from '../../content/profile.ts'
import { chapterIndex } from '../../scroll/chapters.ts'

/**
 * The first thing the docked layout shows: what this person does, in one
 * screen. The name itself is only ever shown once, on Act 1's first frame
 * (Hero), so the heading here is the identity line rather than a repeat of it.
 */
export function Intro() {
  return (
    <section id="intro" className="section section--intro" aria-labelledby="intro-title">
      <div className="intro__main">
        <p className="label" aria-hidden="true">
          <span className="chapter__index">{chapterIndex('intro')}</span> / About
        </p>
        <h1 id="intro-title" className="display intro__title">
          {profile.identity}
        </h1>
        <p className="body-copy">{profile.about}</p>
        <p className="label intro__meta">
          {profile.location} <span aria-hidden="true">·</span> {profile.availability}
        </p>
      </div>
    </section>
  )
}
