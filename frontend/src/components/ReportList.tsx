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
  readonly currentUserEmail?: string
  readonly initialSelected?: Report | null
}

function emptyMessage(filter: ReportFilter, reports: Report[], currentUser: string): string {
  const hasOwn = reports.some((r) => isOwnerOf(r, currentUser))
  const hasOthers = reports.some((r) => !isOwnerOf(r, currentUser))
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
  currentUserEmail,
  initialSelected = null,
}: Props) {
  const [selected, setSelected] = useState<Report | null>(initialSelected)
  const summaryByReport = useClaimSummaries(reports, currentUser)
  const criteria = useReportFilters(reports, filter, currentUser)

  return (
    <div>
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
        <p className="mt-6 text-ink-faint">{emptyMessage(filter, reports, currentUser)}</p>
      ) : (
        <ul className="mt-2 border-t border-line">
          {criteria.filtered.map((r) => (
            <ReportRow
              key={r.id}
              report={r}
              summary={filter === 'MINE' ? (summaryByReport[r.id] ?? NO_CLAIMS) : NO_CLAIMS}
              onSelect={() => setSelected(r)}
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
          currentUserEmail={currentUserEmail}
        />
      )}
    </div>
  )
}
