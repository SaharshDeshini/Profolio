import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { RefObject } from 'react'
import { setRawProgress, snapProgress } from './progress.ts'
import { playsActOne, type StoryMode } from './storyMode.ts'

gsap.registerPlugin(useGSAP, ScrollTrigger)

/**
 * ScrollTrigger as a pure sensor: it reports how far through the Act 1 runway
 * we are and animates nothing, so there is nothing for `scrub` to smooth.
 * Never pinned: the canvas is `position: fixed`, so the runway is just height.
 *
 * `useGSAP` scopes the trigger to a gsap.context and reverts it on cleanup,
 * which is what makes this safe under React 19 StrictMode's double-invoked
 * effects (a hand-rolled version leaks a duplicate trigger).
 */
export function useStoryScroll(runwayRef: RefObject<HTMLElement | null>, mode: StoryMode): void {
  useGSAP(
    () => {
      if (!playsActOne(mode)) {
        snapProgress(1)
        return
      }

      const runway = runwayRef.current
      if (!runway) return

      // The first measurement snaps: a reload or deep link part-way down the
      // page must start already there, not replay Act 1 as a visible rush.
      let hasMeasured = false

      ScrollTrigger.create({
        trigger: runway,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => setRawProgress(self.progress),
        onRefresh: (self) => {
          if (hasMeasured) {
            setRawProgress(self.progress)
          } else {
            snapProgress(self.progress)
            hasMeasured = true
          }
        },
      })
    },
    { dependencies: [mode], revertOnUpdate: true },
  )
}
