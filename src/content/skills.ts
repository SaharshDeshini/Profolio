export interface SkillGroup {
  readonly id: 'ai' | 'software' | 'systems' | 'tools'
  readonly title: string
  readonly items: readonly string[]
}

// TODO(content): placeholder skills. Keep each group short; the section is meant to be scanned.
export const skillGroups: readonly SkillGroup[] = [
  {
    id: 'ai',
    title: 'AI',
    items: ['LLM applications', 'Retrieval & RAG', 'Evaluation', 'Agents & tool use'],
  },
  {
    id: 'software',
    title: 'Software',
    items: ['TypeScript', 'React', 'Python', 'Product engineering'],
  },
  {
    id: 'systems',
    title: 'Backend / Systems',
    items: ['API design', 'Databases', 'Queues & pipelines', 'Observability'],
  },
  {
    id: 'tools',
    title: 'Tools & tech',
    items: ['Git', 'Docker', 'Linux', 'CI/CD'],
  },
]
