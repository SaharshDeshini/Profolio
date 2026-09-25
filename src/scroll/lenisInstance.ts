import type Lenis from 'lenis'

/**
 * The live Lenis instance, so code outside the hook (skip-to-content) can stop,
 * start and jump it. Lenis stays the only scroll smoother; this is only a handle.
 */
let current: Lenis | null = null

export const getLenis = (): Lenis | null => current

export function setLenis(instance: Lenis | null): void {
  current = instance
}
