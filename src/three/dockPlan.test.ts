import { describe, expect, it } from 'vitest'
import { SPLIT_MIN_WIDTH } from '../layout.ts'
import { DOCK, NO_DOCK, dockPlanFor, dockScaleAt, sampleDock, solveDock } from './dock.ts'

const STEPS = 100
const samples = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS)

describe('dockPlanFor', () => {
  it('leaves the rig where it is when there is no side band to dock into', () => {
    for (const [width, height] of [
      [390, 844],
      [768, 1024],
      [SPLIT_MIN_WIDTH - 1, 768],
    ] as const) {
      expect(dockPlanFor(width, height), `${width}x${height}`).toEqual(NO_DOCK)
    }
  })

  it('docks it into the band at the split width and up', () => {
    expect(dockPlanFor(1440, 900)).toEqual(solveDock(1440 / 900))
    expect(dockPlanFor(1440, 900).scale).toBe(DOCK.scale)
    expect(dockPlanFor(SPLIT_MIN_WIDTH, 800).scale).toBe(DOCK.scale)
  })

  it('returns the same plan for the same size, so a per-frame caller allocates nothing', () => {
    expect(dockPlanFor(1440, 900)).toBe(dockPlanFor(1440, 900))
    expect(dockPlanFor(390, 844)).toBe(dockPlanFor(390, 844))
  })
})

describe('with no dock', () => {
  it('never moves or scales the rig at any point in the story', () => {
    for (const p of samples) {
      const { position, scale } = sampleDock(p, NO_DOCK)
      expect(position, `p=${p}`).toEqual([0, 0, 0])
      expect(scale, `p=${p}`).toBeCloseTo(1, 12)
    }
  })

  it('keeps the screen light at full strength, since there is no shrink to compensate for', () => {
    for (const p of samples) expect(dockScaleAt(p, NO_DOCK.scale), `p=${p}`).toBeCloseTo(1, 12)
  })
})

describe('dockScaleAt with a target scale', () => {
  it('defaults to the docked scale', () => {
    expect(dockScaleAt(0)).toBe(1)
    expect(dockScaleAt(1)).toBeCloseTo(DOCK.scale, 10)
  })

  it('eases to whichever scale it is given', () => {
    expect(dockScaleAt(1, 0.7)).toBeCloseTo(0.7, 10)
  })
})

describe('solveDock on a tall screen that still has a band', () => {
  it('stays finite, for example a portrait tablet 1024 wide', () => {
    const { position, scale } = solveDock(1024 / 1366)
    expect(position.every(Number.isFinite)).toBe(true)
    expect(scale).toBe(DOCK.scale)
  })
})
