import { useEffect, type RefObject } from 'react'
import {
  CAPTIONS,
  HEADLINE_LIFT_VH,
  HERO_HIDDEN_AFTER,
  cameraReadout,
  captionOpacity,
  cueOpacity,
  formatReadout,
  headlineFrame,
  readoutOpacity,
} from '../scroll/actOne.ts'
import { progress } from '../scroll/progress.ts'
import { TEXT_STAGGER_MS } from '../scroll/reveal.ts'
import { revealNow } from '../state/arrival.ts'
import { cameraFrameFor } from '../three/cameraPath.ts'

/** Below this change in progress nothing visible would move, so the frame is skipped. */
const EPSILON = 1e-4

/** Pixels a caption drifts while fading, so it settles into place rather than just appearing. */
const CAPTION_DRIFT_PX = 14

/**
 * Drives the Act 1 DOM layer from the story scalar. It writes styles straight
 * to elements (transform and opacity only, no layout) instead of going through
 * React state: this changes every frame of a scroll and must never re-render.
 * The loop idles when the scalar is still, and the layer is hidden once Act 1
 * is over.
 */
export function useHeroFrame(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const name = root.querySelector<HTMLElement>('[data-hero="name"]')
    const top = root.querySelector<HTMLElement>('[data-hero="top"]')
    const foot = root.querySelector<HTMLElement>('[data-hero="foot"]')
    const readout = root.querySelector<HTMLElement>('[data-hero="readout"]')
    const frame = root.querySelector<HTMLElement>('[data-hero="frame"]')
    const captions = CAPTIONS.map((_, index) =>
      root.querySelector<HTMLElement>(`[data-caption="${index}"]`),
    )

    let lastProgress = Number.NaN
    let lastReadout = ''
    let raf = 0

    // The last layer of the opening: name first, then the readouts, then the
    // scroll cue, each multiplied into its scroll-driven opacity so the two
    // never fight over the same style.
    let revealed = 0
    const apply = (p: number) => {
      root.style.visibility = p > HERO_HIDDEN_AFTER ? 'hidden' : 'visible'
      const now = performance.now()
      const nameIn = revealNow('text', now)
      const chromeIn = revealNow('text', now, TEXT_STAGGER_MS)
      const cueIn = revealNow('text', now, TEXT_STAGGER_MS * 2)
      revealed = cueIn

      if (name) {
        const headline = headlineFrame(p)
        name.style.opacity = String(headline.opacity * nameIn)
        name.style.transform = `translate3d(0, ${-headline.lift * HEADLINE_LIFT_VH + (1 - nameIn) * 1.5}vh, 0) scale(${headline.scale})`
      }
      if (top) top.style.opacity = String(chromeIn)
      if (foot) foot.style.opacity = String(cueOpacity(p) * cueIn)

      const chrome = readoutOpacity(p)
      if (frame) frame.style.opacity = String(chrome * chromeIn)
      if (readout) {
        readout.style.opacity = String(chrome)
        const viewFrame = cameraFrameFor(window.innerWidth, window.innerHeight)
        const text = formatReadout(cameraReadout(p, viewFrame))
        if (text !== lastReadout) {
          readout.textContent = text
          lastReadout = text
        }
      }

      CAPTIONS.forEach((caption, index) => {
        const element = captions[index]
        if (!element) return
        const opacity = captionOpacity(p, caption.range)
        element.style.opacity = String(opacity)
        element.style.transform = `translate3d(0, ${(1 - opacity) * CAPTION_DRIFT_PX}px, 0)`
      })
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const p = progress.smooth
      // Still scroll, and the opening has finished: nothing can have moved.
      if (Math.abs(p - lastProgress) < EPSILON && revealed >= 1) return
      lastProgress = p
      apply(p)
    }

    apply(progress.smooth)
    lastProgress = progress.smooth
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [rootRef])
}
