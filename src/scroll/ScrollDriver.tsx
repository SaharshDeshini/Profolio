import { useFrame } from '@react-three/fiber'
import { dampProgress, SCROLL_DRIVER_PRIORITY } from './progress.ts'

/**
 * Turns `progress.raw` into `progress.smooth` once per frame, before anything
 * that reads it. The priority is negative on purpose; see `SCROLL_DRIVER_PRIORITY`.
 */
export function ScrollDriver() {
  useFrame((_state, delta) => dampProgress(delta), SCROLL_DRIVER_PRIORITY)
  return null
}
