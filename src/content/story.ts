/**
 * The short story told over Act 1's camera flight: one line per beat, from the
 * slow approach on a closed laptop, round the turn, to the lid opening. Read
 * in order they should say how you work, not list what is on the site.
 *
 * TODO(content): placeholder wording. Keep each line under ~70 characters so
 * it reads in the time the camera spends on its beat.
 */
export interface StoryLine {
  readonly id: 'approach' | 'turn' | 'side' | 'open'
  /** The beat's name. An authoring note only: the site shows just the line itself. */
  readonly title: string
  readonly text: string
}

export const story: readonly StoryLine[] = [
  { id: 'approach', title: 'The approach', text: 'Every project starts the same way: something closed, and a question.' },
  { id: 'turn', title: 'The turn', text: 'I walk around a problem before I touch it.' },
  { id: 'side', title: 'The other side', text: 'Most answers are on the side nobody looked at first.' },
  { id: 'open', title: 'The open', text: 'Then I open it up and build.' },
]
