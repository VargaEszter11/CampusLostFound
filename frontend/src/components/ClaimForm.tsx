import type { ReportType } from '../domain/types'
import { useClaimForm } from '../hooks/useClaimForm'
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
  const form = useClaimForm(reportId, defaultContact, onSubmitted)

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        form.submit()
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
          value={form.claimantContact}
          onChange={(e) => form.changeContact(e.target.value)}
          placeholder="email or phone"
          aria-invalid={form.contactErrorMsg ? true : undefined}
          className="field-input"
        />
        <FieldError message={form.contactErrorMsg} />
      </div>

      <div>
        <label htmlFor="reason" className="field-label">
          {reportType === 'FOUND' ? 'Why is this yours? (optional)' : 'Where/how did you find it? (optional)'}
        </label>
        <textarea
          id="reason"
          value={form.reason}
          onChange={(e) => form.setReason(e.target.value)}
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
