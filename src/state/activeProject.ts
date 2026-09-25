type Listener = () => void

/**
 * Which project card is at the centre of the viewport, or null when none is.
 *
 * Discrete state only: it changes when a card crosses the middle of the screen,
 * a few times per scroll, never per frame. So it can safely be a subscribable
 * value that React reads, while the 3D screen reads the getter directly
 * inside `useFrame` and re-renders nothing.
 */
let active: string | null = null
const listeners = new Set<Listener>()

export const getActiveProject = (): string | null => active

export function setActiveProject(slug: string | null): void {
  if (slug === active) return
  active = slug
  // Copy first: a listener that unsubscribes itself must not disturb the walk.
  for (const listener of [...listeners]) listener()
}

/** Shaped for `useSyncExternalStore`: returns the unsubscribe function. */
export function subscribeActiveProject(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
