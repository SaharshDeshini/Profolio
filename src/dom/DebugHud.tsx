import { useEffect, useRef } from 'react'
import { progress } from '../scroll/progress.ts'

/**
 * Dev-only readout for tuning scroll feel. Writes straight to the DOM node:
 * no React state anywhere in the hot path.
 */
export function DebugHud() {
  const output = useRef<HTMLPreElement>(null)

  useEffect(() => {
    let frame = 0
    const paint = () => {
      const node = output.current
      if (node) {
        node.textContent =
          `raw     ${progress.raw.toFixed(4)}\n` +
          `smooth  ${progress.smooth.toFixed(4)}\n` +
          `scrollY ${Math.round(window.scrollY)}`
      }
      frame = requestAnimationFrame(paint)
    }
    frame = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(frame)
  }, [])

  return <pre ref={output} className="debug-hud" aria-hidden="true" data-testid="debug-hud" />
}
