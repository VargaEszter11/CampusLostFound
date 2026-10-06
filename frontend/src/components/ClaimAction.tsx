import { useState } from 'react'
import type { ReportType } from '../domain/types'
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

  return (
    <div className="mt-5 border-t border-line pt-5">
      {showForm ? (
        <ClaimForm
          reportId={reportId}
          reportType={reportType}
          claimantName={currentUser}
          defaultContact={currentUserEmail}
          onSubmitted={() => {
            setShowForm(false)
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
