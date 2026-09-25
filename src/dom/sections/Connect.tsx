import { useRef } from 'react'
import { profile } from '../../content/profile.ts'
import { chapterIndex } from '../../scroll/chapters.ts'
import { useMagnetic } from '../useMagnetic.ts'
import { CopyEmail } from './CopyEmail.tsx'
import { SectionHeader } from './SectionHeader.tsx'

const YEAR = new Date().getFullYear()

export function Connect() {
  const cta = useRef<HTMLAnchorElement>(null)
  useMagnetic(cta, 0.12)

  return (
    <section id="connect" className="section section--connect" aria-labelledby="connect-title">
      <SectionHeader index={chapterIndex('connect')} label="Connect" titleId="connect-title" title={profile.closing} />
      <div className="contact-row">
        <a ref={cta} className="cta" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
        <CopyEmail email={profile.email} />
      </div>
      <ul className="link-row" aria-label="Elsewhere">
        {profile.resume ? (
          <li>
            <a className="text-link" href={profile.resume} download>
              Resume
              <span className="sr-only"> (PDF download)</span>
              <span aria-hidden="true"> ↓</span>
            </a>
          </li>
        ) : null}
        {profile.links.map((link) => (
          <li key={link.href}>
            <a className="text-link" href={link.href} rel="noopener noreferrer" target="_blank">
              {link.label}
              <span className="sr-only"> (opens in a new tab)</span>
              <span aria-hidden="true"> ↗</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="label footnote">
        © {YEAR} {profile.name}
      </p>
    </section>
  )
}
