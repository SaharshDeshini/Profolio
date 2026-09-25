import { useRef, type CSSProperties } from 'react'
import { profile } from '../content/profile.ts'
import { story } from '../content/story.ts'
import { CAPTIONS, type CaptionId } from '../scroll/actOne.ts'
import { useHeroFrame } from './useHeroFrame.ts'

/** Each caption's line of the story, from content/story.ts. */
const CAPTION_TEXT = Object.fromEntries(story.map((line) => [line.id, line.text])) as Record<CaptionId, string>

/**
 * The DOM layer of Act 1. The name resolves in as the lid-opening veil lifts
 * (see `headlineFrame`), then fades again as the camera pushes through, while
 * viewfinder readouts count the lens and distance and the story's four lines
 * pass by during the approach and the turn. All decorative: the layer is hidden from assistive tech
 * and the motto is provided as plain text.
 */
export function Hero() {
  const rootRef = useRef<HTMLDivElement>(null)
  useHeroFrame(rootRef)

  return (
    <>
      <div ref={rootRef} className="hero" aria-hidden="true">
        <div className="hero__frame" data-hero="frame">
          <span className="hero__corner hero__corner--tl" />
          <span className="hero__corner hero__corner--tr" />
          <span className="hero__corner hero__corner--bl" />
          <span className="hero__corner hero__corner--br" />
        </div>

        <div className="hero__top" data-hero="top">
          <p className="label">{profile.role}</p>
          <p className="label hero__readout" data-hero="readout" />
        </div>

        {CAPTIONS.map((caption, index) => (
          <div
            key={caption.id}
            className={`hero__caption hero__caption--${caption.side}`}
            data-caption={index}
          >
            <p className="hero__caption-text">{CAPTION_TEXT[caption.id]}</p>
          </div>
        ))}

        <div className="hero__bottom">
          <p className="hero__name display-line" data-hero="name">
            {profile.name.split(' ').map((word, index) => (
              <span key={`${word}-${index}`} className="hero__word" style={{ '--i': index } as CSSProperties}>
                {word}
              </span>
            ))}
          </p>
          <div className="hero__foot" data-hero="foot">
            <p className="label">{profile.motto}</p>
            <p className="label hero__cue">
              Scroll <span className="hero__cue-line" />
            </p>
          </div>
        </div>
      </div>
      {/* The visible copy is decorative; this is the page banner for assistive tech, inside a landmark. */}
      <header>
        <p className="sr-only">{profile.motto}</p>
      </header>
    </>
  )
}
