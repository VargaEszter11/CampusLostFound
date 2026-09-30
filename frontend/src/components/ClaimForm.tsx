import { useState } from 'react'
import type { ReportType } from '../domain/types'
import { contactError } from '../domain/contactValidation'
import { createClaim } from '../storage/claimStore'
import { FieldError } from './FieldError'

interface Props {
  readonly reportId: string
  readonly reportType: ReportType
  readonly claimantName: string
  readonly defaultContact?: string
  readonly onSubmitted: () => void
  readonly onCancel: () => void
}

export function ClaimForm({
  reportId,
  reportType,
  claimantName,
  defaultContact = '',
  onSubmitted,
  onCancel,
}: Props) {
  const [claimantContact, setClaimantContact] = useState(defaultContact)
  const [reason, setReason] = useState('')
  const [contactErrorMsg, setContactErrorMsg] = useState<string>()

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        const error = contactError(claimantContact)
        if (error) {
          setContactErrorMsg(error)
          return
        }
        createClaim({ reportId, claimantContact, reason: reason || undefined })
          .then(() => onSubmitted())
          .catch((err: unknown) => {
            setContactErrorMsg(err instanceof Error ? err.message : 'Failed to submit claim')
          })
      }}
      className="space-y-4"
    >
      <h4 className="text-sm font-semibold text-ink">Submit a claim</h4>

      <div>
        <label htmlFor="claimantName" className="field-label">
          Your name
        </label>
        <input id="claimantName" disabled value={claimantName} className="field-input" />
      </div>

      <div>
        <label htmlFor="claimantContact" className="field-label">
          Your contact
        </label>
        <input
          id="claimantContact"
          value={claimantContact}
          onChange={(e) => {
            setClaimantContact(e.target.value)
            if (contactErrorMsg) setContactErrorMsg(undefined)
          }}
          placeholder="email or phone"
          aria-invalid={contactErrorMsg ? true : undefined}
          className="field-input"
        />
        <FieldError message={contactErrorMsg} />
      </div>

      <div>
        <label htmlFor="reason" className="field-label">
          {reportType === 'FOUND' ? 'Why is this yours? (optional)' : 'Where/how did you find it? (optional)'}
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder={
            reportType === 'FOUND' ? "A detail that proves it's yours" : 'Details that help confirm the match'
          }
          className="field-input"
        />
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1">
          Submit claim
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  )
}
