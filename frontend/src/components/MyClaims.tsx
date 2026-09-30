import { useEffect, useState } from 'react'
import type { Claim, Handover, Report } from '../domain/types'
import { getHandoverForReport, getMyClaims } from '../storage/claimStore'
import { getReport } from '../storage/reportStore'

interface ClaimRow {
  readonly claim: Claim
  readonly report: Report
  readonly handover?: Handover
}

const STATUS_STYLES: Record<Claim['status'], string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-300',
  APPROVED: 'bg-emerald-500/20 text-emerald-300',
  REJECTED: 'bg-red-500/20 text-red-300',
}

export function MyClaims() {
  const [rows, setRows] = useState<ClaimRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(undefined)

    void getMyClaims()
      .then(async (claims) => {
        const results = await Promise.all(
          claims.map(async (claim): Promise<ClaimRow | null> => {
            const report = await getReport(claim.reportId)
            if (!report) return null
            const handover =
              claim.status === 'APPROVED' ? await getHandoverForReport(report.id) : undefined
            return { claim, report, handover }
          }),
        )
        if (!cancelled) {
          setRows(results.filter((row): row is ClaimRow => row !== null))
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load claims')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <p className="text-gray-500">Loading claims…</p>
  }

  if (error) {
    return <p className="text-sm text-red-300">{error}</p>
  }

  if (rows.length === 0) {
    return <p className="text-gray-500">You haven&apos;t submitted any claims yet.</p>
  }

  return (
    <ul className="space-y-3">
      {rows.map(({ claim, report, handover }) => (
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
      ))}
    </ul>
  )
}
