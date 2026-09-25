import { PerspectiveCamera, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { SPLIT_RATIO } from '../layout.ts'
import { ACT1_BEATS } from '../scroll/beats.ts'
import { sampleCameraPose } from './cameraPath.ts'
import { DOCK, DOCK_NDC_X, SECTION_DOCK_POSE, dockAmountAt, dockScaleAt, sampleDock, solveDock } from './dock.ts'

const ASPECTS = { '16:9': 16 / 9, '16:10': 16 / 10, '21:9': 21 / 9, '4:3': 4 / 3 }

/** Where the rig's anchor lands on screen (-1..1) once the rig sits at `transform`, seen through the final camera. */
function anchorOnScreen(aspect: number, position: readonly [number, number, number], scale: number) {
  const pose = sampleCameraPose(1)
  const camera = new PerspectiveCamera(pose.fov, aspect, 0.1, 80)
  camera.position.set(...pose.position)
  camera.lookAt(...pose.target)
  camera.updateMatrixWorld()
  camera.updateProjectionMatrix()
  const anchor = new Vector3(...DOCK.anchor).multiplyScalar(scale).add(new Vector3(...position))
  return anchor.project(camera)
}

describe('DOCK_NDC_X', () => {
  it('is the centre of the band to the left of the content column', () => {
    // The band spans the left edge (-1) to the column's edge (2 * ratio - 1); its middle is the ratio less one.
    expect(DOCK_NDC_X).toBeCloseTo((-1 + (2 * SPLIT_RATIO - 1)) / 2, 10)
    expect(DOCK_NDC_X).toBeLessThan(0)
  })
})

describe('solveDock', () => {
  it.each(Object.entries(ASPECTS))('puts the anchor in the middle of the left band at %s', (_name, aspect) => {
    const { position, scale } = solveDock(aspect)
    const onScreen = anchorOnScreen(aspect, position, scale)
    expect(onScreen.x).toBeCloseTo(DOCK_NDC_X, 6)
    expect(onScreen.y).toBeCloseTo(DOCK.ndcY, 6)
  })

  it('shrinks the rig to the docked scale', () => {
    expect(solveDock(16 / 9).scale).toBe(DOCK.scale)
  })

  it('keeps the anchor at the depth it started at, so it shifts across the image and does not zoom', () => {
    const pose = sampleCameraPose(1)
    const camera = new PerspectiveCamera(pose.fov, 16 / 9)
    camera.position.set(...pose.position)
    camera.lookAt(...pose.target)
    camera.updateMatrixWorld()
    const depthOf = (point: Vector3) => -point.clone().applyMatrix4(camera.matrixWorldInverse).z

    const { position, scale } = solveDock(16 / 9)
    const docked = new Vector3(...DOCK.anchor).multiplyScalar(scale).add(new Vector3(...position))
    expect(depthOf(docked)).toBeCloseTo(depthOf(new Vector3(...DOCK.anchor)), 6)
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('falls back to a sane aspect for %s', (aspect) => {
    const fallback = solveDock(DOCK.fallbackAspect)
    const result = solveDock(aspect)
    expect(result.position.every(Number.isFinite)).toBe(true)
    expect(result.position).toEqual(fallback.position)
  })

  it('moves the rig further as the screen gets wider, because the band moves with it', () => {
    const narrow = solveDock(ASPECTS['4:3'])
    const wide = solveDock(ASPECTS['21:9'])
    expect(narrow.position).not.toEqual(wide.position)
  })
})

describe('sampleDock', () => {
  const docked = solveDock(16 / 9)

  it('leaves the rig exactly where it was before the dock beat', () => {
    for (const p of [0, 0.3, ACT1_BEATS.dock[0]]) {
      expect(sampleDock(p, docked)).toEqual({ position: [0, 0, 0], scale: 1 })
    }
  })

  it('lands exactly on the docked pose when the beat ends', () => {
    const end = sampleDock(1, docked)
    expect(end.scale).toBeCloseTo(docked.scale, 10)
    end.position.forEach((value, axis) => expect(value).toBeCloseTo(docked.position[axis] ?? 0, 10))
  })

  it('only ever shrinks and slides towards the docked pose as progress grows', () => {
    let previousScale = 1
    let previousDistance = 0
    for (let i = 0; i <= 200; i++) {
      const { position, scale } = sampleDock(i / 200, docked)
      const travelled = Math.hypot(...position)
      expect(scale).toBeLessThanOrEqual(previousScale + 1e-12)
      expect(travelled).toBeGreaterThanOrEqual(previousDistance - 1e-12)
      previousScale = scale
      previousDistance = travelled
    }
  })
})

describe('SECTION_DOCK_POSE', () => {
  it("keeps 'intro' identical to the baseline DOCK pose, so the Act 1 handoff stays invisible", () => {
    expect(SECTION_DOCK_POSE.intro).toEqual({ ndcY: DOCK.ndcY, scale: DOCK.scale })
  })

  it('gives solveDock a pose override that changes where the anchor lands on screen', () => {
    const baseline = solveDock(16 / 9)
    const skills = solveDock(16 / 9, SECTION_DOCK_POSE.skills)
    expect(skills.scale).toBeCloseTo(SECTION_DOCK_POSE.skills.scale, 10)
    expect(skills.scale).not.toBeCloseTo(baseline.scale, 6)

    const onScreen = anchorOnScreen(16 / 9, skills.position, skills.scale)
    expect(onScreen.y).toBeCloseTo(SECTION_DOCK_POSE.skills.ndcY, 6)
  })

  it("puts the anchor at the pose's horizontal position when one is given", () => {
    const centred = solveDock(16 / 9, { ndcX: 0, ndcY: 0.3, scale: DOCK.scale })
    const onScreen = anchorOnScreen(16 / 9, centred.position, centred.scale)
    expect(onScreen.x).toBeCloseTo(0, 6)
    expect(onScreen.y).toBeCloseTo(0.3, 6)
  })

  it('brings the rig in from the side band toward the centre for Connect', () => {
    const connect = solveDock(16 / 9, SECTION_DOCK_POSE.connect)
    const x = anchorOnScreen(16 / 9, connect.position, connect.scale).x
    expect(x).toBeGreaterThan(-0.1)
    expect(x).toBeLessThan(0.3)
  })

  it('every section pose keeps the rig on screen with a finite, positive scale', () => {
    for (const pose of Object.values(SECTION_DOCK_POSE)) {
      const { position, scale } = solveDock(16 / 9, pose)
      expect(position.every(Number.isFinite)).toBe(true)
      expect(scale).toBeGreaterThan(0)
    }
  })
})

describe('dockAmountAt and dockScaleAt', () => {
  it('run from 0 to 1 across the dock beat and hold outside it', () => {
    const [start, end] = ACT1_BEATS.dock
    expect(dockAmountAt(start - 0.1)).toBe(0)
    expect(dockAmountAt(end)).toBe(1)
    expect(dockAmountAt((start + end) / 2)).toBeCloseTo(0.5, 10)
  })

  it('give a scale of 1 at rest and the docked scale when done', () => {
    expect(dockScaleAt(0)).toBe(1)
    expect(dockScaleAt(1)).toBeCloseTo(DOCK.scale, 10)
  })
})
