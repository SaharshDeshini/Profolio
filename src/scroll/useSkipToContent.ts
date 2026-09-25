import { useCallback } from 'react'
import { dismissArrival } from '../state/arrival.ts'
import { getLenis } from './lenisInstance.ts'
import { snapProgress } from './progress.ts'

/**
 * Lets the visitor past Act 1: closes the arrival screen, jumps to the intro
 * and snaps the story to its docked end so the camera does not visibly rush
 * through the whole flight to catch up.
 */
export function useSkipToContent(): () => void {
  return useCallback(() => {
    dismissArrival(true)
    snapProgress(1)
    const target = document.getElementById('intro')
    if (!target) return
    const lenis = getLenis()
    if (lenis) {
      lenis.scrollTo(target, { immediate: true, force: true })
    } else {
      target.scrollIntoView({ behavior: 'instant' })
    }
  }, [])
}
