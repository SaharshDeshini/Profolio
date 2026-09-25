/**
 * - `cinematic`: full Act 1 with camera flight, Lenis and the side-band dock.
 * - `mobile`: a phone. A shortened Act 1 with a light render, native scrolling and no dock.
 * - `reduced`: prefers-reduced-motion. Straight to the end state, no flight.
 * - `static`: no WebGL, or the scene failed. Content only, no canvas.
 */
export type StoryMode = 'cinematic' | 'reduced' | 'mobile' | 'static'

export interface StoryEnvironment {
  readonly isMobile: boolean
  readonly prefersReducedMotion: boolean
  readonly hasWebGL: boolean
}

/**
 * No WebGL wins over everything: nothing else matters if there is nothing to
 * render. Reduced motion wins over the phone layout, because a phone plays a
 * camera flight and must not play one for someone who asked for none.
 */
export function resolveStoryMode({
  isMobile,
  prefersReducedMotion,
  hasWebGL,
}: StoryEnvironment): StoryMode {
  if (!hasWebGL) return 'static'
  if (prefersReducedMotion) return 'reduced'
  if (isMobile) return 'mobile'
  return 'cinematic'
}

/** Cinematic and mobile both play Act 1, so both keep the runway it scrolls through. */
export const playsActOne = (mode: StoryMode): boolean => mode === 'cinematic' || mode === 'mobile'
