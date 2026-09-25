import { describe, expect, it } from 'vitest'
import { SPLIT_MIN_WIDTH } from '../layout.ts'
import {
  CAMERA_PATH,
  DEFAULT_FRAME,
  cameraFrameFor,
  fovForHorizontal,
  sampleCameraPose,
} from './cameraPath.ts'

const STEPS = 100
const samples = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS)

const PORTRAIT = [0.3, 0.46, 0.56, 0.75]
const LANDSCAPE = [4 / 3, 16 / 10, 16 / 9, 21 / 9]

/** The horizontal view, in degrees, that a vertical lens gives on a screen of this shape. */
const horizontalFov = (verticalDegrees: number, aspect: number): number =>
  ((2 * Math.atan(Math.tan((verticalDegrees * Math.PI) / 360) * aspect)) * 180) / Math.PI

describe('fovForHorizontal', () => {
  it.each([0.3, 0.46, 1, 16 / 9])(
    'is the vertical lens that gives exactly the asked horizontal view at aspect %s',
    (aspect) => {
      expect(horizontalFov(fovForHorizontal(28, aspect), aspect)).toBeCloseTo(28, 8)
    },
  )

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'falls back to the default aspect for %s',
    (aspect) => {
      expect(fovForHorizontal(28, aspect)).toBe(fovForHorizontal(28, DEFAULT_FRAME.aspect))
    },
  )
})

describe('sampleCameraPose: framing for the screen', () => {
  it('treats no frame as the default wide screen', () => {
    for (const p of samples) expect(sampleCameraPose(p)).toEqual(sampleCameraPose(p, DEFAULT_FRAME))
  })

  it('is unchanged on any landscape screen: the shot is authored for those', () => {
    for (const aspect of LANDSCAPE) {
      for (const p of samples) {
        expect(sampleCameraPose(p, { aspect, docks: true }), `aspect=${aspect} p=${p}`).toEqual(
          sampleCameraPose(p),
        )
      }
    }
  })

  it.each(PORTRAIT)(
    'never narrows the horizontal view below the minimum at aspect %s, so the laptop and person stay in frame',
    (aspect) => {
      for (const p of samples) {
        const { fov } = sampleCameraPose(p, { aspect, docks: true })
        expect(horizontalFov(fov, aspect), `p=${p}`).toBeGreaterThanOrEqual(
          CAMERA_PATH.portrait.minHorizontalFov - 1e-6,
        )
      }
    },
  )

  it('widens the vertical lens on a tall screen instead of moving the camera', () => {
    for (const p of samples) {
      const wide = sampleCameraPose(p)
      const tall = sampleCameraPose(p, { aspect: 0.46, docks: false })
      expect(tall.position, `p=${p}`).toEqual(wide.position)
      expect(tall.fov, `p=${p}`).toBeGreaterThanOrEqual(wide.fov - 1e-9)
    }
    expect(sampleCameraPose(0.5, { aspect: 0.46, docks: false }).fov).toBeGreaterThan(
      CAMERA_PATH.fov.act1,
    )
  })

  it('lifts the subject up the frame on a tall screen, so the text has room below it', () => {
    const wide = sampleCameraPose(1)
    const tall = sampleCameraPose(1, { aspect: 0.46, docks: false })
    // Looking lower puts the subject higher in the frame.
    expect(tall.target[1]).toBeLessThan(wide.target[1])
  })

  it('pans towards the person on a tall screen, so their head is not cut off at the edge', () => {
    const base = sampleCameraPose(1)
    const { position, target, fov } = sampleCameraPose(1, { aspect: 0.4, docks: false })
    // The camera's right-hand direction on the ground plane, from where it looks at the unshifted target.
    const dx = base.target[0] - position[0]
    const dz = base.target[2] - position[2]
    const level = Math.hypot(dx, dz)
    const rightX = -dz / level
    const rightZ = dx / level
    const aside = (target[0] - base.target[0]) * rightX + (target[2] - base.target[2]) * rightZ

    const distance = Math.hypot(dx, base.target[1] - position[1], dz)
    const halfWidth = distance * Math.tan((fov * Math.PI) / 360) * 0.4
    expect(aside).toBeGreaterThan(0)
    expect(aside).toBeCloseTo(CAMERA_PATH.portrait.shift * halfWidth, 6)
  })

  it('raises the subject by the authored share of half the visible height at full portrait', () => {
    const base = sampleCameraPose(1)
    const { position, target, fov } = sampleCameraPose(1, { aspect: 0.4, docks: false })
    const distance = Math.hypot(
      position[0] - base.target[0],
      position[1] - base.target[1],
      position[2] - base.target[2],
    )
    const halfHeight = distance * Math.tan((fov * Math.PI) / 360)
    expect(base.target[1] - target[1]).toBeCloseTo(CAMERA_PATH.portrait.raise * halfHeight, 6)
  })

  it('holds the wide lens to the end when there is no dock', () => {
    for (const p of samples) {
      expect(sampleCameraPose(p, { aspect: 16 / 9, docks: false }).fov, `p=${p}`).toBe(
        CAMERA_PATH.fov.act1,
      )
    }
  })

  it('still narrows the lens for the dock when there is one', () => {
    expect(sampleCameraPose(1, DEFAULT_FRAME).fov).toBeCloseTo(CAMERA_PATH.fov.docked, 6)
  })

  it('changes smoothly with the shape of the screen: a small change is a small change of shot', () => {
    const a = sampleCameraPose(1, { aspect: 0.7, docks: false })
    const b = sampleCameraPose(1, { aspect: 0.71, docks: false })
    expect(Math.abs(a.fov - b.fov)).toBeLessThan(1)
    expect(Math.abs(a.target[1] - b.target[1])).toBeLessThan(0.02)
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'falls back to the default aspect for %s',
    (aspect) => {
      expect(sampleCameraPose(0.7, { aspect, docks: true })).toEqual(sampleCameraPose(0.7))
    },
  )

  it('keeps every value finite across the whole path on a phone', () => {
    for (const p of samples) {
      const pose = sampleCameraPose(p, { aspect: 0.46, docks: false })
      for (const value of [...pose.position, ...pose.target, pose.fov]) {
        expect(Number.isFinite(value)).toBe(true)
      }
    }
  })
})

describe('cameraFrameFor', () => {
  it('docks only where there is a side band: at the split width and up', () => {
    expect(cameraFrameFor(SPLIT_MIN_WIDTH, 800).docks).toBe(true)
    expect(cameraFrameFor(1440, 900).docks).toBe(true)
    expect(cameraFrameFor(SPLIT_MIN_WIDTH - 1, 800).docks).toBe(false)
    expect(cameraFrameFor(768, 1024).docks).toBe(false)
    expect(cameraFrameFor(390, 844).docks).toBe(false)
  })

  it('reports the screen aspect', () => {
    expect(cameraFrameFor(1440, 900).aspect).toBeCloseTo(1.6, 10)
    expect(cameraFrameFor(390, 844).aspect).toBeCloseTo(390 / 844, 10)
  })

  it('falls back to the default aspect for a zero-sized viewport', () => {
    expect(cameraFrameFor(0, 0).aspect).toBe(DEFAULT_FRAME.aspect)
  })

  it('returns the same frame for the same size, so a per-frame caller allocates nothing', () => {
    expect(cameraFrameFor(1440, 900)).toBe(cameraFrameFor(1440, 900))
  })
})
