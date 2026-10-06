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
    if (itemName.trim() === '') {
      setItemNameErrorMsg('Item name is required')
      return false
    }
    if (location.trim() === '') {
      setLocationErrorMsg('Location is required')
      return false
    }
    if (date === '') {
      setDateErrorMsg('Date is required')
      return false
    }
    if (date > todayIso()) {
      setDateErrorMsg('Date cannot be in the future')
      return false
    }
    const error = contactError(reporterContact)
    if (error) {
      setContactErrorMsg(error)
      return false
    }
    return true
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
