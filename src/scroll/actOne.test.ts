import { describe, expect, it } from 'vitest'
import { CAMERA_PATH, fovForHorizontal, type CameraFrame } from '../three/cameraPath.ts'
import { story } from '../content/story.ts'
import { ACT1_BEATS } from './beats.ts'
import {
  CAPTIONS,
  HEADLINE_FADE,
  HERO_HIDDEN_AFTER,
  cameraReadout,
  captionOpacity,
  cueOpacity,
  focalLengthMm,
  focusReadout,
  FOCUS_FAR_M,
  formatReadout,
  headlineFrame,
  readoutOpacity,
} from './actOne.ts'

describe('focalLengthMm', () => {
  it('matches the classic lens for the authored fields of view', () => {
    // 35 degrees vertical on a 24mm-high frame is a 38mm lens; 26 degrees is 52mm.
    expect(focalLengthMm(CAMERA_PATH.fov.act1)).toBeCloseTo(38, 0)
    expect(focalLengthMm(CAMERA_PATH.fov.docked)).toBeCloseTo(52, 0)
  })

  it('gets longer as the field of view narrows', () => {
    expect(focalLengthMm(20)).toBeGreaterThan(focalLengthMm(40))
  })
})

describe('cameraReadout', () => {
  it('reads the authored start and end of the flight', () => {
    const start = cameraReadout(0)
    expect(start.distanceM).toBeCloseTo(CAMERA_PATH.radius.start, 5)
    expect(start.focalMm).toBe(38)

    const end = cameraReadout(1)
    expect(end.distanceM).toBeCloseTo(CAMERA_PATH.radius.end, 5)
    expect(end.focalMm).toBe(52)
  })

  it('only ever gets closer', () => {
    let previous = Infinity
    for (let p = 0; p <= 1; p += 0.05) {
      const { distanceM } = cameraReadout(p)
      expect(distanceM).toBeLessThanOrEqual(previous + 1e-9)
      previous = distanceM
    }
  })

  it('formats to a fixed width', () => {
    expect(formatReadout({ focalMm: 38, distanceM: 7 })).toBe('038MM  7.0M')
    expect(formatReadout({ focalMm: 52, distanceM: 2.4 })).toBe('052MM  2.4M')
  })

  it('widens for a narrow portrait frame instead of always reading the landscape lens', () => {
    const portrait: CameraFrame = { aspect: 9 / 19.5, docks: false }
    const expectedFov = fovForHorizontal(CAMERA_PATH.portrait.minHorizontalFov, portrait.aspect)
    const { focalMm } = cameraReadout(0, portrait)
    expect(focalMm).toBe(Math.round(focalLengthMm(expectedFov)))
    expect(focalMm).toBeLessThan(cameraReadout(0).focalMm)
  })
})

describe('headlineFrame', () => {
  it('is fully shown at the top and fully gone once the push-in is under way', () => {
    expect(headlineFrame(0)).toEqual({ opacity: 1, scale: 1, lift: 0 })
    const gone = headlineFrame(0.3)
    expect(gone.opacity).toBe(0)
    expect(gone.scale).toBeGreaterThan(1)
    expect(gone.lift).toBe(1)
  })

  it('fades monotonically', () => {
    let previous = 1
    for (let p = 0; p <= 0.3; p += 0.01) {
      const { opacity } = headlineFrame(p)
      expect(opacity).toBeLessThanOrEqual(previous + 1e-9)
      previous = opacity
    }
  })
})

describe('cue and readout', () => {
  it('the cue is there at rest and gone after the first scroll', () => {
    expect(cueOpacity(0)).toBe(1)
    expect(cueOpacity(0.1)).toBe(0)
  })

  it('the readout holds through the orbit and is gone by the dock', () => {
    expect(readoutOpacity(0.5)).toBe(1)
    expect(readoutOpacity(0.9)).toBe(0)
  })

  it('hides the whole layer after the readout has already gone', () => {
    expect(readoutOpacity(HERO_HIDDEN_AFTER)).toBe(0)
  })
})

describe('captions', () => {
  it('each is invisible outside its span and full in the middle of it', () => {
    for (const { range } of CAPTIONS) {
      const [start, end] = range
      expect(captionOpacity(start - 0.05, range)).toBe(0)
      expect(captionOpacity(end + 0.05, range)).toBe(0)
      expect(captionOpacity((start + end) / 2, range)).toBe(1)
    }
  })

  it('run one after another without overlapping in the middle of a span', () => {
    for (let i = 0; i < CAPTIONS.length - 1; i += 1) {
      const current = CAPTIONS[i]
      const next = CAPTIONS[i + 1]
      expect(current?.range[1]).toBeLessThanOrEqual(next?.range[0] ?? 0)
    }
  })

  it('tell the story in order, one caption per line', () => {
    expect(CAPTIONS.map((caption) => caption.id)).toEqual(story.map((line) => line.id))
  })

  it('start after the name has faded and finish before the motto lands', () => {
    for (const { range } of CAPTIONS) {
      expect(range[0]).toBeGreaterThanOrEqual(HEADLINE_FADE[1])
      expect(range[1]).toBeLessThanOrEqual(ACT1_BEATS.motto[0])
    }
  })

  it('keeps the last line off the right, where the orbit has brought the figure', () => {
    expect(CAPTIONS.find((caption) => caption.id === 'open')?.side).toBe('left')
  })
})

describe('focusReadout', () => {
  it('starts focused far out while nothing has loaded', () => {
    expect(focusReadout(0)).toBe(`FOCUSING  ${FOCUS_FAR_M.toFixed(1)}M`)
  })

  it('racks in toward the opening shot as the scene loads', () => {
    const distanceAt = (loaded: number) => Number(/([\d.]+)M$/.exec(focusReadout(loaded))?.[1])
    expect(distanceAt(0.5)).toBeLessThan(FOCUS_FAR_M)
    expect(distanceAt(0.9)).toBeLessThan(distanceAt(0.5))
  })

  it('lands on exactly the distance the viewfinder shows first, so the crossfade to it reads as one number', () => {
    expect(focusReadout(1)).toBe(`FOCUSING  ${cameraReadout(0).distanceM.toFixed(1)}M`)
  })

  it('never pads the distance with a leading zero', () => {
    expect(focusReadout(1)).not.toMatch(/ 0\d/)
  })
})
