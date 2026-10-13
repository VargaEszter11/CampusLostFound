import { useState } from 'react'
import { formatDate } from '../domain/format'
import type { Report } from '../domain/types'
import type { ClaimSummary } from '../hooks/useClaimSummaries'
import { useDeleteReport } from '../hooks/useDeleteReport'

interface Props {
  readonly report: Report
  readonly summary: ClaimSummary
  readonly isOwner: boolean
  readonly onSelect: () => void
  readonly onDeleted: () => void
}

function TrashIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 7h12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m-9 0 1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function ReportRow({ report, summary, isOwner, onSelect, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false)
  const { deleting, error, remove } = useDeleteReport(onDeleted)

  return (
    <li>
      <div className="list-row group flex items-start justify-between gap-3">
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink group-hover:text-teal">{report.item.name}</span>
            <span className={report.type === 'LOST' ? 'badge-lost' : 'badge-found'}>
              {report.type === 'LOST' ? 'Lost' : 'Found'}
            </span>
            {report.item.category && <span className="chip">{report.item.category}</span>}
            {summary.pending > 0 && (
              <span className="rounded bg-warn-soft px-2 py-0.5 text-xs font-medium text-warn">
                {summary.pending} {summary.pending === 1 ? 'claim' : 'claims'} pending
              </span>
            )}
            {summary.inProgress && (
              <span className="rounded bg-teal/15 px-2 py-0.5 text-xs font-medium text-teal">
                Handover in progress
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-ink-muted">{report.location}</p>
          <p className="mt-0.5 text-xs text-ink-faint">{formatDate(report.date)}</p>
        </button>

        <div className="flex flex-col items-center gap-2 pt-1">
          <span aria-hidden className="text-ink-faint transition group-hover:text-teal">
            →
          </span>
          {isOwner &&
            (confirming ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    remove(report.id)
                  }}
                  disabled={deleting}
                  aria-label="Confirm delete"
                  className="text-danger hover:opacity-80 disabled:opacity-50"
                >
                  <CheckIcon />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirming(false)
                  }}
                  disabled={deleting}
                  aria-label="Cancel delete"
                  className="text-ink-faint hover:text-ink"
                >
                  <XIcon />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setConfirming(true)
                }}
                aria-label="Delete report"
                className="text-ink-faint transition hover:text-danger"
              >
                <TrashIcon />
              </button>
            ))}
        </div>
      </div>
      {error && <p className="px-0.5 pb-2 text-xs text-danger">{error}</p>}
    </li>
  )
}
