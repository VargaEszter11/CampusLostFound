import { useEffect, useState } from 'react'
import type { Report, ReportType } from '../domain/types'
import { CATEGORIES } from '../domain/categories'
import { ReportDetailsModal } from './ReportDetailsModal'
import { DatePicker } from './DatePicker'
import { getClaimsForReport } from '../storage/claimStore'
import { isSameUser } from '../storage/authStore'

export type ReportFilter = ReportType | 'ALL' | 'MINE'
type CategoryFilter = 'ALL' | (typeof CATEGORIES)[number]

interface Props {
  readonly reports: Report[]
  readonly filter: ReportFilter
  readonly onFilterChange: (filter: ReportFilter) => void
  readonly onReportChanged?: () => void
  readonly currentUser: string
  readonly currentUserEmail?: string
  readonly initialSelected?: Report | null
}

const FILTER_OPTIONS: ReportFilter[] = ['ALL', 'LOST', 'FOUND', 'MINE']

const FILTER_LABELS: Record<ReportFilter, string> = {
  ALL: 'All',
  LOST: 'Lost',
  FOUND: 'Found',
  MINE: 'My reports',
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return DATE_FORMAT.format(d)
}

function matchesSearch(r: Report, search: string): boolean {
  const term = search.trim().toLowerCase()
  if (term === '') return true
  return [r.item.name, r.item.description, r.item.category, r.location, r.reporterName]
    .filter((field): field is string => Boolean(field))
    .some((field) => field.toLowerCase().includes(term))
}

interface ClaimSummary {
  readonly pending: number
  readonly inProgress: boolean
}

const NO_CLAIMS: ClaimSummary = { pending: 0, inProgress: false }

function ReportRow({
  report,
  summary,
  onSelect,
}: {
  readonly report: Report
  readonly summary: ClaimSummary
  readonly onSelect: () => void
}) {
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

export function ReportList({
  reports,
  filter,
  onFilterChange,
  onReportChanged,
  currentUser,
  currentUserEmail,
  initialSelected = null,
}: Props) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selected, setSelected] = useState<Report | null>(initialSelected)
  const [summaryByReport, setSummaryByReport] = useState<Record<string, ClaimSummary>>({})

  const hasExtraFilters = category !== 'ALL' || dateFrom !== '' || dateTo !== ''

  useEffect(() => {
    let cancelled = false
    const owned = reports.filter((r) => isSameUser(currentUser, r.reporterName))
    if (owned.length === 0) return

    void Promise.all(
      owned.map(async (r) => {
        const claims = await getClaimsForReport(r.id)
        const summary: ClaimSummary = {
          pending: claims.filter((c) => c.status === 'PENDING').length,
          inProgress: claims.some((c) => c.status === 'APPROVED'),
        }
        return [r.id, summary] as const
      }),
    )
      .then((entries) => {
        if (!cancelled) setSummaryByReport(Object.fromEntries(entries))
      })
      .catch(() => {
        if (!cancelled) setSummaryByReport({})
      })

    return () => {
      cancelled = true
    }
  }, [reports, currentUser])

  const filtered = reports
    .filter((r) => {
      const isMine = isSameUser(currentUser, r.reporterName)
      if (filter === 'MINE') return isMine
      if (isMine) return false
      return filter === 'ALL' || r.type === filter
    })
    .filter((r) => matchesSearch(r, search))
    .filter((r) => category === 'ALL' || r.item.category === category)
    .filter((r) => {
      if (dateFrom && r.date < dateFrom) return false
      if (dateTo && r.date > dateTo) return false
      return true
    })

  const emptyMessage =
    filter === 'MINE'
      ? reports.some((r) => isSameUser(currentUser, r.reporterName))
        ? 'No reports match your filters.'
        : 'You have no open reports.'
      : reports.some((r) => !isSameUser(currentUser, r.reporterName))
        ? 'No reports match your filters.'
        : 'No open reports from others.'

  return (
    <div>
      <div className="relative mb-4">
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-faint"
        >
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M17 17L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, description, location, or reporter…"
          aria-label="Search reports"
          className="field-input pl-9"
        />
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onFilterChange(option)}
            className={filter === option ? 'chip chip-active' : 'chip'}
          >
            {FILTER_LABELS[option]}
          </button>
        ))}
      </div>

      <div className="mb-4 mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="filterCategory" className="field-label">
            Category
          </label>
          <select
            id="filterCategory"
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryFilter)}
            className="field-input"
          >
            <option value="ALL">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filterDateFrom" className="field-label">
            From date
          </label>
          <DatePicker
            id="filterDateFrom"
            value={dateFrom}
            max={dateTo || todayIso()}
            onChange={(v) => {
              setDateFrom(v)
              if (dateTo && v && v > dateTo) setDateTo(v)
            }}
          />
        </div>
        <div>
          <label htmlFor="filterDateTo" className="field-label">
            To date
          </label>
          <DatePicker
            id="filterDateTo"
            value={dateTo}
            max={todayIso()}
            onChange={(v) => {
              setDateTo(v)
              if (dateFrom && v && v < dateFrom) setDateFrom(v)
            }}
          />
        </div>
      </div>

      {hasExtraFilters && (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => {
              setCategory('ALL')
              setDateFrom('')
              setDateTo('')
            }}
            className="text-xs font-medium text-teal hover:underline"
          >
            Clear category & date filters
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-6 text-ink-faint">{emptyMessage}</p>
      ) : (
        <ul className="mt-2 border-t border-line">
          {filtered.map((r) => (
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
