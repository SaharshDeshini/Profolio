import { describe, expect, it } from 'vitest'
import { problemNotes, problemThreads } from '../../content/problemWall.ts'
import { dockedCamera } from '../dock.ts'
import { ROOM } from './dimensions.ts'
import { SECTION_IDS } from '../../scroll/sections.ts'
import {
  EMPHASIS,
  FINALE,
  NOTE_LEVEL,
  THREAD_STUB,
  WALL_POSE,
  furthestOf,
  labelSize,
  noteLevel,
  placeNote,
  threadReach,
  wallPoint,
} from './problemWallLayout.ts'

const camera = dockedCamera(16 / 10)

const toScreen = (point: readonly [number, number, number]) => {
  const offset = [0, 1, 2].map((i) => (point[i] ?? 0) - (camera.position[i] ?? 0))
  const dotWith = (axis: readonly number[]) => offset.reduce((sum, value, i) => sum + value * (axis[i] ?? 0), 0)
  const depth = dotWith(camera.forward)
  const halfHeight = Math.tan((camera.fov * Math.PI) / 360)
  return { x: dotWith(camera.right) / (depth * halfHeight * camera.aspect), y: dotWith(camera.up) / (depth * halfHeight) }
}

describe('wallPoint', () => {
  it('lands a note exactly where it is placed on screen', () => {
    for (const note of problemNotes) {
      const screen = toScreen(wallPoint(camera, note.at, note.depth))
      expect(screen.x).toBeCloseTo(note.at[0], 6)
      expect(screen.y).toBeCloseTo(note.at[1], 6)
    }
  })

  it('keeps every note inside the room', () => {
    for (const note of problemNotes) {
      const [x, y, z] = wallPoint(camera, note.at, note.depth)
      expect(Math.abs(x)).toBeLessThan(ROOM.width / 2)
      expect(Math.abs(z)).toBeLessThan(ROOM.depth / 2)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(ROOM.height)
    }
  })

  it('pulls a note that would be outside the room back toward the camera', () => {
    const far = wallPoint(camera, [-0.9, 0.9], 200)
    expect(Math.abs(far[0])).toBeLessThan(ROOM.width / 2)
    expect(Math.abs(far[2])).toBeLessThan(ROOM.depth / 2)
  })
})

describe('labelSize', () => {
  it('grows with depth so every label reads the same size on screen', () => {
    expect(labelSize(camera, 10)).toBeCloseTo(labelSize(camera, 5) * 2, 10)
  })
})

describe('noteLevel', () => {
  it('lights the section being read brightest', () => {
    expect(noteLevel('skills', 'skills', 'skills')).toBe(NOTE_LEVEL.active)
  })

  it('keeps sections already read lit, and later ones as ghosts', () => {
    expect(noteLevel('intro', 'projects', 'projects')).toBe(NOTE_LEVEL.visited)
    expect(noteLevel('connect', 'projects', 'projects')).toBe(NOTE_LEVEL.waiting)
  })

  it('shows every note as a ghost before anything has been read', () => {
    expect(noteLevel('intro', null, null)).toBe(NOTE_LEVEL.waiting)
  })
})

describe('furthestOf', () => {
  it('returns the later section in page order', () => {
    expect(furthestOf('skills', 'education')).toBe('education')
    expect(furthestOf('education', 'skills')).toBe('education')
    expect(furthestOf(null, 'skills')).toBe('skills')
    expect(furthestOf('skills', null)).toBe('skills')
  })
})

describe('problem wall content', () => {
  it('keeps every note in the free band left of the content column', () => {
    for (const note of problemNotes) {
      expect(note.at[0]).toBeLessThanOrEqual(-0.45)
      expect(note.at[1]).toBeGreaterThanOrEqual(0.4)
      expect(note.text.length).toBeLessThanOrEqual(24)
    }
  })

  it('only threads notes that exist', () => {
    const ids = new Set(problemNotes.map((note) => note.id))
    for (const [from, to] of problemThreads) {
      expect(ids.has(from), from).toBe(true)
      expect(ids.has(to), to).toBe(true)
    }
  })
})

