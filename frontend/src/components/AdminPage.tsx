import { useMemo, useState } from 'react'
import { CATEGORIES } from '../domain/categories'
import { formatDate } from '../domain/format'
import type { AdminReport, ReportStatus, ReportType } from '../domain/types'
import { useAdminReports } from '../hooks/useAdminReports'

type TypeFilter = 'ALL' | ReportType
type StatusFilter = 'ALL' | ReportStatus

const TYPE_LABELS: Record<TypeFilter, string> = { ALL: 'All types', LOST: 'Lost', FOUND: 'Found' }
const STATUS_LABELS: Record<StatusFilter, string> = { ALL: 'Any status', OPEN: 'Open', CLOSED: 'Closed' }

interface Props {
  readonly onBack: () => void
}

export function AdminPage({ onBack }: Props) {
  const { reports, loading, error, refresh } = useAdminReports()
  const [search, setSearch] = useState('')
  const [type, setType] = useState<TypeFilter>('ALL')
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [category, setCategory] = useState('ALL')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reports.filter(
      (r) =>
        (type === 'ALL' || r.type === type) &&
        (status === 'ALL' || r.status === status) &&
        (category === 'ALL' || r.item.category === category) &&
        (!q || searchText(r).includes(q)),
    )
  }, [reports, search, type, status, category])

  const openCount = reports.filter((r) => r.status === 'OPEN').length
  const stats = [
    { label: 'Total', value: reports.length },
    { label: 'Open', value: openCount },
    { label: 'Closed', value: reports.length - openCount },
    { label: 'Handed over', value: reports.filter((r) => r.handover?.confirmed).length },
  ]

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-ink-muted underline-offset-2 hover:text-teal hover:underline"
          >
            ← Back to app
          </button>
          <h1 className="brand-display mt-3 text-4xl text-ink">Admin</h1>
          <p className="mt-2 text-base text-ink-muted">Every lost and found report, including closed ones.</p>
        </div>
        <button type="button" onClick={() => void refresh()} className="btn-secondary shrink-0" disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="surface-panel !p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">{s.label}</dt>
            <dd className="mt-1 text-2xl font-semibold text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search item, location, reporter, claimant, handover code…"
        aria-label="Search all reports"
        className="field-input mb-3"
      />
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select value={type} onChange={(e) => setType(e.target.value as TypeFilter)} className="field-input" aria-label="Type">
          {(Object.keys(TYPE_LABELS) as TypeFilter[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="field-input"
          aria-label="Status"
        >
          {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="field-input" aria-label="Category">
          <option value="ALL">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}
      {loading && reports.length === 0 ? (
        <p className="text-ink-faint">Loading reports…</p>
      ) : filtered.length === 0 ? (
        <p className="text-ink-faint">No reports match these filters.</p>
      ) : (
        <>
          <p className="mb-2 text-xs text-ink-faint">
            Showing {filtered.length} of {reports.length}
          </p>
          <ul className="border-t border-line">
            {filtered.map((r) => (
              <AdminReportRow key={r.id} report={r} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function AdminReportRow({ report: r }: { readonly report: AdminReport }) {
  return (
    <li className="border-b border-line py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-ink">{r.item.name}</span>
        <span className={r.type === 'LOST' ? 'badge-lost' : 'badge-found'}>{r.type === 'LOST' ? 'Lost' : 'Found'}</span>
        <span
          className={
            r.status === 'OPEN'
              ? 'rounded px-2 py-0.5 text-xs font-semibold status-pending'
              : 'rounded px-2 py-0.5 text-xs font-semibold status-approved'
          }
        >
          {r.status === 'OPEN' ? 'Open' : 'Closed'}
        </span>
        {r.item.category && <span className="chip">{r.item.category}</span>}
      </div>
      {r.item.description && <p className="mt-1.5 text-sm text-ink-muted">{r.item.description}</p>}

      <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <Field label="Location" value={r.location} />
        <Field label="Date" value={formatDate(r.date)} />
        <Field label="Reporter" value={`${r.reporterName} · ${r.reporterEmail}`} />
        <Field label="Contact" value={r.reporterContact} />
        <Field
          label="Claims"
          value={r.pendingClaimCount > 0 ? `${r.claimCount} (${r.pendingClaimCount} pending)` : String(r.claimCount)}
        />
        <Field label="Reported" value={new Date(r.createdAt).toLocaleString()} />
      </dl>

      {r.handover && (
        <div className="info-callout mt-3 space-y-1 text-sm">
          <p>
            {r.handover.confirmed ? 'Handed over' : 'Awaiting handover'} to {r.handover.claimantName} ·{' '}
            {r.handover.claimantEmail}
            {r.handover.claimantContact !== r.handover.claimantEmail && <> · {r.handover.claimantContact}</>}
          </p>
          <p>
            Code: <span className="font-mono font-semibold">{r.handover.handoverCode}</span>
            {r.handover.confirmedAt && (
              <span className="text-xs opacity-80"> · confirmed {new Date(r.handover.confirmedAt).toLocaleString()}</span>
            )}
          </p>
        </div>
      )}
    </li>
  )
}

function Field({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex min-w-0 gap-2">
      <dt className="shrink-0 text-ink-faint">{label}</dt>
      <dd className="min-w-0 break-words text-ink-muted">{value}</dd>
    </div>
  )
}

function searchText(r: AdminReport): string {
  return [
    r.item.name,
    r.item.description,
    r.item.category,
    r.location,
    r.reporterName,
    r.reporterEmail,
    r.reporterContact,
    r.handover?.claimantName,
    r.handover?.claimantEmail,
    r.handover?.handoverCode,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}
