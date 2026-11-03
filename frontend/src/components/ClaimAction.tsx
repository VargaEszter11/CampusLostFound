import { useEffect, useState } from 'react'
import { isPending } from '../domain/rules'
import type { ReportType } from '../domain/types'
import { getMyClaims } from '../services/claimStore'
import { ClaimForm } from './ClaimForm'

interface Props {
  readonly reportId: string
  readonly reportType: ReportType
  readonly currentUser: string
  readonly currentUserEmail?: string
  readonly onSubmitted: () => void
}

export function ClaimAction({ reportId, reportType, currentUser, currentUserEmail, onSubmitted }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [hasPendingClaim, setHasPendingClaim] = useState(false)

  useEffect(() => {
    let cancelled = false
    void getMyClaims()
      .then((claims) => {
        if (!cancelled) setHasPendingClaim(claims.some((c) => c.reportId === reportId && isPending(c)))
      })
      .catch(() => {
        // Not knowing just means the button stays; the server still rejects a duplicate claim
      })
    return () => {
      cancelled = true
    }
  }, [reportId])

  return (
    <div className="mt-5 border-t border-line pt-5">
      {hasPendingClaim ? (
        <p className="text-sm text-ink-faint">
          You have claimed this item. The reporter will review your claim — you can follow it under My claims.
        </p>
      ) : showForm ? (
        <ClaimForm
          reportId={reportId}
          reportType={reportType}
          claimantName={currentUser}
          defaultContact={currentUserEmail}
          onSubmitted={() => {
            setShowForm(false)
            setHasPendingClaim(true)
            onSubmitted()
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button type="button" onClick={() => setShowForm(true)} className="btn-secondary w-full">
          {reportType === 'FOUND' ? 'This is mine' : 'Found it'}
        </button>
      )}
    </div>
  )
}
