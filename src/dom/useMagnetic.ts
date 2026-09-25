import { useEffect, type RefObject } from 'react'
import { REDUCED_MOTION_QUERY } from '../layout.ts'

/** A fine pointer (mouse, trackpad). A finger has nothing to be attracted to before it lands. */
const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'

/**
 * Pulls an element a little way toward the pointer while it is over it, and
 * lets it settle back when the pointer leaves. Writes `--mx`/`--my` (px) for
 * the CSS to turn into a transform, so the motion stays on the compositor and
 * the easing lives in the stylesheet. Off for touch and for reduced motion.
 *
 * `strength` is the share of the pointer's offset from the centre the element
 * follows: 0.2 means it moves a fifth of the way toward the pointer.
 */
export function useMagnetic(ref: RefObject<HTMLElement | null>, strength = 0.18): void {
  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (!window.matchMedia(FINE_POINTER_QUERY).matches) return
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return

    const onMove = (event: PointerEvent) => {
      const box = element.getBoundingClientRect()
      const dx = event.clientX - (box.left + box.width / 2)
      const dy = event.clientY - (box.top + box.height / 2)
      element.style.setProperty('--mx', `${(dx * strength).toFixed(2)}px`)
      element.style.setProperty('--my', `${(dy * strength).toFixed(2)}px`)
    }
    const onLeave = () => {
      element.style.setProperty('--mx', '0px')
      element.style.setProperty('--my', '0px')
    }

    element.addEventListener('pointermove', onMove)
    element.addEventListener('pointerleave', onLeave)
    return () => {
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerleave', onLeave)
      onLeave()
    }
  }, [ref, strength])
}
