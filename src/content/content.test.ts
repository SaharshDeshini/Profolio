import { describe, expect, it } from 'vitest'
import { achievements } from './achievements.ts'
import { education } from './education.ts'
import { profile } from './profile.ts'
import { projects } from './projects.ts'
import { skillGroups } from './skills.ts'

const URL_SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// These guard the shape of the content, so editing the placeholders cannot
// quietly break a route, a link, or the brand.
describe('profile', () => {
  it('lists the three pillars in order', () => {
    expect(profile.pillars).toEqual(['AI', 'Software', 'Building'])
  })

  it('has a role and an about paragraph to show', () => {
    for (const text of [profile.role, profile.identity, profile.about]) {
      expect(text.trim().length).toBeGreaterThan(0)
    }
  })

  it('has a location and availability for the facts row', () => {
    expect(profile.location.trim().length).toBeGreaterThan(0)
    expect(profile.availability.trim().length).toBeGreaterThan(0)
  })

  it('has either no resume or a path under the site root', () => {
    if (profile.resume !== null) expect(profile.resume).toMatch(/^\/[^\s]+\.pdf$/i)
  })

  it('has a well-formed email address', () => {
    expect(profile.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  })
})

describe('projects', () => {
  it('has at least one project', () => {
    expect(projects.length).toBeGreaterThan(0)
  })

  it('uses unique, URL-safe slugs', () => {
    const slugs = projects.map((project) => project.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(URL_SAFE_SLUG)
  })

  it('leads every case study with the problem: the motto, applied', () => {
    for (const project of projects) {
      expect(project.caseStudy[0]?.heading, project.slug).toBe('Problem')
    }
  })

  it('gives every project a stack, a tint and at least one link', () => {
    for (const project of projects) {
      expect(project.stack.length, project.slug).toBeGreaterThan(0)
      expect(project.links.length, project.slug).toBeGreaterThan(0)
      expect(project.mood, project.slug).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe('links', () => {
  it('has profile links to check at all', () => {
    expect(profile.links.length).toBeGreaterThan(0)
  })

  it('uses absolute https URLs only', () => {
    const hrefs = [...profile.links, ...projects.flatMap((project) => project.links)].map(
      (link) => link.href,
    )
    for (const href of hrefs) expect(new URL(href).protocol, href).toBe('https:')
  })
})

describe('skills', () => {
  it('has the four groups from the brief, none of them empty', () => {
    expect(skillGroups.map((group) => group.id)).toEqual(['ai', 'software', 'systems', 'tools'])
    for (const group of skillGroups) expect(group.items.length, group.id).toBeGreaterThan(0)
  })
})

describe('education', () => {
  it('has entries with unique timeline codes', () => {
    const codes = education.map((entry) => entry.code)
    expect(codes.length).toBeGreaterThan(0)
    expect(new Set(codes).size).toBe(codes.length)
  })
})

describe('achievements', () => {
  it('has entries with unique ids, four-digit years, most recent first', () => {
    const ids = achievements.map((entry) => entry.id)
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
    for (const entry of achievements) {
      expect(entry.id).toMatch(URL_SAFE_SLUG)
      expect(entry.year).toMatch(/^\d{4}$/)
      expect(entry.title.trim().length).toBeGreaterThan(0)
    }
    const years = achievements.map((entry) => Number(entry.year))
    expect(years).toEqual([...years].sort((a, b) => b - a))
  })
})
