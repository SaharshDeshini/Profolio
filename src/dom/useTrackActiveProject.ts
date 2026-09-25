import type { RefObject } from 'react'
import { setActiveProject } from '../state/activeProject.ts'
import { useCentreBand } from './useCentreBand.ts'

/** Reports which `[data-project-slug]` child of `listRef` is at the centre of the viewport, into `activeProject`. */
export function useTrackActiveProject(listRef: RefObject<HTMLElement | null>): void {
  useCentreBand(listRef, 'projectSlug', setActiveProject)
}
