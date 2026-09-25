/**
 * The night city seen through the window (CityWindow.tsx), as data: building
 * silhouettes in three depth layers, their lit windows, and street-level
 * lights. Generated from a fixed seed, so the skyline is the same on every
 * load and in every screenshot, and pure, so it can be tested without a canvas.
 * Units are 0..1 of the texture: x left to right, y from the bottom up.
 */

export type CityLayer = 'far' | 'mid' | 'near'

export interface LitWindow {
  readonly x: number
  readonly y: number
  readonly warm: boolean
}

export interface Building {
  readonly layer: CityLayer
  readonly x: number
  readonly width: number
  readonly height: number
  readonly windows: readonly LitWindow[]
  /** A red aviation light on the roof: only the tallest towers carry one. */
  readonly beacon: boolean
}

export interface StreetLight {
  readonly x: number
  readonly y: number
  readonly radius: number
  readonly warm: boolean
}

export interface Cityscape {
  readonly buildings: readonly Building[]
  readonly streetLights: readonly StreetLight[]
}

/** Small, fast, seedable PRNG (mulberry32). Deterministic across browsers. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Per layer: how tall buildings get, how wide, and how many of their windows are lit. Farther is lower, denser and dimmer. */
const LAYER_SPEC: Readonly<Record<CityLayer, { minH: number; maxH: number; minW: number; maxW: number; lit: number }>> = {
  far: { minH: 0.18, maxH: 0.42, minW: 0.025, maxW: 0.06, lit: 0.1 },
  mid: { minH: 0.22, maxH: 0.6, minW: 0.04, maxW: 0.09, lit: 0.14 },
  near: { minH: 0.3, maxH: 0.82, minW: 0.06, maxW: 0.14, lit: 0.08 },
}

/** Window grid spacing, as a share of the texture. */
const WINDOW_STEP = { x: 0.009, y: 0.018 } as const

/** Towers taller than this share of the frame carry a beacon. */
export const BEACON_HEIGHT = 0.62

function buildLayer(layer: CityLayer, random: () => number): Building[] {
  const spec = LAYER_SPEC[layer]
  const buildings: Building[] = []
  let x = -random() * spec.maxW
  while (x < 1) {
    const width = spec.minW + random() * (spec.maxW - spec.minW)
    const height = spec.minH + random() * random() * (spec.maxH - spec.minH)
    const windows: LitWindow[] = []
    for (let wy = 0.04; wy < height - 0.02; wy += WINDOW_STEP.y) {
      for (let wx = WINDOW_STEP.x; wx < width - WINDOW_STEP.x / 2; wx += WINDOW_STEP.x) {
        if (random() < spec.lit) windows.push({ x: x + wx, y: wy, warm: random() < 0.7 })
      }
    }
    buildings.push({ layer, x, width, height, windows, beacon: height > BEACON_HEIGHT })
    x += width + random() * 0.01
  }
  return buildings
}

/** The whole skyline, back to front, plus street lights along its foot. */
export function generateCityscape(seed = 7): Cityscape {
  const random = seededRandom(seed)
  const buildings = [...buildLayer('far', random), ...buildLayer('mid', random), ...buildLayer('near', random)]
  const streetLights: StreetLight[] = []
  for (let i = 0; i < 26; i += 1) {
    streetLights.push({ x: random(), y: 0.02 + random() * 0.08, radius: 0.004 + random() * 0.01, warm: random() < 0.8 })
  }
  return { buildings, streetLights }
}
