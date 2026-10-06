import type { RefObject } from 'react'
import { GOOGLE_CLIENT_ID } from '../api/config'

interface Props {
  readonly buttonRef: RefObject<HTMLDivElement | null>
  readonly ready: boolean
}

export function GoogleSignInButton({ buttonRef, ready }: Props) {
  return (
    <div className="mb-5">
      {GOOGLE_CLIENT_ID ? (
        <div className="flex flex-col items-center gap-2">
          <div ref={buttonRef} className="flex min-h-10 w-full justify-center" />
          {!ready && <p className="text-xs text-ink-faint">Loading Google Sign-In…</p>}
        </div>
      ) : (
        <p className="rounded-lg border border-line bg-paper px-3 py-2 text-xs text-ink-faint">
          Google Sign-In is unavailable until <span className="font-mono">VITE_GOOGLE_CLIENT_ID</span> is set.
        </p>
      )}
      <div className="my-4 flex items-center gap-3 text-xs text-ink-faint">
        <div className="h-px flex-1 bg-line" />
        <span>or</span>
        <div className="h-px flex-1 bg-line" />
      </div>
    </div>
  )
}
