import { formatDate } from '../domain/format'
import type { Report } from '../domain/types'
import type { ClaimSummary } from '../hooks/useClaimSummaries'

interface Props {
  readonly report: Report
  readonly summary: ClaimSummary
  readonly onSelect: () => void
}

export function ReportRow({ report, summary, onSelect }: Props) {
  return (
    <li>
      <button type="button" onClick={onSelect} className="list-row group">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
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
          </div>
          <span aria-hidden className="mt-1 text-ink-faint transition group-hover:text-teal">
            →
          </span>
        </div>
      </button>
    </li>
  )
}
