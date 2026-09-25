import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, type ReactNode } from 'react'
import type { Group } from 'three'
import { REDUCED_MOTION_QUERY } from '../layout.ts'
import { progress } from '../scroll/progress.ts'
import { getActiveSection } from '../state/activeSection.ts'
import { cameraFrameFor } from './cameraPath.ts'
import {
  NO_DOCK,
  SECTION_DOCK_POSE,
  dockAmountAt,
  dockPlanFor,
  sampleDock,
  solveDock,
  type DockTransform,
} from './dock.ts'
import { dampToward } from './room/screen/slides.ts'

interface DockRigProps {
  readonly children: ReactNode
}

/** How quickly the rig settles into a section's own resting pose, once docked. Slow and deliberate, like the rest of the site's motion. */
const SECTION_SETTLE_TIME = 0.6

/**
 * Close enough to 1 that the dock beat has finished easing: `progress.smooth`
 * approaches 1 exponentially and never guarantees hitting it bit-exact.
 */
const FULLY_DOCKED = 0.999

/**
 * The one group that docks: desk, chair, laptop, person and the lights that
 * ride with them. It is moved and scaled every frame from the story scalar, so
 * the canvas itself never has to change size. Where there is no side band to
 * dock into (below the split width) the plan is "stay put", and the rig simply
 * holds its shot behind the content.
 *
 * Once the Act 1 dock has fully landed, a second, separate layer takes over:
 * the rig eases toward whichever Act 2 section is being read (`activeSection`)
 * resting at its own small pose (see `SECTION_DOCK_POSE`), damped rather than
 * snapped so it reads as a settle, not a cut. This layer never runs while the
 * Act-1-driven dock is still animating, so the scroll-synced handoff at the
 * end of Act 1 is untouched.
 */
export function DockRig({ children }: DockRigProps) {
  const group = useRef<Group>(null)
  const rendered = useRef<DockTransform>(NO_DOCK)
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current = window.matchMedia(REDUCED_MOTION_QUERY).matches
  }, [])

  useFrame(({ size }, delta) => {
    const rig = group.current
    if (!rig) return

    // Solved on resize, not per frame: the plan is remembered for the last size.
    const plan = dockPlanFor(size.width, size.height)
    const base = sampleDock(progress.smooth, plan)

    let next = base
    if (plan !== NO_DOCK && dockAmountAt(progress.smooth) >= FULLY_DOCKED) {
      const pose = SECTION_DOCK_POSE[getActiveSection() ?? 'intro']
      const target = solveDock(cameraFrameFor(size.width, size.height).aspect, pose)
      const smoothTime = reducedMotion.current ? 0 : SECTION_SETTLE_TIME
      next = {
        position: [
          dampToward(rendered.current.position[0], target.position[0], delta, smoothTime),
          dampToward(rendered.current.position[1], target.position[1], delta, smoothTime),
          dampToward(rendered.current.position[2], target.position[2], delta, smoothTime),
        ],
        scale: dampToward(rendered.current.scale, target.scale, delta, smoothTime),
      }
    }

    rendered.current = next
    rig.position.set(next.position[0], next.position[1], next.position[2])
    rig.scale.setScalar(next.scale)
  })

  return (
    <group name="rig" ref={group}>
      {children}
    </group>
  )
}
