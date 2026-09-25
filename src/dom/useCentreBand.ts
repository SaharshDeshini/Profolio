import { useEffect, type RefObject } from 'react'

/**
 * A child counts as "active" while it crosses a thin band through the middle
 * of the screen: the top and bottom 40% are cut off, leaving the middle 20%.
 */
const CENTRE_BAND = '-40% 0px -40% 0px'

/**
 * Reports which child of `listRef` carrying `data-<key>` is at the centre of
 * the viewport, as that attribute's value (or null when none is). An
 * IntersectionObserver rather than a scroll handler, so it only runs when a
 * child crosses the band and never touches the frame loop.
 *
 * `datasetKey` is the camelCase dataset name (`projectSlug` for
 * `data-project-slug`). `onChange` must be stable (a module setter or a
 * `useState` setter), or the observer is rebuilt every render.
 */
export function useCentreBand(
  listRef: RefObject<HTMLElement | null>,
  datasetKey: string,
  onChange: (value: string | null) => void,
): void {
  useEffect(() => {
    const list = listRef.current
    if (!list || typeof IntersectionObserver === 'undefined') return

    // The most recently entered child wins if two ever overlap the band at once.
    const inBand: string[] = []

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const value = (entry.target as HTMLElement).dataset[datasetKey]
          if (!value) continue
          const index = inBand.indexOf(value)
          if (entry.isIntersecting && index === -1) inBand.push(value)
          if (!entry.isIntersecting && index !== -1) inBand.splice(index, 1)
        }
        onChange(inBand[inBand.length - 1] ?? null)
      },
      { rootMargin: CENTRE_BAND },
    )

    const attribute = `data-${datasetKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
    list.querySelectorAll(`[${attribute}]`).forEach((child) => observer.observe(child))

    return () => {
      observer.disconnect()
      onChange(null)
    }
  }, [listRef, datasetKey, onChange])
}
