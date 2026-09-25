export interface SocialLink {
  readonly label: string
  readonly href: string
}

export interface Profile {
  readonly name: string
  readonly role: string
  /** The short identity line under the name. */
  readonly identity: string
  /** A short paragraph under the identity line. Two or three sentences. */
  readonly about: string
  /** "AI + Software + Building", one word each. */
  readonly pillars: readonly string[]
  readonly motto: string
  readonly closing: string
  /** Where you are based, as it should read in the facts row. */
  readonly location: string
  /** One short phrase on what you are open to. */
  readonly availability: string
  /** A path under /public (e.g. '/resume.pdf'), or null to hide the resume link. */
  readonly resume: string | null
  readonly email: string
  readonly links: readonly SocialLink[]
}

// TODO(content): every value below is a placeholder except the pillars.
export const profile: Profile = {
  name: 'Your Name',
  role: 'AI & Software Engineer',
  identity: 'I build intelligent systems, and the software around them.',
  about:
    'Add two or three sentences here on what you build, what you care about, and what you are looking for next.',
  pillars: ['AI', 'Software', 'Building'],
  motto: 'Problems come first. Code later.',
  closing: "If there's a problem worth solving, let's talk.",
  location: 'City, Country',
  availability: 'Open to opportunities',
  resume: null,
  email: 'hello@example.com',
  links: [
    { label: 'GitHub', href: 'https://github.com/your-handle' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/your-handle' },
  ],
}
