import { useEffect, useState } from 'react'
import type { Claim, Handover, Report } from '../domain/types'
import { isApproved } from '../domain/rules'
import { getHandoverForReport, getMyClaims } from '../services/claimStore'
import { getReport } from '../services/reportStore'

export interface ClaimRow {
  readonly claim: Claim
  readonly report: Report
  readonly handover?: Handover
}

export function useMyClaims() {
  const [rows, setRows] = useState<ClaimRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let cancelled = false

    void getMyClaims()
      .then(async (claims) => {
        const results = await Promise.all(
          claims.map(async (claim): Promise<ClaimRow | null> => {
            const report = await getReport(claim.reportId)
            if (!report) return null
            const handover = isApproved(claim) ? await getHandoverForReport(report.id) : undefined
            return { claim, report, handover }
          }),
        )
        if (!cancelled) setRows(results.filter((row): row is ClaimRow => row !== null))
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load claims')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { rows, loading, error }
}
