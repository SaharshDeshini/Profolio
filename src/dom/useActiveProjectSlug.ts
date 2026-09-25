import { useSyncExternalStore } from 'react'
import { getActiveProject, subscribeActiveProject } from '../state/activeProject.ts'

/** The slug of the project card at the centre of the screen, or null. Re-renders only when it changes. */
export function useActiveProjectSlug(): string | null {
  // No server snapshot: this app is client-rendered only.
  return useSyncExternalStore(subscribeActiveProject, getActiveProject)
}
