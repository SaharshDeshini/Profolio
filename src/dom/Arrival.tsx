import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { REDUCED_MOTION_QUERY } from '../layout.ts'
import { cameraReadout, focusReadout, formatReadout } from '../scroll/actOne.ts'
import { useSkipToContent } from '../scroll/useSkipToContent.ts'
import { REVEAL_WINDOWS } from '../scroll/reveal.ts'
import { dismissArrival, displayedProgress, getArrival, shouldDismiss } from '../state/arrival.ts'
import { useArrival } from '../state/useArrival.ts'
import { cameraFrameFor } from '../three/cameraPath.ts'

/** The veil layer of the opening (1600ms, matching the fade in arrival.css), plus a little margin. */
const LEAVE_MS = REVEAL_WINDOWS.veil[1] + 200

const toPercent = (value: number): number => Math.round(value * 100)

/**
 * Once focus lands, how long the final reading holds before the screen lifts:
 * long enough for the crossfade from "FOCUSING" to the lens reading to be seen.
 */
const FOCUS_HOLD_MS = 700

type ArrivalVars = CSSProperties & Record<'--p', number>

/** The viewfinder's frame for this window: the same one the Hero HUD reads, so the numbers hand over exactly. */
const viewFrame = () => cameraFrameFor(window.innerWidth, window.innerHeight)

/**
 * The camera finding focus while the 3D scene streams in behind it: a hairline
 * and a mono readout racking in from far out toward the opening shot
 * (`focusReadout`), landing on exactly the reading the viewfinder shows first,
 * rather than a percentage. The bar creeps just ahead of the real load
 * (see `displayedProgress`) rather than jumping in lumps, finishes only once
 * the scene has drawn its first real frame, and then the screen lifts away.
 * Nothing is trapped: Skip or Escape leaves at any moment, and after
 * MAX_VISIBLE_MS it leaves on its own.
 */
export function Arrival() {
  const { dismissed } = useArrival()
  const skip = useSkipToContent()
  const [gone, setGone] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const countRef = useRef<HTMLSpanElement>(null)
  // Read once: the frame loop owns these values after mount, and a
  // re-render must never write a stale store value back over them.
  const [initial] = useState(() => getArrival().progress)
  const initialPercent = toPercent(initial)
  const [initialVars] = useState<ArrivalVars>(() => ({ '--p': initial }))

  // One frame loop drives the bar and decides when to let the visitor in. It
  // writes the bar straight to the DOM, so a 60fps value never re-renders React.
  useEffect(() => {
    if (dismissed) return
    const startedAt = performance.now()
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches
    let shown = getArrival().progress
    let last = startedAt
    let raf = 0
    let focusedAt: number | null = null
    const frame = viewFrame()

    const tick = (now: number) => {
      const current = getArrival()
      shown = reduced ? current.progress : displayedProgress(shown, current.progress, current.ready, now - last)
      last = now
      const percent = toPercent(shown)
      dialogRef.current?.style.setProperty('--p', String(shown))
      trackRef.current?.setAttribute('aria-valuenow', String(percent))
      if (countRef.current) countRef.current.textContent = focusReadout(shown, frame)
      // Focus has landed: crossfade the readout (arrival.css) and hold it a moment.
      if (shown >= 1 && focusedAt === null) {
        focusedAt = now
        dialogRef.current?.setAttribute('data-focused', 'true')
      }
      const held = reduced || (focusedAt !== null && now - focusedAt >= FOCUS_HOLD_MS)
      if (shouldDismiss(current, now - startedAt, reduced, held ? shown : Math.min(shown, 0.999))) {
        dismissArrival(reduced)
        return
      }
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [dismissed])

  // Unmount once the fade has finished. A timer, not transitionend: reduced
  // motion collapses the transition and the event would never fire.
  useEffect(() => {
    if (!dismissed) return
    const id = window.setTimeout(() => setGone(true), LEAVE_MS)
    return () => window.clearTimeout(id)
  }, [dismissed])

  // While visible: no page scroll behind it, focus on the dialog itself
  // (not the skip button — that stays visually hidden until Tab reaches it),
  // Escape leaves.
  useEffect(() => {
    if (dismissed) return
    document.documentElement.classList.add('is-arriving')
    dialogRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') skip()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.documentElement.classList.remove('is-arriving')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [dismissed, skip])

  if (gone) return null

  return (
    <div
      ref={dialogRef}
      className="arrival"
      data-state={dismissed ? 'leaving' : 'visible'}
      role="dialog"
      aria-modal="true"
      aria-label="Introduction"
      tabIndex={-1}
      style={initialVars}
    >
      <div className="arrival__loader">
        <div
          ref={trackRef}
          className="arrival__track"
          role="progressbar"
          aria-label="Loading the scene"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={initialPercent}
        >
          <span className="arrival__fill" />
        </div>
        {/* Two readings stacked in one place, crossfaded when focus lands. */}
        <p className="label arrival__readout" aria-hidden="true">
          <span ref={countRef} className="arrival__count">
            {focusReadout(initial, viewFrame())}
          </span>
          <span className="arrival__lens">{formatReadout(cameraReadout(0, viewFrame()))}</span>
        </p>
      </div>

      <button type="button" className="arrival__skip label" onClick={skip}>
        Skip intro <kbd className="kbd">Esc</kbd>
      </button>
    </div>
  )
}
