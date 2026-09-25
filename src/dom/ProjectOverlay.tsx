import { useCallback, useEffect, useRef } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { adjacentProjects, findProject, projectPath } from '../content/projectLookup.ts'
import { profile } from '../content/profile.ts'
import { projects } from '../content/projects.ts'
import { setActiveProject } from '../state/activeProject.ts'
import { ProjectThumb } from './sections/ProjectThumb.tsx'

const twoDigits = (n: number): string => String(n).padStart(2, '0')

/**
 * The case study, as a route-backed dialog over the live scene. The 3D world
 * keeps running behind it: nothing here unmounts the canvas. The page behind is
 * made `inert` by the app while this is open, and Lenis is told to leave the
 * overlay's own scrolling alone with `data-lenis-prevent`.
 *
 * Laid out like a printed case study: a sticky column of facts on the left, the
 * story on the right, problem first (the motto, applied), and large previous
 * and next links to keep reading.
 */
export function ProjectOverlay() {
  const { slug } = useParams()
  const project = findProject(slug)
  const navigate = useNavigate()
  const location = useLocation()
  const panel = useRef<HTMLElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  // "default" is the key of the first entry in the session: no earlier page of ours to go back to.
  const hasPreviousPage = location.key !== 'default'
  const close = useCallback(() => {
    if (hasPreviousPage) navigate(-1)
    else navigate('/', { replace: true })
  }, [hasPreviousPage, navigate])

  const openSlug = project?.slug

  // Focus goes into the panel when a project opens, and home to that project's row when it closes. The row is
  // looked up rather than remembered: the page goes `inert` in the same commit that opens this, which drops focus.
  useEffect(() => {
    if (!openSlug) return
    panel.current?.focus({ preventScroll: true })
    return () => {
      document.querySelector<HTMLElement>(`[data-project-slug="${openSlug}"]`)?.focus({ preventScroll: true })
    }
  }, [openSlug])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [close])

  // The laptop screen shows whichever project is open, including on a cold load of this URL.
  useEffect(() => {
    if (openSlug) setActiveProject(openSlug)
  }, [openSlug])

  // Moving to a neighbouring project reuses this element, so start it back at the top.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [openSlug])

  useEffect(() => {
    if (!project) return
    const previous = document.title
    document.title = `${project.title} · ${profile.name}`
    return () => {
      document.title = previous
    }
  }, [project])

  if (!project) return <Navigate to="/" replace />

  const { previous, next } = adjacentProjects(project.slug)
  const position = projects.findIndex((entry) => entry.slug === project.slug) + 1

  return (
    <div ref={scroller} className="overlay" data-lenis-prevent>
      {/* Keyed by slug so moving between projects replays the entrance. */}
      {/* A section, not an article: HTML only allows role="dialog" on the former. */}
      <section
        key={project.slug}
        ref={panel}
        className="case"
        role="dialog"
        aria-modal="true"
        aria-labelledby="overlay-title"
        tabIndex={-1}
      >
        <div className="case__bar">
          <p className="label">
            Selected work / {twoDigits(position)} of {twoDigits(projects.length)}
          </p>
          <button type="button" className="case__close label" onClick={close}>
            Close<span className="sr-only"> project</span> <kbd className="kbd">Esc</kbd>
          </button>
        </div>

        <div className="case__grid">
          <aside className="case__meta" aria-label="Project facts">
            <dl>
              <div>
                <dt className="label">Year</dt>
                <dd>{project.year}</dd>
              </div>
              <div>
                <dt className="label">Role</dt>
                <dd>{project.role}</dd>
              </div>
              <div>
                <dt className="label">Stack</dt>
                <dd>
                  <ul className="case__stack">
                    {project.stack.map((tech) => (
                      <li key={tech}>{tech}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
            <ul className="link-row case__links" aria-label="Project links">
              {project.links.map((link) => (
                <li key={link.href}>
                  <a className="text-link" href={link.href} rel="noopener noreferrer" target="_blank">
                    {link.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                    <span aria-hidden="true"> ↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          <div className="case__main">
            <h2 id="overlay-title" className="case__title">
              {project.title}
            </h2>
            <p className="lede">{project.tagline}</p>
            <figure className="case__hero">
              <ProjectThumb project={project} />
            </figure>
            <p className="body-copy case__summary">{project.summary}</p>

            {project.caseStudy.map((part, index) => (
              <section key={part.heading} className="case-part">
                <p className="label" aria-hidden="true">
                  <span className="chapter__index">{twoDigits(index + 1)}</span> / {part.heading}
                </p>
                <span className="rule" aria-hidden="true" />
                <h3 className="case-part__heading">{part.heading}</h3>
                <p className="body-copy">{part.body}</p>
              </section>
            ))}
          </div>
        </div>

        <nav className="case__nav" aria-label="Other projects">
          {previous ? (
            <Link className="case__nav-link" to={projectPath(previous.slug)} replace>
              <span className="label">Previous</span>
              <span className="case__nav-title">
                <span aria-hidden="true">← </span>
                {previous.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link className="case__nav-link case__nav-link--next" to={projectPath(next.slug)} replace>
              <span className="label">Next</span>
              <span className="case__nav-title">
                {next.title}
                <span aria-hidden="true"> →</span>
              </span>
            </Link>
          ) : null}
        </nav>
      </section>
    </div>
  )
}
