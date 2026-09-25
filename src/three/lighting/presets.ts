import { ACT1_BEATS, beat, smoothstep } from '../../scroll/beats.ts'
import type { SectionId } from '../../scroll/sections.ts'

export interface LightMood {
  /** Fill from everywhere. Kept near zero so the laptop screen stays the room's light source. */
  readonly ambient: number
  /** Cool edge light from behind that keeps silhouettes readable in the dark. */
  readonly rim: number
  /** Soft pool of light over the desk. */
  readonly key: number
  /** 0..1 strength of the light and glow coming from the laptop screen. */
  readonly screen: number
}

/**
 * Two authored presets, cross-faded by the dock. Scaling the rig does not scale
 * a light's intensity or distance (only its position), so one preset cannot
 * survive the shrink. Two presets can, and Act 2 wants tighter, moodier light anyway.
 */
export const ACT1_MOOD: LightMood = { ambient: 0.09, rim: 2.2, key: 34, screen: 0 }
export const ACT2_MOOD: LightMood = { ambient: 0.07, rim: 0.8, key: 10, screen: 1 }

/** The screen comes up as the lid opens and is fully lit by the time the motto has appeared. */
const SCREEN_GLOW = [ACT1_BEATS.lid[0], ACT1_BEATS.motto[1]] as const

const lerp = (from: number, to: number, t: number): number => from * (1 - t) + to * t

export function mixMood(from: LightMood, to: LightMood, t: number): LightMood {
  return {
    ambient: lerp(from.ambient, to.ambient, t),
    rim: lerp(from.rim, to.rim, t),
    key: lerp(from.key, to.key, t),
    screen: lerp(from.screen, to.screen, t),
  }
}

/** Every light in the scene reads this. None hardcodes an intensity. */
export function moodAt(progress: number): LightMood {
  const glow = smoothstep(beat(progress, SCREEN_GLOW))
  const dock = smoothstep(beat(progress, ACT1_BEATS.dock))
  return mixMood({ ...ACT1_MOOD, screen: glow }, ACT2_MOOD, dock)
}

/**
 * Small per-section departures from `ACT2_MOOD`, layered on top of it once
 * the dock has fully landed (see `SceneLights`) the same way `keyRevealAt`
 * already layers a wall-clock ramp on top of `moodAt`'s pure output. Only the
 * fields listed are overridden; everything else keeps `ACT2_MOOD`'s value.
 * `intro` is empty on purpose: it is the pose Act 1 already docks to, so the
 * handoff into Act 2 stays silent.
 */
export const ACT2_SECTION_MOOD: Readonly<Record<SectionId, Partial<LightMood>>> = {
  intro: {},
  skills: { ambient: 0.05, rim: 0.6 },
  projects: { rim: 1.1 },
  achievements: { key: 11, rim: 0.9 },
  education: { key: 13 },
  connect: { ambient: 0.04, key: 6 },
}

/** `ACT2_MOOD` with a section's overlay applied on top; fields the overlay omits keep the base value. */
export function sectionMood(id: SectionId): LightMood {
  return { ...ACT2_MOOD, ...ACT2_SECTION_MOOD[id] }
}
