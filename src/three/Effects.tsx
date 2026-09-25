import { useFrame } from '@react-three/fiber'
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing'
import { useMemo, useRef } from 'react'
import { Vector3 } from 'three'
import { progress } from '../scroll/progress.ts'
import { dockAmountAt } from './dock.ts'
import { DESK, FOCUS_TARGET_NAME, LAPTOP } from './room/dimensions.ts'
import { useQuality } from './useQuality.ts'

const BLOOM = { luminanceThreshold: 0.82, luminanceSmoothing: 0.25, intensity: 0.42, mipmapBlur: true } as const
// The world-space range (metres) that stays sharp around the laptop. Wide enough to keep the person crisp.
const DOF = { worldFocusRange: 2.4, bokehScale: 2.2, resolutionScale: 0.5 } as const
/**
 * Once docked the laptop is small and the room behind it carries the problem
 * wall, which has to be readable: the focus pull eases from Act 1's full
 * cinematic blur to a gentle softness as the rig docks.
 */
const DOCKED_BOKEH_SCALE = 0.55

/**
 * The finish: a soft bloom on the lit screen, a shallow focus pull that keeps
 * the laptop sharp while the room falls away, grain to break banding, a
 * vignette to hold the eye, and filmic tone mapping. The composer bypasses the
 * renderer's own tone mapping, so it is restated here to keep the look the
 * scene was lit for.
 *
 * ORDER MATTERS. Depth of field and bloom work on scene-referred light, which
 * near the screen's own lamp is many times brighter than 1, so they run first.
 * Tone mapping then brings it into 0..1, and only after that do grain and
 * vignette run: both blend maths assume 0..1 input. Run on the raw HDR values
 * (the old order) a soft-light noise blend swings each channel wildly and
 * produces a coloured speckle ring around the hotspot under the laptop.
 *
 * What runs is decided by the quality tier (see `quality.ts`); `low` mounts no
 * composer at all.
 */
export function Effects() {
  const features = useQuality()
  const target = useMemo(() => new Vector3(0, DESK.topY + LAPTOP.baseHeight, LAPTOP.z), [])
  const depthOfField = useRef<DepthOfFieldEffect>(null)

  // Follows the laptop through the dock, which moves and scales the whole rig.
  useFrame(({ scene }) => {
    scene.getObjectByName(FOCUS_TARGET_NAME)?.getWorldPosition(target)
    const effect = depthOfField.current
    if (effect) {
      const docked = dockAmountAt(progress.smooth)
      effect.bokehScale = DOF.bokehScale + (DOCKED_BOKEH_SCALE - DOF.bokehScale) * docked
    }
  })

  if (!features.postFx) return null

  return (
    <EffectComposer multisampling={features.multisampling}>
      {features.depthOfField && <DepthOfField ref={depthOfField} target={target} {...DOF} />}
      {features.bloom && <Bloom {...BLOOM} />}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      {features.grain && <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.25} />}
      <Vignette offset={0.3} darkness={0.65} />
    </EffectComposer>
  )
}
