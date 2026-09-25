export interface ProjectLink {
  readonly label: string
  readonly href: string
}

export interface CaseStudySection {
  readonly heading: string
  readonly body: string
}

export interface Project {
  /** URL-safe; becomes /project/<slug>. */
  readonly slug: string
  readonly title: string
  readonly tagline: string
  readonly year: string
  readonly role: string
  readonly summary: string
  readonly stack: readonly string[]
  readonly links: readonly ProjectLink[]
  /** The tint the room shifts toward while this project is on the laptop screen. Stay in the cyan family. */
  readonly mood: string
  /** A path under /public, or null to use the generated placeholder artwork. */
  readonly thumbnail: string | null
  readonly caseStudy: readonly CaseStudySection[]
}

/**
 * Case studies lead with the problem, because the motto says problems come
 * first. Problem -> Approach -> Build -> Outcome.
 */
const placeholderCaseStudy = (subject: string): readonly CaseStudySection[] => [
  {
    heading: 'Problem',
    body: `Describe what was broken, slow or missing before ${subject}, and who felt it.`,
  },
  { heading: 'Approach', body: 'Describe the options considered, and why this direction won.' },
  { heading: 'Build', body: 'Describe the interesting technical decisions, and what was hard.' },
  { heading: 'Outcome', body: 'Describe what changed, with a number if you have one.' },
]

// TODO(content): placeholder projects.
export const projects: readonly Project[] = [
  {
    slug: 'project-one',
    title: 'Project One',
    tagline: 'One line on what it does, and for whom.',
    year: '2026',
    role: 'Design & engineering',
    summary: 'Add two sentences here on the problem and the result.',
    stack: ['TypeScript', 'React', 'PostgreSQL'],
    links: [
      { label: 'Live', href: 'https://example.com' },
      { label: 'Source', href: 'https://github.com/your-handle/project-one' },
    ],
    mood: '#00e5ff',
    thumbnail: null,
    caseStudy: placeholderCaseStudy('Project One'),
  },
  {
    slug: 'project-two',
    title: 'Project Two',
    tagline: 'One line on what it does, and for whom.',
    year: '2025',
    role: 'Engineering',
    summary: 'Add two sentences here on the problem and the result.',
    stack: ['Python', 'FastAPI', 'Redis'],
    links: [{ label: 'Source', href: 'https://github.com/your-handle/project-two' }],
    mood: '#22d3ee',
    thumbnail: null,
    caseStudy: placeholderCaseStudy('Project Two'),
  },
  {
    slug: 'project-three',
    title: 'Project Three',
    tagline: 'One line on what it does, and for whom.',
    year: '2025',
    role: 'Research & engineering',
    summary: 'Add two sentences here on the problem and the result.',
    stack: ['Python', 'PyTorch', 'Docker'],
    links: [{ label: 'Live', href: 'https://example.com/three' }],
    mood: '#5ef2e0',
    thumbnail: null,
    caseStudy: placeholderCaseStudy('Project Three'),
  },
]
