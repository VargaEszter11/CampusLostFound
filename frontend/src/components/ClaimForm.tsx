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

const inputClass =
  'w-full rounded-lg border border-white/10 bg-neutral-800/60 px-3 py-2 text-white placeholder-gray-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20'
const labelClass = 'mb-1 block text-xs font-medium text-gray-400'

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
      className="mt-5 space-y-4 border-t border-white/10 pt-5"
    >
      <h4 className="text-sm font-semibold text-white">Submit a claim</h4>

      <div>
        <label htmlFor="claimantName" className={labelClass}>
          Your name
        </label>
        <input id="claimantName" disabled value={claimantName} className={`${inputClass} cursor-not-allowed opacity-60`} />
      </div>

      <div>
        <label htmlFor="claimantContact" className={labelClass}>
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
          className={inputClass}
        />
        <FieldError message={contactErrorMsg} />
      </div>

      <div>
        <label htmlFor="reason" className={labelClass}>
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
          className={inputClass}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-xl bg-linear-to-b from-white to-gray-200 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:from-gray-100 hover:to-gray-300"
        >
          Submit claim
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
