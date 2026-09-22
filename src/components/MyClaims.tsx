import type { Claim, Report } from '../domain/types'
import { getClaimsByClaimant, getHandoverForReport } from '../storage/claimStore'
import { getReport } from '../storage/reportStore'

interface Props {
  readonly currentUser: string
}

interface ClaimRow {
  readonly claim: Claim
  readonly report: Report
}

const STATUS_STYLES: Record<Claim['status'], string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-300',
  APPROVED: 'bg-emerald-500/20 text-emerald-300',
  REJECTED: 'bg-red-500/20 text-red-300',
}

export function MyClaims({ currentUser }: Props) {
  const rows: ClaimRow[] = getClaimsByClaimant(currentUser)
    .map((claim) => {
      const report = getReport(claim.reportId)
      return report ? { claim, report } : null
    })
    .filter((row): row is ClaimRow => row !== null)

  if (rows.length === 0) {
    return <p className="text-gray-500">You haven&apos;t submitted any claims yet.</p>
  }

  return (
    <ul className="space-y-3">
      {rows.map(({ claim, report }) => {
        const handover = claim.status === 'APPROVED' ? getHandoverForReport(report.id) : undefined
        return (
          <li key={claim.id} className="rounded-xl border border-white/10 bg-neutral-900/60 p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">{report.item.name}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[claim.status]}`}>
                {claim.status === 'PENDING' ? 'Pending' : claim.status === 'APPROVED' ? 'Approved' : 'Rejected'}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {report.type === 'LOST' ? 'Lost by' : 'Found by'} {report.reporterName}
            </p>

            {claim.status === 'APPROVED' && handover && (
              <div className="mt-3 space-y-1 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                <p className="text-sm text-blue-200">✉️ {report.reporterContact}</p>
                <p className="text-sm text-blue-200">
                  Handover code: <span className="font-mono font-semibold">{handover.handoverCode}</span>
                </p>
                <p className="text-xs text-blue-300">{handover.confirmed ? 'Handed over' : 'Awaiting handover'}</p>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
