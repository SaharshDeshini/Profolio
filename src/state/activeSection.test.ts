import { afterEach, describe, expect, it, vi } from 'vitest'
import { getActiveSection, setActiveSection, subscribeActiveSection } from './activeSection.ts'

afterEach(() => setActiveSection(null))

describe('activeSection', () => {
  it('starts with no section active', () => {
    expect(getActiveSection()).toBeNull()
  })

  it('holds the id that was set, and clears back to null', () => {
    setActiveSection('skills')
    expect(getActiveSection()).toBe('skills')
    setActiveSection(null)
    expect(getActiveSection()).toBeNull()
  })

  it('tells subscribers when it changes, and only then', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeActiveSection(listener)

    setActiveSection('skills')
    setActiveSection('skills')
    expect(listener).toHaveBeenCalledTimes(1)

    setActiveSection('projects')
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
  })

  it('stops telling a subscriber once it unsubscribes', () => {
    const listener = vi.fn()
    subscribeActiveSection(listener)()
    setActiveSection('skills')
    expect(listener).not.toHaveBeenCalled()
  })

  it('lets a listener unsubscribe itself mid-notification without skipping the others', () => {
    const second = vi.fn()
    const unsubscribeFirst = subscribeActiveSection(() => unsubscribeFirst())
    const unsubscribeSecond = subscribeActiveSection(second)

    setActiveSection('skills')
    expect(second).toHaveBeenCalledTimes(1)
    unsubscribeSecond()
  })
})
