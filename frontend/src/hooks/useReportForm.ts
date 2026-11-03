import { useState } from 'react'
import { CATEGORIES } from '../domain/categories'
import { contactError } from '../domain/contactValidation'
import { todayIso } from '../domain/format'
import type { ReportType } from '../domain/types'
import { createReport } from '../services/reportStore'

export function useReportForm(defaultContact: string, onCreated: () => void) {
  const [type, setType] = useState<ReportType>('LOST')
  const [itemName, setItemName] = useState('')
  const [itemNameErrorMsg, setItemNameErrorMsg] = useState<string>()
  const [itemDescription, setItemDescription] = useState('')
  const [itemCategory, setItemCategory] = useState<string>(CATEGORIES[0])
  const [location, setLocation] = useState('')
  const [locationErrorMsg, setLocationErrorMsg] = useState<string>()
  const [date, setDate] = useState('')
  const [dateErrorMsg, setDateErrorMsg] = useState<string>()
  const [reporterContact, setReporterContact] = useState(defaultContact)
  const [contactErrorMsg, setContactErrorMsg] = useState<string>()
  const [submitError, setSubmitError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setItemName('')
    setItemNameErrorMsg(undefined)
    setItemDescription('')
    setItemCategory(CATEGORIES[0])
    setLocation('')
    setLocationErrorMsg(undefined)
    setDate('')
    setDateErrorMsg(undefined)
    setReporterContact(defaultContact)
    setContactErrorMsg(undefined)
  }

  function validate(): boolean {
    const nameError = itemName.trim() === '' ? 'Item name is required' : undefined
    const locationError = location.trim() === '' ? 'Location is required' : undefined
    let dateError: string | undefined
    if (date === '') dateError = 'Date is required'
    else if (date > todayIso()) dateError = 'Date cannot be in the future'
    const contactErrorMessage = contactError(reporterContact)

    setItemNameErrorMsg(nameError)
    setLocationErrorMsg(locationError)
    setDateErrorMsg(dateError)
    setContactErrorMsg(contactErrorMessage)
    return !nameError && !locationError && !dateError && !contactErrorMessage
  }

  function submit() {
    if (!validate()) return
    setSubmitting(true)
    setSubmitError(undefined)
    void createReport({
      type,
      itemName,
      itemDescription: itemDescription || undefined,
      itemCategory,
      location,
      date,
      reporterContact,
    })
      .then(() => {
        reset()
        onCreated()
      })
      .catch((err: unknown) => {
        setSubmitError(err instanceof Error ? err.message : 'Failed to create report')
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  return {
    type,
    setType,
    itemName,
    itemNameErrorMsg,
    changeItemName(value: string) {
      setItemName(value)
      if (itemNameErrorMsg) setItemNameErrorMsg(undefined)
    },
    itemDescription,
    setItemDescription,
    itemCategory,
    setItemCategory,
    location,
    locationErrorMsg,
    changeLocation(value: string) {
      setLocation(value)
      if (locationErrorMsg) setLocationErrorMsg(undefined)
    },
    date,
    dateErrorMsg,
    changeDate(value: string) {
      setDate(value)
      if (dateErrorMsg) setDateErrorMsg(undefined)
    },
    reporterContact,
    contactErrorMsg,
    changeContact(value: string) {
      setReporterContact(value)
      if (contactErrorMsg) setContactErrorMsg(undefined)
    },
    submitError,
    submitting,
    submit,
  }
}
