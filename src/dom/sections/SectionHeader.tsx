interface SectionHeaderProps {
  /** Two-digit position, e.g. "02". Decorative: the heading carries the meaning. */
  readonly index: string
  readonly label: string
  readonly titleId: string
  readonly title: string
}

/**
 * A chapter opening: mono number and label, a hairline that draws itself in as
 * the section arrives, then the heading. The number is white, not cyan: colour
 * is kept for things that are active or emit light.
 */
export function SectionHeader({ index, label, titleId, title }: SectionHeaderProps) {
  return (
    <header className="chapter">
      <p className="label" aria-hidden="true">
        <span className="chapter__index">{index}</span> / {label}
      </p>
      <span className="rule chapter__rule" aria-hidden="true" />
      <h2 id={titleId} className="section-title">
        {title}
      </h2>
    </header>
  )
}
