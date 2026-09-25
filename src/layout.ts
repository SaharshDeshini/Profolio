/**
 * At or below this width: a phone. It plays a shortened Act 1 with a light
 * render and native scrolling, and has no side band to dock into.
 */
export const MOBILE_MAX_WIDTH = 767

/** Below this width there is no room for a side band: the split collapses and content goes full width over the scene. */
export const SPLIT_MIN_WIDTH = 1024

/** Everything below the split width, phones and tablets. Act 1 gets a shorter runway here and the rig does not dock. */
export const COMPACT_MAX_WIDTH = SPLIT_MIN_WIDTH - 1

/**
 * Where the content column begins, as a fraction of viewport width. The docked
 * rig occupies the band to its left, so the CSS and `dock.ts` both read this.
 */
export const SPLIT_RATIO = 0.46

export const MOBILE_QUERY = `(max-width: ${MOBILE_MAX_WIDTH}px)`
export const COMPACT_QUERY = `(max-width: ${COMPACT_MAX_WIDTH}px)`
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
