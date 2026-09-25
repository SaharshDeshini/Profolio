import { useCallback, useEffect, useState, type RefObject } from 'react'
import { REDUCED_MOTION_QUERY } from '../layout.ts'
import { pickActiveChapter } from '../scroll/chapters.ts'
import { getLenis } from '../scroll/lenisInstance.ts'
import { progress } from '../scroll/progress.ts'
import { SECTION_IDS, type SectionId } from '../scroll/sections.ts'
import { setActiveSection } from '../state/activeSection.ts'

/** A thin band through the middle of the screen: the section crossing it is the one being read. */
const READING_BAND = '-45% 0px -50% 0px'

/** The index appears once the rig has docked, so it never competes with the flight. */
const VISIBLE_AFTER = 0.9

/** Which section is being read. Uses an IntersectionObserver, so it costs nothing per frame. */
export function useActiveSection(): SectionId {
  const [active, setActive] = useState<SectionId>(SECTION_IDS[0])

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        const next = pickActiveChapter(visible)
        if (next) {
          setActive(next)
          setActiveSection(next)
          document.body.dataset.section = next
        }
      },
      { rootMargin: READING_BAND },
    )
    for (const id of SECTION_IDS) {
      const section = document.getElementById(id)
      if (section) observer.observe(section)
    }
    return () => observer.disconnect()
  }, [])

  return active
}

/** Shows the index once Act 1 is over (immediately where there is no Act 1: progress is snapped to 1 there). */
export function useRevealAfterDock(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const element = ref.current
    if (!element) return
    let raf = 0
    let shown: boolean | null = null
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const visible = progress.smooth >= VISIBLE_AFTER
      if (visible === shown) return
      shown = visible
      element.dataset.visible = String(visible)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [ref])
}

/** Jumps to a section with Lenis when it is running, and with the browser's own scrolling otherwise. */
export function useJumpToSection(): (id: SectionId) => void {
  return useCallback((id) => {
    const target = document.getElementById(id)
    if (!target) return
    const lenis = getLenis()
    if (lenis) {
      lenis.scrollTo(target, { offset: 0 })
      return
    }
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches
    target.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' })
  }, [])
}
