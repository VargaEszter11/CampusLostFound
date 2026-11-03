import { useState } from 'react'
import type { Report } from '../domain/types'
import { useClaimSummaries, NO_CLAIMS } from '../hooks/useClaimSummaries'
import { useReportFilters, type ReportFilter } from '../hooks/useReportFilters'
import { isOwnerOf } from '../domain/rules'
import { ReportDetailsModal } from './ReportDetailsModal'
import { ReportFilters } from './ReportFilters'
import { ReportRow } from './ReportRow'

export type { ReportFilter } from '../hooks/useReportFilters'

interface Props {
  readonly reports: Report[]
  readonly filter: ReportFilter
  readonly onFilterChange: (filter: ReportFilter) => void
  readonly onReportChanged?: () => void
  readonly currentUser: string
  readonly currentUserId: string
  readonly currentUserEmail?: string
  readonly initialSelected?: Report | null
}

export function ReportListHeading({ count }: { readonly count?: number }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <h2 className="brand-display text-2xl text-ink">Open reports</h2>
      {count !== undefined && (
        <span className="rounded bg-teal-soft px-2.5 py-1 text-xs font-semibold text-teal">
          {count} {count === 1 ? 'report' : 'reports'}
        </span>
      )}
    </div>
  )
}

function emptyMessage(filter: ReportFilter, reports: Report[], currentUserId: string): string {
  const hasOwn = reports.some((r) => isOwnerOf(r, currentUserId))
  const hasOthers = reports.some((r) => !isOwnerOf(r, currentUserId))
  if (filter === 'MINE') {
    return hasOwn ? 'No reports match your filters.' : 'You have no open reports.'
  }
  return hasOthers ? 'No reports match your filters.' : 'No open reports from others.'
}

export function ReportList({
  reports,
  filter,
  onFilterChange,
  onReportChanged,
  currentUser,
  currentUserId,
  currentUserEmail,
  initialSelected = null,
}: Props) {
  const [selected, setSelected] = useState<Report | null>(initialSelected)
  const summaryByReport = useClaimSummaries(reports, currentUserId)
  const criteria = useReportFilters(reports, filter, currentUserId)

  return (
    <div>
      <ReportListHeading count={criteria.filtered.length} />
      <ReportFilters
        filter={filter}
        onFilterChange={onFilterChange}
        search={criteria.search}
        onSearchChange={criteria.setSearch}
        category={criteria.category}
        onCategoryChange={criteria.setCategory}
        dateFrom={criteria.dateFrom}
        dateTo={criteria.dateTo}
        onDateFromChange={criteria.changeDateFrom}
        onDateToChange={criteria.changeDateTo}
        hasExtraFilters={criteria.hasExtraFilters}
        onClearExtraFilters={criteria.clearExtraFilters}
      />

      {criteria.filtered.length === 0 ? (
        <p className="mt-6 text-ink-faint">{emptyMessage(filter, reports, currentUserId)}</p>
      ) : (
        <ul className="mt-2 border-t border-line">
          {criteria.filtered.map((r) => (
            <ReportRow
              key={r.id}
              report={r}
              summary={filter === 'MINE' ? (summaryByReport[r.id] ?? NO_CLAIMS) : NO_CLAIMS}
              isOwner={isOwnerOf(r, currentUserId)}
              onSelect={() => setSelected(r)}
              onDeleted={() => onReportChanged?.()}
            />
          ))}
        </ul>
      )}

      {selected && (
        <ReportDetailsModal
          report={selected}
          onClose={() => setSelected(null)}
          onReportChanged={onReportChanged}
          currentUser={currentUser}
          currentUserId={currentUserId}
          currentUserEmail={currentUserEmail}
        />
      )}
    </div>
  )
}
