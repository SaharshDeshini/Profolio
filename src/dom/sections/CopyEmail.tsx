import { useEffect, useState } from 'react'

const RESET_MS = 2200

type CopyState = 'idle' | 'copied' | 'failed'

interface CopyEmailProps {
  readonly email: string
}

/**
 * Copies the address, with a tactile confirmation and a live-region message
 * for screen readers. The mailto link beside it stays the primary action, so a
 * blocked clipboard costs nothing.
 */
export function CopyEmail({ email }: CopyEmailProps) {
  const [state, setState] = useState<CopyState>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const id = window.setTimeout(() => setState('idle'), RESET_MS)
    return () => window.clearTimeout(id)
  }, [state])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setState('copied')
    } catch {
      setState('failed')
    }
  }

  return (
    <>
      <button type="button" className="copy-button label" data-state={state} onClick={copy}>
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy'}
      </button>
      <span role="status" className="sr-only">
        {state === 'copied' ? 'Email address copied' : state === 'failed' ? 'Could not copy the email address' : ''}
      </span>
    </>
  )
}
