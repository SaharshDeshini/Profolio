import { describe, expect, it } from 'vitest'
import {
  COMPACT_MAX_WIDTH,
  COMPACT_QUERY,
  MOBILE_MAX_WIDTH,
  MOBILE_QUERY,
  REDUCED_MOTION_QUERY,
  SPLIT_MIN_WIDTH,
  SPLIT_RATIO,
} from './layout.ts'
import { ACT1_BEATS } from './scroll/beats.ts'
import {
  ACT1_LAYOUT,
  ACT1_RUNWAY_SVH,
  ACT1_SCROLL_DISTANCE_SVH,
  DOCK_OVERLAP_SVH,
  SECTION_IDS,
  actOneLayoutFor,
  scrollDistanceSvh,
} from './scroll/sections.ts'
import globalCss from './styles/global.css?raw'

describe('layout', () => {
  it('keeps the split where both the docked rig and the content column stay usable', () => {
    expect(SPLIT_RATIO).toBeGreaterThan(0.3)
    expect(SPLIT_RATIO).toBeLessThan(0.6)
  })

  it('leaves a tablet band between the mobile breakpoint and the split collapsing', () => {
    expect(SPLIT_MIN_WIDTH).toBeGreaterThan(MOBILE_MAX_WIDTH)
  })

  it('builds the media queries from the breakpoint constants', () => {
    expect(MOBILE_QUERY).toBe(`(max-width: ${MOBILE_MAX_WIDTH}px)`)
    expect(REDUCED_MOTION_QUERY).toBe('(prefers-reduced-motion: reduce)')
  })

  it('has CSS that collapses the split at the same width the constant says', () => {
    expect(globalCss).toContain(`@media (max-width: ${SPLIT_MIN_WIDTH - 1}px)`)
  })
})

describe('compact layout', () => {
  it('is everything below the width where the side band collapses', () => {
    expect(COMPACT_MAX_WIDTH).toBe(SPLIT_MIN_WIDTH - 1)
    expect(COMPACT_QUERY).toBe(`(max-width: ${COMPACT_MAX_WIDTH}px)`)
  })

  it('picks the compact runway below the split width and the wide one above it', () => {
    expect(actOneLayoutFor(true)).toBe(ACT1_LAYOUT.compact)
    expect(actOneLayoutFor(false)).toBe(ACT1_LAYOUT.wide)
  })

  it('shortens the runway to about three screens, so a small screen is not asked to scroll five', () => {
    expect(ACT1_LAYOUT.compact.runwaySvh).toBe(300)
    expect(ACT1_LAYOUT.compact.runwaySvh).toBeLessThan(ACT1_LAYOUT.wide.runwaySvh)
  })

  it('still leaves two screens of scroll for the story to play in', () => {
    expect(scrollDistanceSvh(ACT1_LAYOUT.compact)).toBeGreaterThanOrEqual(200)
  })

  it('brings the Intro in only after the motto has landed, since there is no side band to hold it', () => {
    const { runwaySvh, overlapSvh } = ACT1_LAYOUT.compact
    const introEntersAt = (runwaySvh - overlapSvh - 100) / scrollDistanceSvh(ACT1_LAYOUT.compact)
    expect(introEntersAt).toBeGreaterThanOrEqual(ACT1_BEATS.motto[1])
    expect(introEntersAt).toBeLessThan(1)
  })

  it('dims the scene behind the text in CSS, so the text stays legible over the shot', () => {
    expect(globalCss).toMatch(
      /@media \(max-width: 1023px\) \{\s*\.content-column \{[^}]*background:\s*linear-gradient/,
    )
  })
})

describe('runway', () => {
  it('overlaps the content column by less than the whole runway', () => {
    expect(DOCK_OVERLAP_SVH).toBeGreaterThan(0)
    expect(DOCK_OVERLAP_SVH).toBeLessThan(ACT1_RUNWAY_SVH)
  })

  it('scrolls the runway minus the one viewport it ends in', () => {
    expect(ACT1_SCROLL_DISTANCE_SVH).toBe(ACT1_RUNWAY_SVH - 100)
  })

  it('leaves enough scroll distance for the cinematic to play at a readable pace', () => {
    expect(ACT1_SCROLL_DISTANCE_SVH).toBeGreaterThanOrEqual(300)
  })
})

describe('sections', () => {
  it('lists the five sections in the order the brief defines', () => {
    expect(SECTION_IDS).toEqual(['intro', 'skills', 'projects', 'achievements', 'education', 'connect'])
  })
})
