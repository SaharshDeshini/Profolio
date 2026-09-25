import type { StoryMode } from '../scroll/storyMode.ts'

/**
 * How much the GPU is asked to do. `high` gets the full finish (bloom, depth of
 * field, grain, vignette), `mid` drops depth of field, `low` renders straight
 * to the canvas with no post-processing at all.
 */
export type QualityTier = 'high' | 'mid' | 'low'

export interface QualityEnvironment {
  readonly mode: StoryMode
  /** `navigator.hardwareConcurrency`; 0 when the browser will not say. */
  readonly cores: number
  /** `navigator.deviceMemory` in GB; null when unsupported (Safari, Firefox). */
  readonly memoryGb: number | null
}

export interface QualityFeatures {
  readonly postFx: boolean
  readonly bloom: boolean
  readonly depthOfField: boolean
  readonly grain: boolean
  /** MSAA samples for the effect composer's buffer. */
  readonly multisampling: number
  /** Width of the laptop screen's render target; height follows the screen's aspect. */
  readonly screenTextureWidth: number
  readonly screenSamples: number
  /**
   * The room's extra set dressing (window, shelves, reading corner, desk props, dust): geometry,
   * not post-processing, but skipped alongside it on constrained devices. The fog and the light
   * washes (room/Atmosphere.tsx) are not part of this: they stay on every tier.
   */
  readonly setDressing: boolean
}

const FEATURES: Record<QualityTier, QualityFeatures> = {
  high: {
    postFx: true,
    bloom: true,
    depthOfField: true,
    grain: true,
    multisampling: 4,
    screenTextureWidth: 2048,
    screenSamples: 4,
    setDressing: true,
  },
  mid: {
    postFx: true,
    bloom: true,
    depthOfField: false,
    grain: true,
    multisampling: 2,
    screenTextureWidth: 1536,
    screenSamples: 4,
    setDressing: true,
  },
  low: {
    postFx: false,
    bloom: false,
    depthOfField: false,
    grain: false,
    multisampling: 0,
    screenTextureWidth: 1024,
    screenSamples: 2,
    setDressing: false,
  },
}

export const featuresFor = (tier: QualityTier): QualityFeatures => FEATURES[tier]

/**
 * A first guess from what the device admits to. Phones and reduced-motion
 * visitors get the plain render; the rest are split by core count and memory.
 * Unknown values are treated as capable, so browsers that hide them are not
 * penalised; the runtime monitor steps them down if they turn out slow.
 */
export function resolveTier({ mode, cores, memoryGb }: QualityEnvironment): QualityTier {
  if (mode === 'mobile' || mode === 'reduced') return 'low'
  const knownCores = cores > 0 ? cores : 8
  const knownMemory = memoryGb ?? 8
  if (knownCores < 4 || knownMemory < 4) return 'low'
  if (knownCores >= 8 && knownMemory >= 8) return 'high'
  return 'mid'
}


/** One rung down when the frame rate says the guess was too generous. */
export function stepDown(tier: QualityTier): QualityTier {
  if (tier === 'high') return 'mid'
  return 'low'
}
