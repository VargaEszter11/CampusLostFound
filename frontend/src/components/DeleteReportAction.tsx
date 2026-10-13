import { useState } from 'react'
import { useDeleteReport } from '../hooks/useDeleteReport'

interface Props {
  readonly reportId: string
  readonly onDeleted: () => void
}

export function DeleteReportAction({ reportId, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false)
  const { deleting, error, remove } = useDeleteReport(onDeleted)

  return (
    <div className="mt-6 border-t border-line pt-4">
      {confirming ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-muted">Delete this report? This cannot be undone.</p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => remove(reportId)}
              disabled={deleting}
              className="rounded bg-danger-soft px-3 py-1.5 text-xs font-semibold text-danger hover:opacity-80 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="rounded px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-xs font-medium text-danger hover:underline"
        >
          Delete report
        </button>
      )}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  )
}
