import { useEffect, useState } from 'react'
import type { Claim } from '../domain/types'
import { isApproved } from '../domain/rules'
import { useMyClaims, type ClaimRow } from '../hooks/useMyClaims'

const STATUS_CLASS: Record<Claim['status'], string> = {
  PENDING: 'status-pending',
  APPROVED: 'status-approved',
  REJECTED: 'status-rejected',
}

const STATUS_LABEL: Record<Claim['status'], string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

const TABS: ReadonlyArray<{ status: Claim['status']; label: string }> = [
  { status: 'PENDING', label: 'Open' },
  { status: 'APPROVED', label: 'Approved' },
  { status: 'REJECTED', label: 'Rejected' },
]

interface Props {
  readonly focusClaimId?: string | null
}

export function MyClaims({ focusClaimId = null }: Props) {
  const { rows, loading, error } = useMyClaims()
  const [userTab, setUserTab] = useState<Claim['status'] | null>(null)
  const focusedStatus = focusClaimId ? rows.find((row) => row.claim.id === focusClaimId)?.claim.status : undefined
  const tab = userTab ?? focusedStatus ?? 'PENDING'

  useEffect(() => {
    if (!focusClaimId || loading) return
    document
      .getElementById(`claim-${focusClaimId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusClaimId, loading, rows, tab])

  if (loading) {
    return <p className="text-ink-faint">Loading claims…</p>
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>
  }

  if (rows.length === 0) {
    return <p className="text-ink-faint">You haven&apos;t submitted any claims yet.</p>
  }

  const tabRows = rows.filter((row) => row.claim.status === tab)

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {TABS.map(({ status, label }) => (
          <button
            key={status}
            type="button"
            onClick={() => setUserTab(status)}
            className={tab === status ? 'chip chip-active' : 'chip'}
          >
            {label} ({rows.filter((row) => row.claim.status === status).length})
          </button>
        ))}
      </div>

      {tabRows.length === 0 ? (
        <p className="text-ink-faint">No claims here.</p>
      ) : (
        <ul className="border-t border-line">
          {tabRows.map((row) => (
            <ClaimListItem key={row.claim.id} row={row} focusClaimId={focusClaimId} />
          ))}
        </ul>
      )}
    </div>
  )
}

function ClaimListItem({ row, focusClaimId }: { readonly row: ClaimRow; readonly focusClaimId: string | null }) {
  const { claim, report, handover } = row

  return (
    <li
      id={`claim-${claim.id}`}
      className={
        claim.id === focusClaimId
          ? 'rounded-lg border-b border-line bg-teal-soft/40 px-3 py-4 ring-1 ring-teal'
          : 'border-b border-line py-4'
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">{report.item.name}</span>
            <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[claim.status]}`}>
              {STATUS_LABEL[claim.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">{report.location}</p>
          <p className="mt-0.5 text-xs text-ink-faint">
            {report.type === 'LOST' ? 'Lost by' : 'Found by'} {report.reporterName}
          </p>
        </div>
      </div>

      {isApproved(claim) && handover && (
        <div className="info-callout mt-3 space-y-1 text-sm">
          <p>{report.reporterContact}</p>
          <p>
            Handover code: <span className="font-mono font-semibold">{handover.handoverCode}</span>
          </p>
          <p className="text-xs opacity-80">{handover.confirmed ? 'Handed over' : 'Awaiting handover'}</p>
        </div>
      )}
    </li>
  )
}
