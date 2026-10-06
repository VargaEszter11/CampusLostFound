import { useEffect, useState } from 'react'
import type { Report } from '../domain/types'
import { isApproved, isOwnerOf, isPending } from '../domain/rules'
import { getClaimsForReport } from '../services/claimStore'

export interface ClaimSummary {
  readonly pending: number
  readonly inProgress: boolean
}

export const NO_CLAIMS: ClaimSummary = { pending: 0, inProgress: false }

export function useClaimSummaries(reports: Report[], currentUser: string): Record<string, ClaimSummary> {
  const [summaryByReport, setSummaryByReport] = useState<Record<string, ClaimSummary>>({})

  useEffect(() => {
    let cancelled = false
    const owned = reports.filter((r) => isOwnerOf(r, currentUser))
    if (owned.length === 0) return

    void Promise.all(
      owned.map(async (r) => {
        const claims = await getClaimsForReport(r.id)
        const summary: ClaimSummary = {
          pending: claims.filter(isPending).length,
          inProgress: claims.some(isApproved),
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

  return summaryByReport
}
