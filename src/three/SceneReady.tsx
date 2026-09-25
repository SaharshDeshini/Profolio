import { useEffect } from 'react'
import { markArrivalReady } from '../state/arrival.ts'

/**
 * Renders nothing. Placed inside the Suspense boundary that holds the
 * character, so React only mounts it once everything in that boundary has
 * resolved. Two animation frames later the first real frame has been drawn,
 * which is the moment the arrival screen is allowed to lift.
 */
export function SceneReady() {
  useEffect(() => {
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(markArrivalReady)
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [])
  return null
}
