import { useCallback, useEffect, useRef, useState } from 'react'
import type { Claim, Handover } from '../domain/types'
import { approveClaim, getClaimsForReport, getHandoverForReport, rejectClaim } from '../services/claimStore'
import { confirmHandoverById } from '../services/handoverStore'
import { notifyNotificationsChanged } from '../services/notificationStore'

export function useReportClaims(reportId: string, onChanged?: () => void) {
  const [claims, setClaims] = useState<Claim[]>([])
  const [handover, setHandover] = useState<Handover | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const onChangedRef = useRef(onChanged)

  useEffect(() => {
    onChangedRef.current = onChanged
  }, [onChanged])

  useEffect(() => {
    let cancelled = false
    void Promise.all([getClaimsForReport(reportId), getHandoverForReport(reportId)])
      .then(([nextClaims, nextHandover]) => {
        if (cancelled) return
        setClaims(nextClaims)
        setHandover(nextHandover)
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
  }, [reportId])

  const reload = useCallback(async () => {
    const [nextClaims, nextHandover] = await Promise.all([
      getClaimsForReport(reportId),
      getHandoverForReport(reportId),
    ])
    setClaims(nextClaims)
    setHandover(nextHandover)
  }, [reportId])

  const afterChange = useCallback(async () => {
    setError(undefined)
    await reload()
    onChangedRef.current?.()
    notifyNotificationsChanged()
  }, [reload])

  const runChange = useCallback(
    (action: Promise<unknown>, failMessage: string) => {
      void action
        .then(() => afterChange())
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : failMessage)
        })
    },
    [afterChange],
  )

  const approve = useCallback((claimId: string) => runChange(approveClaim(claimId), 'Failed to approve claim'), [runChange])
  const reject = useCallback((claimId: string) => runChange(rejectClaim(claimId), 'Failed to reject claim'), [runChange])
  const confirm = useCallback(() => {
    if (!handover) return
    runChange(confirmHandoverById(handover.id), 'Failed to confirm handover')
  }, [handover, runChange])

  return { claims, handover, loading, error, approve, reject, confirm, afterChange }
}
