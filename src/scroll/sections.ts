export const SECTION_IDS = ['intro', 'skills', 'projects', 'achievements', 'education', 'connect'] as const

export type SectionId = (typeof SECTION_IDS)[number]

export interface ActOneLayout {
  /** Total height of the Act 1 runway in svh. */
  readonly runwaySvh: number
  /** How far the content column overlaps the runway's end, so the Intro rises in over the last of the story. */
  readonly overlapSvh: number
}

/**
 * Act 1's scroll runway, per layout.
 *
 * `wide` has a side band, so the Intro can rise in beside the docking rig while
 * the dock is still playing. `compact` (below the split width) has no band and
 * a shorter runway, so a small screen is not asked to scroll five screens of
 * story; its overlap is small so the Intro arrives only after the motto has landed.
 */
export const ACT1_LAYOUT = {
  wide: { runwaySvh: 500, overlapSvh: 100 },
  compact: { runwaySvh: 300, overlapSvh: 30 },
} as const satisfies Record<string, ActOneLayout>

export const actOneLayoutFor = (compact: boolean): ActOneLayout =>
  compact ? ACT1_LAYOUT.compact : ACT1_LAYOUT.wide

const VIEWPORT_SVH = 100

/** How far the page actually scrolls while Act 1 plays: the runway minus the one viewport it ends in. */
export const scrollDistanceSvh = ({ runwaySvh }: ActOneLayout): number => runwaySvh - VIEWPORT_SVH

/** Total height of the wide Act 1 runway in svh. */
export const ACT1_RUNWAY_SVH = ACT1_LAYOUT.wide.runwaySvh

/** How far the wide layout's content column overlaps the runway's end. */
export const DOCK_OVERLAP_SVH = ACT1_LAYOUT.wide.overlapSvh

export const ACT1_SCROLL_DISTANCE_SVH = scrollDistanceSvh(ACT1_LAYOUT.wide)
