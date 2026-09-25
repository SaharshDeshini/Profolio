import { useEffect } from 'react'
import { dismissArrival } from '../state/arrival.ts'
import { snapProgress } from './progress.ts'

/**
 * A visitor who opens /project/<slug> directly came for that project, not for
 * the flight. So skip the arrival screen, start the story already docked, and
 * park the page at the project list: the overlay opens over the content it
 * belongs to, and closing it lands there rather than back at the top of Act 1.
 */
export function useDeepLinkStart(isDeepLink: boolean): void {
  useEffect(() => {
    if (!isDeepLink) return
    dismissArrival(true)
    snapProgress(1)
    document.getElementById('projects')?.scrollIntoView({ behavior: 'instant' })
  }, [isDeepLink])
}
