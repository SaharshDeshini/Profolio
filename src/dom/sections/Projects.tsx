import { useRef } from 'react'
import { Link } from 'react-router'
import { projectPath } from '../../content/projectLookup.ts'
import { projects, type Project } from '../../content/projects.ts'
import { chapterIndex } from '../../scroll/chapters.ts'
import { useActiveProjectSlug } from '../useActiveProjectSlug.ts'
import { useTrackActiveProject } from '../useTrackActiveProject.ts'
import { SectionHeader } from './SectionHeader.tsx'

/** The row leads with what was wrong, straight from the case study's own first section, not a tech list. */
const problemOf = (project: Project): string =>
  project.caseStudy.find((part) => part.heading === 'Problem')?.body ?? project.tagline

/**
 * Large numbered rows, problem first: the title, then the problem it answered,
 * then a quiet line of year, role and stack. The technology supports the story
 * rather than being it. Each is a real link to /project/<slug>. The row at the
 * centre of the screen is the active one: its number and underline light up,
 * and it is the project shown on the 3D laptop screen, so the list, the
 * laptop, the room tint and the dock glow all change together.
 */
export function Projects() {
  const list = useRef<HTMLOListElement>(null)
  const activeSlug = useActiveProjectSlug()
  useTrackActiveProject(list)

  return (
    <section id="projects" className="section" aria-labelledby="projects-title">
      <SectionHeader index={chapterIndex('projects')} label="Projects" titleId="projects-title" title="Selected work" />
      <ol ref={list} className="project-list">
        {projects.map((project, index) => (
          <li key={project.slug}>
            <Link
              to={projectPath(project.slug)}
              className="project-row"
              data-project-slug={project.slug}
              data-active={activeSlug === project.slug ? 'true' : undefined}
            >
              <span className="label project-row__index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="project-row__body">
                <span className="project-row__title">{project.title}</span>
                <span className="project-row__problem">
                  <span className="label project-row__problem-label">Problem</span>
                  {problemOf(project)}
                </span>
                <span className="label project-row__meta">
                  {[project.year, project.role, ...project.stack].join('  ·  ')}
                </span>
              </span>
              <span className="project-row__arrow" aria-hidden="true">
                ↗
              </span>
              <span className="sr-only">Read the case study</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
