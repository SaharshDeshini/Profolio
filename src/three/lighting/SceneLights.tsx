import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { AmbientLight, Object3D, SpotLight } from 'three'
import { REDUCED_MOTION_QUERY } from '../../layout.ts'
import { progress } from '../../scroll/progress.ts'
import { revealNow } from '../../state/arrival.ts'
import { getActiveSection } from '../../state/activeSection.ts'
import { NO_DOCK, dockAmountAt, dockPlanFor } from '../dock.ts'
import { dampToward } from '../room/screen/slides.ts'
import { type LightMood, moodAt, sectionMood } from './presets.ts'

/**
 * Rim lights are narrow spots (candela), not directionals (lux). A directional
 * light lights every surface equally, which turned the whole floor into a flat
 * wash; a spot picks out the rig and leaves the rest of the room black.
 */
const RIM_SPOT_SCALE = 30

/**
 * The key light hangs directly over the middle of the person and the laptop,
 * so its pool and its visible beam (room/Atmosphere.tsx's LightShaft) centre
 * on the figure. A touch forward of the chair (z -0.25 rather than the seat's
 * -0.62) so the face and hands still catch it, not just the top of the head.
 */
const KEY_POSITION: [number, number, number] = [0, 3.6, -0.25]

/** How quickly ambient/rim/key ease toward a section's own mood overlay, once docked. Matches DockRig's settle time so the pose and the light change together. */
const SECTION_SETTLE_TIME = 0.6

/** Close enough to 1 that the dock beat has finished easing (see DockRig for why this isn't `>= 1`). */
const FULLY_DOCKED = 0.999

/**
 * Every intensity comes from `moodAt`, so the whole rig is driven by the one
 * scroll scalar and nothing is hardcoded per light. The laptop screen's own
 * light lives on the lid (see Laptop.tsx) so it follows the lid as it opens.
 */
export function SceneLights() {
  const ambient = useRef<AmbientLight>(null)
  const rimLeft = useRef<SpotLight>(null)
  const rimRight = useRef<SpotLight>(null)
  const key = useRef<SpotLight>(null)
  const aim = useRef<Object3D>(null)
  const rendered = useRef<LightMood>(moodAt(1))
  const reducedMotion = useRef(false)

  // These lights live inside the docking rig, so they must aim at a point that
  // travels with it. A spot's default target sits at the world origin, which
  // the rig leaves as soon as it docks.
  useEffect(() => {
    const target = aim.current
    if (!target) return
    for (const light of [rimLeft.current, rimRight.current, key.current]) {
      if (light) light.target = target
    }
  }, [])

  useEffect(() => {
    reducedMotion.current = window.matchMedia(REDUCED_MOTION_QUERY).matches
  }, [])

  useFrame(({ size }, delta) => {
    const base = moodAt(progress.smooth)
    const plan = dockPlanFor(size.width, size.height)

    let mood = base
    if (plan !== NO_DOCK && dockAmountAt(progress.smooth) >= FULLY_DOCKED) {
      const target = sectionMood(getActiveSection() ?? 'intro')
      const smoothTime = reducedMotion.current ? 0 : SECTION_SETTLE_TIME
      mood = {
        ambient: dampToward(rendered.current.ambient, target.ambient, delta, smoothTime),
        rim: dampToward(rendered.current.rim, target.rim, delta, smoothTime),
        key: dampToward(rendered.current.key, target.key, delta, smoothTime),
        // The screen's own ignition stays governed by the pure beat function, not the section overlay.
        screen: base.screen,
      }
    }
    rendered.current = mood

    // The opening (scroll/reveal.ts), on the same performance.now() clock as
    // the DOM rather than the R3F clock, which starts at canvas mount: the rims
    // find the figure first, then the overhead key switches on.
    const now = performance.now()
    const modelIn = revealNow('model', now)
    if (ambient.current) ambient.current.intensity = mood.ambient * modelIn
    if (rimLeft.current) rimLeft.current.intensity = mood.rim * RIM_SPOT_SCALE * modelIn
    if (rimRight.current) rimRight.current.intensity = mood.rim * RIM_SPOT_SCALE * modelIn
    if (key.current) key.current.intensity = mood.key * revealNow('spotlight', now)
  })

  return (
    <>
      <object3D ref={aim} />
      <ambientLight ref={ambient} color="#8fa3b8" intensity={0} />
      <spotLight
        ref={rimLeft}
        position={[-3.6, 3.2, -4.6]}
        angle={0.48}
        penumbra={1}
        decay={2}
        color="#7fd8ff"
        intensity={0}
      />
      <spotLight
        ref={rimRight}
        position={[3.9, 2.8, -4.6]}
        angle={0.48}
        penumbra={1}
        decay={2}
        color="#bff6ff"
        intensity={0}
      />
      <spotLight
        ref={key}
        position={KEY_POSITION}
        angle={0.5}
        penumbra={1}
        decay={2}
        color="#e6f4ff"
        intensity={0}
      />
    </>
  )
}
