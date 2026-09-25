import { describe, expect, it } from 'vitest'
import { projects } from './projects.ts'
import { adjacentProjects, findProject, PROJECT_ROUTE, projectPath } from './projectLookup.ts'

const first = projects[0]
const last = projects[projects.length - 1]

describe('projectPath and PROJECT_ROUTE', () => {
  it('build the URL the route pattern matches', () => {
    expect(projectPath('project-one')).toBe('/project/project-one')
    expect(PROJECT_ROUTE.replace(':slug', 'project-one')).toBe(projectPath('project-one'))
  })
})

describe('findProject', () => {
  it('finds a project by slug', () => {
    expect(findProject(first?.slug)).toBe(first)
  })

  it('returns undefined for an unknown or missing slug', () => {
    expect(findProject('nope')).toBeUndefined()
    expect(findProject(undefined)).toBeUndefined()
  })
})

describe('adjacentProjects', () => {
  it('has no previous for the first project and no next for the last', () => {
    expect(adjacentProjects(first?.slug).previous).toBeUndefined()
    expect(adjacentProjects(last?.slug).next).toBeUndefined()
  })

  it('gives both neighbours in the middle', () => {
    const middle = projects[1]
    expect(projects.length).toBeGreaterThanOrEqual(3)
    expect(adjacentProjects(middle?.slug)).toEqual({ previous: first, next: projects[2] })
  })

  it('gives neither for an unknown slug', () => {
    expect(adjacentProjects('nope')).toEqual({ previous: undefined, next: undefined })
  })
})
