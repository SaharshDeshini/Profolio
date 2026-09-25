import { describe, expect, it } from 'vitest'
import { ACT1_BEATS } from '../scroll/beats.ts'
import { CAMERA_PATH, sampleCameraPose, type Vec3 } from './cameraPath.ts'

const STEPS = 400
const samples = Array.from({ length: STEPS + 1 }, (_, i) => {
  const p = i / STEPS
  return { p, pose: sampleCameraPose(p) }
})

const distance = (a: Vec3, b: Vec3): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/** Angle swept around the target, 0 = in front (+z), growing as the camera goes round to the side. */
const azimuthOf = (position: Vec3, target: Vec3): number =>
  Math.atan2(position[0] - target[0], position[2] - target[2])

describe('sampleCameraPose: endpoints', () => {
  it('starts face-on: in front, centred, on the wide shot', () => {
    const { position, target, fov } = sampleCameraPose(0)
    expect(position[0]).toBeCloseTo(0, 6)
    expect(position[2]).toBeGreaterThan(target[2])
    expect(distance(position, target)).toBeCloseTo(CAMERA_PATH.radius.start, 6)
    expect(fov).toBe(CAMERA_PATH.fov.act1)
  })

  it('ends behind the person, offset to one shoulder, close to the laptop', () => {
    const { position, target } = sampleCameraPose(1)
    expect(position[2]).toBeLessThan(target[2])
    expect(position[0]).toBeGreaterThan(0)
    expect(distance(position, target)).toBeCloseTo(CAMERA_PATH.radius.end, 6)
    expect(target).toEqual(CAMERA_PATH.target.laptop)
  })

  it('finishes on the narrowed docked lens', () => {
    expect(sampleCameraPose(1).fov).toBeCloseTo(CAMERA_PATH.fov.docked, 6)
  })
})

describe('sampleCameraPose: the shape of the move', () => {
  it('never pulls back: the distance to the target only ever shrinks', () => {
    let previous = Number.POSITIVE_INFINITY
    for (const { pose } of samples) {
      const radius = distance(pose.position, pose.target)
      expect(radius).toBeLessThanOrEqual(previous + 1e-9)
      previous = radius
    }
  })

  it('sweeps round in one direction only', () => {
    let previous = -Number.EPSILON
    for (const { pose } of samples) {
      const azimuth = azimuthOf(pose.position, pose.target)
      expect(azimuth).toBeGreaterThanOrEqual(previous - 1e-9)
      previous = azimuth
    }
  })

  it('pushes in before it orbits: no sideways travel while the push-in is under way', () => {
    const midPush = ACT1_BEATS.orbit[0] * 0.5
    const { position, target } = sampleCameraPose(midPush)
    expect(azimuthOf(position, target)).toBeCloseTo(0, 6)
    expect(distance(position, target)).toBeLessThan(CAMERA_PATH.radius.start)
  })

  it('moves continuously: no frame-to-frame jump anywhere on the path', () => {
    let largestStep = 0
    for (let i = 1; i < samples.length; i++) {
      const before = samples[i - 1]
      const after = samples[i]
      if (!before || !after) throw new Error(`missing sample at ${i}`)
      largestStep = Math.max(largestStep, distance(before.pose.position, after.pose.position))
    }
    expect(largestStep).toBeLessThan(0.15)
  })

  it('stays above the desk top so the camera never dips under the table', () => {
    for (const { p, pose } of samples) {
      expect(pose.position[1], `p=${p}`).toBeGreaterThanOrEqual(1)
    }
  })

  it('keeps every coordinate finite', () => {
    for (const { pose } of samples) {
      for (const value of [...pose.position, ...pose.target, pose.fov]) {
        expect(Number.isFinite(value)).toBe(true)
      }
    }
  })
})

describe('sampleCameraPose: the lens', () => {
  it('holds the wide lens through the whole camera flight', () => {
    for (const { p, pose } of samples) {
      if (p <= ACT1_BEATS.dock[0]) expect(pose.fov, `p=${p}`).toBe(CAMERA_PATH.fov.act1)
    }
  })

  it('only ever narrows, and only during the dock', () => {
    let previous = Number.POSITIVE_INFINITY
    for (const { pose } of samples) {
      expect(pose.fov).toBeLessThanOrEqual(previous + 1e-9)
      previous = pose.fov
    }
  })
})

describe('sampleCameraPose: bad input', () => {
  it('clamps progress outside 0..1 to the endpoints', () => {
    expect(sampleCameraPose(-2)).toEqual(sampleCameraPose(0))
    expect(sampleCameraPose(7)).toEqual(sampleCameraPose(1))
  })

  it('treats NaN as the start rather than producing a NaN camera', () => {
    expect(sampleCameraPose(Number.NaN)).toEqual(sampleCameraPose(0))
  })
})
