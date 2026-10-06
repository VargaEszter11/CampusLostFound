import { useState } from 'react'
import { contactError } from '../domain/contactValidation'
import { createClaim } from '../services/claimStore'

export function useClaimForm(reportId: string, defaultContact: string, onSubmitted: () => void) {
  const [claimantContact, setClaimantContact] = useState(defaultContact)
  const [reason, setReason] = useState('')
  const [contactErrorMsg, setContactErrorMsg] = useState<string>()

  function changeContact(value: string) {
    setClaimantContact(value)
    if (contactErrorMsg) setContactErrorMsg(undefined)
  }

  function submit() {
    const error = contactError(claimantContact)
    if (error) {
      setContactErrorMsg(error)
      return
    }
    void createClaim({ reportId, claimantContact, reason: reason || undefined })
      .then(() => onSubmitted())
      .catch((err: unknown) => {
        setContactErrorMsg(err instanceof Error ? err.message : 'Failed to submit claim')
      })
  }

  return { claimantContact, changeContact, reason, setReason, contactErrorMsg, submit }
}
