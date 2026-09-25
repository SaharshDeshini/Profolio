import { projects, type Project } from './projects.ts'

/** The route pattern the overlay is mounted on. Keep in step with `projectPath`. */
export const PROJECT_ROUTE = '/project/:slug'

export const projectPath = (slug: string): string => `/project/${slug}`

export function findProject(slug: string | undefined): Project | undefined {
  return projects.find((project) => project.slug === slug)
}

export interface AdjacentProjects {
  readonly previous: Project | undefined
  readonly next: Project | undefined
}

/** The neighbours in list order. Not circular: the first has no previous, the last no next. */
export function adjacentProjects(slug: string | undefined): AdjacentProjects {
  const index = projects.findIndex((project) => project.slug === slug)
  if (index === -1) return { previous: undefined, next: undefined }
  return { previous: projects[index - 1], next: projects[index + 1] }
}
