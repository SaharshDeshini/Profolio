import type { Project } from '../../content/projects.ts'

interface ProjectThumbProps {
  readonly project: Pick<Project, 'slug' | 'mood' | 'thumbnail'>
}

/**
 * The card artwork. Uses the project's own image when there is one; otherwise
 * draws a placeholder from the project's tint, so an empty slot never looks broken.
 * Purely decorative: the card's text already names the project.
 */
export function ProjectThumb({ project }: ProjectThumbProps) {
  if (project.thumbnail) {
    return <img className="project-thumb" src={project.thumbnail} alt="" loading="lazy" decoding="async" />
  }

  const glow = `glow-${project.slug}`
  return (
    <svg className="project-thumb" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id={glow} cx="50%" cy="115%" r="90%">
          <stop offset="0%" stopColor={project.mood} stopOpacity="0.55" />
          <stop offset="100%" stopColor={project.mood} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="#070809" />
      <rect width="320" height="200" fill={`url(#${glow})`} />
      <g stroke="#f6f6f4" strokeOpacity="0.08" strokeWidth="1">
        {[40, 80, 120, 160].map((y) => (
          <line key={`h${y}`} x1="0" x2="320" y1={y} y2={y} />
        ))}
        {[64, 128, 192, 256].map((x) => (
          <line key={`v${x}`} x1={x} x2={x} y1="0" y2="200" />
        ))}
      </g>
      <rect x="112" y="64" width="96" height="64" rx="4" fill="none" stroke={project.mood} strokeOpacity="0.7" />
      <rect x="120" y="72" width="80" height="48" rx="2" fill={project.mood} fillOpacity="0.12" />
    </svg>
  )
}
