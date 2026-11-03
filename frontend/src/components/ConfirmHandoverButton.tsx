import { useState } from 'react'

interface Props {
  readonly onConfirm: () => void
  readonly className?: string
}

export function ConfirmHandoverButton({ onConfirm, className = '' }: Props) {
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={`btn-primary ${className}`}>
        Mark as handed over
      </button>
    )
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <p className="text-sm">Has the item really changed hands? This closes the report and cannot be undone.</p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => {
            setConfirming(false)
            onConfirm()
          }}
          className="btn-primary"
        >
          Yes, handed over
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
