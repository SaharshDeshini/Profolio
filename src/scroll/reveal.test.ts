import { describe, expect, it } from 'vitest'
import { REVEAL_TOTAL_MS, REVEAL_WINDOWS, revealAt, type RevealLayer } from './reveal.ts'

const ORDER: readonly RevealLayer[] = ['veil', 'model', 'spotlight', 'particles', 'text']

describe('revealAt', () => {
  it('reveals nothing before the arrival screen is dismissed', () => {
    for (const layer of ORDER) expect(revealAt(layer, null)).toBe(0)
  })

  it('reveals everything at once for a skipped or reduced-motion visitor', () => {
    for (const layer of ORDER) expect(revealAt(layer, 0, true)).toBe(1)
  })

  it('runs each layer from 0 at its start to 1 at its end', () => {
    for (const layer of ORDER) {
      const [start, end] = REVEAL_WINDOWS[layer]
      expect(revealAt(layer, start)).toBe(0)
      expect(revealAt(layer, end)).toBe(1)
      expect(revealAt(layer, (start + end) / 2)).toBeCloseTo(0.5, 5)
    }
  })

  it('builds the room in order: model, then spotlight, then particles, then text', () => {
    for (let i = 1; i < ORDER.length; i += 1) {
      const previous = REVEAL_WINDOWS[ORDER[i - 1] ?? 'veil']
      const current = REVEAL_WINDOWS[ORDER[i] ?? 'veil']
      expect(current[0]).toBeGreaterThan(previous[0])
    }
  })

  it('shows the model before the spotlight has started', () => {
    const spotlightStart = REVEAL_WINDOWS.spotlight[0]
    expect(revealAt('model', spotlightStart)).toBeGreaterThan(0.9)
    expect(revealAt('spotlight', spotlightStart)).toBe(0)
  })

  it('staggers a text element by its delay', () => {
    const mid = (REVEAL_WINDOWS.text[0] + REVEAL_WINDOWS.text[1]) / 2
    expect(revealAt('text', mid, false, 150)).toBeLessThan(revealAt('text', mid))
  })

  it('ends at the last layer', () => {
    expect(REVEAL_TOTAL_MS).toBe(REVEAL_WINDOWS.text[1])
  })
})
