import type { SectionId } from '../scroll/sections.ts'

/**
 * The problem wall: the questions behind the work, pinned up in the room
 * behind the desk and linked by threads like a detective's board. Each belongs
 * to a section; as the visitor reads that section its questions light up, and
 * the ones already passed stay lit, so by the end the whole board is drawn.
 *
 * `at` is where the note sits on screen once the rig has docked, in screen
 * space (-1 left edge .. 1 right edge, -1 bottom .. 1 top). Keep x at or left
 * of -0.45: the content column starts just right of -0.1 and the label runs
 * rightward from its dot. Keep y at or above ~0.4: below that the docked
 * figure's head and shoulders would cover the note. `depth` is metres from the
 * camera, for scale only.
 *
 * TODO(content): placeholder questions. Swap in the ones you actually ask.
 * Keep each under ~24 characters.
 */
export interface ProblemNote {
  readonly id: string
  readonly text: string
  readonly section: SectionId
  readonly at: readonly [x: number, y: number]
  /**
   * Where the note sits at the finale (Connect), when the board opens out
   * around the centred figure: left and right columns, clear of him, with the
   * closing question above his head. Same screen units as `at`.
   */
  readonly finale: readonly [x: number, y: number]
  readonly depth: number
}

export const problemNotes: readonly ProblemNote[] = [
  { id: 'who', text: 'who is this for?', section: 'intro', at: [-0.97, 0.92], finale: [-0.9, 0.86], depth: 9 },
  { id: 'real', text: "what's the real problem?", section: 'intro', at: [-0.6, 0.9], finale: [0.36, 0.84], depth: 8 },
  { id: 'tool', text: 'which tool fits?', section: 'skills', at: [-0.88, 0.8], finale: [-0.78, 0.64], depth: 10 },
  { id: 'buy', text: 'build or buy?', section: 'skills', at: [-0.55, 0.76], finale: [0.46, 0.62], depth: 8.5 },
  { id: 'slow', text: 'why is it slow?', section: 'projects', at: [-0.97, 0.67], finale: [-0.92, 0.42], depth: 9 },
  { id: 'breaks', text: 'what breaks first?', section: 'projects', at: [-0.72, 0.6], finale: [0.38, 0.4], depth: 10.5 },
  { id: 'matter', text: 'did it matter?', section: 'achievements', at: [-0.5, 0.52], finale: [0.52, 0.2], depth: 9.5 },
  { id: 'unknown', text: "what don't I know yet?", section: 'education', at: [-0.96, 0.5], finale: [-0.95, 0.2], depth: 8 },
  { id: 'yours', text: "what's yours?", section: 'connect', at: [-0.8, 0.4], finale: [-0.13, 0.9], depth: 9 },
]

/** Threads between notes, by id: one question leading to the next. */
export const problemThreads: readonly (readonly [from: string, to: string])[] = [
  ['who', 'real'],
  ['who', 'tool'],
  ['real', 'buy'],
  ['tool', 'buy'],
  ['tool', 'slow'],
  ['buy', 'breaks'],
  ['slow', 'breaks'],
  ['breaks', 'matter'],
  ['slow', 'unknown'],
  ['unknown', 'yours'],
  ['matter', 'yours'],
]
