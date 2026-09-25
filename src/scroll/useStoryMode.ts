import { MOBILE_QUERY, REDUCED_MOTION_QUERY } from '../layout.ts'
import { resolveStoryMode, type StoryMode } from './storyMode.ts'
import { useMediaQuery } from './useMediaQuery.ts'

let webglSupported: boolean | undefined

/** Probes once, then releases the probe's context so it does not count against the browser's limit. */
function detectWebGL(): boolean {
  if (webglSupported === undefined) {
    try {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
      webglSupported = context !== null
      context?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch {
      // A browser that throws on context creation has no usable WebGL: same answer as null.
      webglSupported = false
    }
  }
  return webglSupported
}

export function useStoryMode(): StoryMode {
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY)
  return resolveStoryMode({ isMobile, prefersReducedMotion, hasWebGL: detectWebGL() })
}
