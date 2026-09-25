import type { SectionId } from '../scroll/sections.ts'

type Listener = () => void

/**
 * Which Act 2 section is currently being read, or null before the first one
 * crosses the reading band.
 *
 * Discrete state only: it changes a few times per scroll, never per frame. So
 * it can safely be a subscribable value that React reads (via
 * useChapterIndex's IntersectionObserver), while the 3D layer reads the
 * getter directly inside useFrame and re-renders nothing.
 */
let active: SectionId | null = null
const listeners = new Set<Listener>()

export const getActiveSection = (): SectionId | null => active

export function setActiveSection(id: SectionId | null): void {
  if (id === active) return
  active = id
  // Copy first: a listener that unsubscribes itself must not disturb the walk.
  for (const listener of [...listeners]) listener()
}

/** Shaped for `useSyncExternalStore`: returns the unsubscribe function. */
export function subscribeActiveSection(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
