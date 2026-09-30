import { useEffect, useState } from 'react'
import type { Report, ReportType } from '../domain/types'
import { ReportDetailsModal } from './ReportDetailsModal'
import { getClaimsForReport } from '../storage/claimStore'
import { isSameUser } from '../storage/authStore'

export type ReportFilter = ReportType | 'ALL' | 'MINE'

interface Props {
  readonly reports: Report[]
  readonly filter: ReportFilter
  readonly onFilterChange: (filter: ReportFilter) => void
  readonly onReportChanged?: () => void
  readonly currentUser: string
  readonly currentUserEmail?: string
}

const FILTER_OPTIONS: ReportFilter[] = ['ALL', 'LOST', 'FOUND', 'MINE']

const FILTER_LABELS: Record<ReportFilter, string> = {
  ALL: 'All',
  LOST: 'Lost',
  FOUND: 'Found',
  MINE: 'My reports',
}

function matchesSearch(r: Report, search: string): boolean {
  const term = search.trim().toLowerCase()
  if (term === '') return true
  return [r.item.name, r.item.description, r.item.category, r.location, r.reporterName]
    .filter((field): field is string => Boolean(field))
    .some((field) => field.toLowerCase().includes(term))
}

function ReportRow({
  report,
  pending,
  onSelect,
}: {
  readonly report: Report
  readonly pending: number
  readonly onSelect: () => void
}) {
  return (
    <li>
      <button
        onClick={onSelect}
        className="w-full rounded-xl border border-white/10 bg-neutral-900/60 p-4 text-left transition hover:border-white/20"
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white">{report.item.name}</span>
          <span
            className={
              report.type === 'LOST'
                ? 'rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-300'
                : 'rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-300'
            }
          >
            {report.type === 'LOST' ? 'Lost' : 'Found'}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          {report.item.category && (
            <span className="inline-block rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-gray-400">
              {report.item.category}
            </span>
          )}
          {pending > 0 && (
            <span className="inline-block rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-300">
              {pending} {pending === 1 ? 'claim' : 'claims'} pending
            </span>
          )}
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
}: Props) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Report | null>(null)
  const [pendingByReport, setPendingByReport] = useState<Record<string, number>>({})

  useEffect(() => {
    let cancelled = false
    const owned = reports.filter((r) => isSameUser(currentUser, r.reporterName))
    if (owned.length === 0) {
      setPendingByReport({})
      return
    }

    void Promise.all(
      owned.map(async (r) => {
        const claims = await getClaimsForReport(r.id)
        return [r.id, claims.filter((c) => c.status === 'PENDING').length] as const
      }),
    )
      .then((entries) => {
        if (!cancelled) setPendingByReport(Object.fromEntries(entries))
      })
      .catch(() => {
        if (!cancelled) setPendingByReport({})
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

  const emptyMessage =
    filter === 'MINE'
      ? reports.some((r) => isSameUser(currentUser, r.reporterName))
        ? 'No reports match your search.'
        : 'You have no open reports.'
      : reports.some((r) => !isSameUser(currentUser, r.reporterName))
        ? 'No reports match your search.'
        : 'No open reports from others.'

  return (
    <div>
      <div className="relative mb-4">
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500"
        >
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M17 17L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, description, location, or reporter…"
          aria-label="Search reports"
          className="w-full rounded-lg border border-white/10 bg-neutral-800/60 py-2 pr-3 pl-9 text-white placeholder-gray-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => onFilterChange(option)}
            className={
              filter === option
                ? 'rounded-full border border-white/40 px-3 py-1 text-sm font-medium text-white'
                : 'rounded-full border border-transparent bg-neutral-800 px-3 py-1 text-sm font-medium text-gray-400 hover:text-gray-200'
            }
          >
            {FILTER_LABELS[option]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => (
            <ReportRow
              key={r.id}
              report={r}
              pending={filter === 'MINE' ? (pendingByReport[r.id] ?? 0) : 0}
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
