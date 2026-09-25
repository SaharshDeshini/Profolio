export interface EducationEntry {
  /** Shown in the system-style timeline, e.g. "EDU-02". Most recent first. */
  readonly code: string
  readonly institution: string
  readonly credential: string
  readonly period: string
  readonly note: string
}

// TODO(content): placeholder entries.
export const education: readonly EducationEntry[] = [
  {
    code: 'EDU-02',
    institution: 'University Name',
    credential: 'B.Tech, Computer Science',
    period: '2022 — 2026',
    note: 'Add focus areas, thesis or honours here.',
  },
  {
    code: 'EDU-01',
    institution: 'School Name',
    credential: 'Higher Secondary, Science',
    period: '2020 — 2022',
    note: 'Add an optional one-liner here.',
  },
]
