import { useEffect } from 'react'
import type { Claim } from '../domain/types'
import { isApproved } from '../domain/rules'
import { useMyClaims } from '../hooks/useMyClaims'

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

interface Props {
  readonly focusClaimId?: string | null
}

export function MyClaims({ focusClaimId = null }: Props) {
  const { rows, loading, error } = useMyClaims()

  useEffect(() => {
    if (!focusClaimId || loading) return
    document
      .getElementById(`claim-${focusClaimId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusClaimId, loading, rows])

  if (loading) {
    return <p className="text-ink-faint">Loading claims…</p>
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>
  }

  if (rows.length === 0) {
    return <p className="text-ink-faint">You haven&apos;t submitted any claims yet.</p>
  }

  return (
    <ul className="border-t border-line">
      {rows.map(({ claim, report, handover }) => (
        <li
          key={claim.id}
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
      ))}
    </ul>
  )
}
