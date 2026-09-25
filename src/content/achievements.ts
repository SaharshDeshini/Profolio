export interface Achievement {
  /** Stable key, kebab-case. */
  readonly id: string
  readonly title: string
  /** Who awarded or ran it, e.g. a hackathon, a company, a journal. */
  readonly issuer: string
  /** Four-digit year, printed large. Most recent first. */
  readonly year: string
  /** One line of context: what it was for, or what it took. */
  readonly note: string
}

// TODO(content): placeholder entries. Replace with real wins, awards, certifications or publications.
export const achievements: readonly Achievement[] = [
  {
    id: 'hackathon-win',
    title: 'Hackathon winner',
    issuer: 'Event Name',
    year: '2025',
    note: 'Add one line on what you built and what it won.',
  },
  {
    id: 'certification',
    title: 'Professional certification',
    issuer: 'Issuing Body',
    year: '2024',
    note: 'Add the certification and what it covers.',
  },
  {
    id: 'recognition',
    title: 'Award or recognition',
    issuer: 'Organisation',
    year: '2023',
    note: 'Add an optional one-liner here.',
  },
]
