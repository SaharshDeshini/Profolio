import { SECTION_IDS, type SectionId } from './sections.ts'

export const CHAPTER_LABELS: Readonly<Record<SectionId, string>> = {
  intro: 'About',
  skills: 'Skills',
  projects: 'Projects',
  achievements: 'Achievements',
  education: 'Education',
  connect: 'Connect',
}

export interface Chapter {
  readonly id: SectionId
  /** Two digits, "01" onwards: the number printed on the chapter opening and the index. */
  readonly index: string
  readonly label: string
}

const twoDigits = (n: number): string => String(n).padStart(2, '0')

/** In page order, so the section headers and the side index can never disagree about the numbering. */
export const CHAPTERS: readonly Chapter[] = SECTION_IDS.map((id, position) => ({
  id,
  index: twoDigits(position + 1),
  label: CHAPTER_LABELS[id],
}))

export function chapterIndex(id: SectionId): string {
  return CHAPTERS.find((chapter) => chapter.id === id)?.index ?? ''
}

/**
 * Of the sections currently crossing the reading band, the last in page order
 * wins: scrolling down, the section you are entering takes over from the one
 * you are leaving. `null` when none are, so callers can keep the previous one.
 */
export function pickActiveChapter(visible: ReadonlySet<string>): SectionId | null {
  let active: SectionId | null = null
  for (const id of SECTION_IDS) {
    if (visible.has(id)) active = id
  }
  return active
}
