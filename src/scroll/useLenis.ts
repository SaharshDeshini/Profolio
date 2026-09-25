import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { useEffect } from 'react'
import { getArrival, subscribeArrival } from '../state/arrival.ts'
import { setLenis } from './lenisInstance.ts'
import { REVEAL_WINDOWS } from './reveal.ts'

gsap.registerPlugin(ScrollTrigger)

/**
 * Lenis is the ONLY thing that smooths scrolling. ScrollTrigger reads its
 * position as-is and `progress.ts` adds only a token frame-rate-independent
 * damp; stacking a second smoother on top of this produces laggy mush.
 *
 * Tuned on its own in step 2, before anything else is on screen.
 * `syncTouch: false` leaves touch devices on native momentum.
 */
export const LENIS_OPTIONS = {
  lerp: 0.085,
  wheelMultiplier: 1,
  smoothWheel: true,
  syncTouch: false,
  autoRaf: false,
} as const

export function useLenis(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return

    const lenis = new Lenis(LENIS_OPTIONS)
    lenis.on('scroll', () => ScrollTrigger.update())
    setLenis(lenis)

    // Held still behind the arrival screen and through the opening, so nobody
    // scrolls into a half-built frame: released when the words start to
    // appear (the text layer in reveal.ts), or at once for a skip or deep link.
    let release = 0
    const syncWithArrival = () => {
      const { dismissed, instant } = getArrival()
      window.clearTimeout(release)
      if (!dismissed) {
        lenis.stop()
        return
      }
      if (instant) {
        lenis.start()
        return
      }
      release = window.setTimeout(() => lenis.start(), REVEAL_WINDOWS.text[0])
    }
    syncWithArrival()
    const unsubscribeArrival = subscribeArrival(syncWithArrival)

    // Drive Lenis from GSAP's ticker so the two can never fall out of step.
    const tick = (seconds: number) => lenis.raf(seconds * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      unsubscribeArrival()
      window.clearTimeout(release)
      setLenis(null)
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
    }
  }, [enabled])
}
