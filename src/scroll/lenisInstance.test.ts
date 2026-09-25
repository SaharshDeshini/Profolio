import { describe, expect, it } from 'vitest'
import type Lenis from 'lenis'
import { getLenis, setLenis } from './lenisInstance.ts'

describe('lenisInstance', () => {
  it('holds and releases the live instance', () => {
    expect(getLenis()).toBeNull()
    const fake = {} as Lenis
    setLenis(fake)
    expect(getLenis()).toBe(fake)
    setLenis(null)
    expect(getLenis()).toBeNull()
  })
})