describe('placeNote', () => {
  it('leaves a note where it was authored at the resting pose with no emphasis', () => {
    const placed = placeNote([-0.7, 0.6], [0, 0], 9, WALL_POSE.intro, 0)
    expect(placed.at[0]).toBeCloseTo(-0.7, 10)
    expect(placed.at[1]).toBeCloseTo(0.6, 10)
    expect(placed.depth).toBe(9)
    expect(placed.grow).toBe(1)
  })

  it('brings an active note forward and makes it bigger', () => {
    const placed = placeNote([-0.7, 0.6], [0, 0], 9, WALL_POSE.intro, 1)
    expect(placed.depth).toBeCloseTo(9 * (1 - EMPHASIS.depth), 10)
    expect(placed.grow).toBeGreaterThan(1)
  })

  it('pulls the board into the top-left corner when it compacts', () => {
    const placed = placeNote([-0.5, 0.4], [0, 0], 9, { dx: 0, dy: 0, sx: 0.8, sy: 0.8, size: 0.8, finale: 0, intensity: 1 }, 0)
    expect(placed.at[0]).toBeLessThan(-0.5)
    expect(placed.at[1]).toBeGreaterThan(0.4)
  })

  it('keeps every note clear of the content column and the figure in every section, even emphasised', () => {
    for (const section of SECTION_IDS.filter((id) => id !== FINALE)) {
      for (const note of problemNotes) {
        const placed = placeNote(note.at, note.finale, note.depth, WALL_POSE[section], 1)
        expect(placed.at[0], `${note.id} in ${section}`).toBeLessThanOrEqual(-0.42)
        expect(placed.at[1], `${note.id} in ${section}`).toBeGreaterThanOrEqual(0.35)
        expect(placed.at[1], `${note.id} in ${section}`).toBeLessThanOrEqual(0.99)
      }
    }
  })
})

describe('the finale', () => {
  it('moves every note to its own place around the centred figure', () => {
    for (const note of problemNotes) {
      const placed = placeNote(note.at, note.finale, note.depth, WALL_POSE[FINALE], 0)
      expect(placed.at[0]).toBeCloseTo(note.finale[0], 10)
      expect(placed.at[1]).toBeCloseTo(note.finale[1], 10)
    }
  })

  it('keeps the finale clear of the figure: only the closing question sits mid-screen, above his head', () => {
    for (const note of problemNotes) {
      const [x, y] = note.finale
      // Above the closing copy, never over it.
      expect(y, note.id).toBeGreaterThanOrEqual(0.15)
      expect(y, note.id).toBeLessThanOrEqual(0.95)
      // A label runs about 0.3 right of its dot; the middle band (-0.35..0.3) holds only the question above his head.
      const inMiddle = x + 0.3 > -0.35 && x < 0.3
      if (inMiddle) expect(y, note.id).toBeGreaterThanOrEqual(0.85)
    }
  })

  it('keeps the whole board quiet at the finale, so the closing words stay the focal point', () => {
    expect(WALL_POSE[FINALE].intensity).toBeLessThan(0.5)
    expect(WALL_POSE[FINALE].size).toBeLessThan(1)
  })

  it('lights every question, even for a visitor who jumped straight to the end', () => {
    for (const note of problemNotes) expect(noteLevel(note.section, FINALE, FINALE)).toBeGreaterThanOrEqual(NOTE_LEVEL.visited)
  })
})

describe('threadReach', () => {
  it('draws a thread in full once both of its notes have been read', () => {
    expect(threadReach(NOTE_LEVEL.visited, NOTE_LEVEL.active)).toBe(1)
  })

  it('leaves only a stub while either end is still a ghost', () => {
    expect(threadReach(NOTE_LEVEL.waiting, NOTE_LEVEL.active)).toBe(THREAD_STUB)
  })
})
