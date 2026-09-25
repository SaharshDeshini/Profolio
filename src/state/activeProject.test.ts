import { afterEach, describe, expect, it, vi } from 'vitest'
import { getActiveProject, setActiveProject, subscribeActiveProject } from './activeProject.ts'

afterEach(() => setActiveProject(null))

describe('activeProject', () => {
  it('starts with no project active', () => {
    expect(getActiveProject()).toBeNull()
  })

  it('holds the slug that was set, and clears back to null', () => {
    setActiveProject('project-one')
    expect(getActiveProject()).toBe('project-one')
    setActiveProject(null)
    expect(getActiveProject()).toBeNull()
  })

  it('tells subscribers when it changes, and only then', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeActiveProject(listener)

    setActiveProject('project-one')
    setActiveProject('project-one')
    expect(listener).toHaveBeenCalledTimes(1)

    setActiveProject('project-two')
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
  })

  it('stops telling a subscriber once it unsubscribes', () => {
    const listener = vi.fn()
    subscribeActiveProject(listener)()
    setActiveProject('project-one')
    expect(listener).not.toHaveBeenCalled()
  })

  it('lets a listener unsubscribe itself mid-notification without skipping the others', () => {
    const second = vi.fn()
    const unsubscribeFirst = subscribeActiveProject(() => unsubscribeFirst())
    const unsubscribeSecond = subscribeActiveProject(second)

    setActiveProject('project-one')
    expect(second).toHaveBeenCalledTimes(1)
    unsubscribeSecond()
  })
})
