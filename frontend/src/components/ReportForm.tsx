import { useState } from 'react'
import type { ReportType } from '../domain/types'
import { CATEGORIES } from '../domain/categories'
import { contactError } from '../domain/contactValidation'
import { createReport } from '../storage/reportStore'
import { DatePicker } from './DatePicker'
import { FieldError } from './FieldError'

interface Props {
  readonly reporterName: string
  readonly onCreated: () => void
}

const inputClass =
  'w-full rounded-lg border border-white/10 bg-neutral-800/60 px-3 py-2 text-white placeholder-gray-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20'
const labelClass = 'mb-1 block text-xs font-medium text-gray-400'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ReportForm({ reporterName, onCreated }: Props) {
  const [type, setType] = useState<ReportType>('LOST')
  const [itemName, setItemName] = useState('')
  const [itemNameErrorMsg, setItemNameErrorMsg] = useState<string>()
  const [itemDescription, setItemDescription] = useState('')
  const [itemCategory, setItemCategory] = useState<string>(CATEGORIES[0])
  const [location, setLocation] = useState('')
  const [locationErrorMsg, setLocationErrorMsg] = useState<string>()
  const [date, setDate] = useState('')
  const [dateErrorMsg, setDateErrorMsg] = useState<string>()
  const [reporterContact, setReporterContact] = useState('')
  const [contactErrorMsg, setContactErrorMsg] = useState<string>()
  const [submitError, setSubmitError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()

        if (itemName.trim() === '') {
          setItemNameErrorMsg('Item name is required')
          return
        }
        if (location.trim() === '') {
          setLocationErrorMsg('Location is required')
          return
        }
        if (date === '') {
          setDateErrorMsg('Date is required')
          return
        }
        if (date > todayIso()) {
          setDateErrorMsg('Date cannot be in the future')
          return
        }
        const error = contactError(reporterContact)
        if (error) {
          setContactErrorMsg(error)
          return
        }

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
            setItemName('')
            setItemNameErrorMsg(undefined)
            setItemDescription('')
            setItemCategory(CATEGORIES[0])
            setLocation('')
            setLocationErrorMsg(undefined)
            setDate('')
            setDateErrorMsg(undefined)
            setReporterContact('')
            setContactErrorMsg(undefined)
            onCreated()
          })
          .catch((err: unknown) => {
            setSubmitError(err instanceof Error ? err.message : 'Failed to create report')
          })
          .finally(() => {
            setSubmitting(false)
          })
      }}
      className="space-y-5"
    >
      <h2 className="text-xl font-bold text-white">Report an item</h2>

      <div className="flex rounded-full bg-neutral-800 p-1">
        <button
          type="button"
          onClick={() => setType('LOST')}
          className={
            type === 'LOST'
              ? 'flex-1 rounded-full bg-white py-2 text-sm font-semibold text-neutral-900 transition'
              : 'flex-1 rounded-full py-2 text-sm font-medium text-gray-400 transition hover:text-gray-200'
          }
        >
          Lost
        </button>
        <button
          type="button"
          onClick={() => setType('FOUND')}
          className={
            type === 'FOUND'
              ? 'flex-1 rounded-full bg-white py-2 text-sm font-semibold text-neutral-900 transition'
              : 'flex-1 rounded-full py-2 text-sm font-medium text-gray-400 transition hover:text-gray-200'
          }
        >
          Found
        </button>
      </div>

      <div>
        <label htmlFor="itemName" className={labelClass}>
          Item name
        </label>
        <input
          id="itemName"
          value={itemName}
          onChange={(e) => {
            setItemName(e.target.value)
            if (itemNameErrorMsg) setItemNameErrorMsg(undefined)
          }}
          placeholder="e.g. Blue keychain"
          aria-invalid={itemNameErrorMsg ? true : undefined}
          className={inputClass}
        />
        <FieldError message={itemNameErrorMsg} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="itemCategory" className={labelClass}>
            Category
          </label>
          <select
            id="itemCategory"
            value={itemCategory}
            onChange={(e) => setItemCategory(e.target.value)}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-neutral-900">
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date" className={labelClass}>
            Date
          </label>
          <DatePicker
            id="date"
            value={date}
            max={todayIso()}
            onChange={(v) => {
              setDate(v)
              if (dateErrorMsg) setDateErrorMsg(undefined)
            }}
            ariaInvalid={Boolean(dateErrorMsg)}
          />
          <FieldError message={dateErrorMsg} />
        </div>
      </div>

      <div>
        <label htmlFor="itemDescription" className={labelClass}>
          Description
        </label>
        <textarea
          id="itemDescription"
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
          rows={2}
          placeholder="Distinguishing features, brand, color, etc."
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="location" className={labelClass}>
          Location
        </label>
        <input
          id="location"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value)
            if (locationErrorMsg) setLocationErrorMsg(undefined)
          }}
          placeholder="e.g. Main hall, library"
          aria-invalid={locationErrorMsg ? true : undefined}
          className={inputClass}
        />
        <FieldError message={locationErrorMsg} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="reporterName" className={labelClass}>
            Reporter name
          </label>
          <input
            id="reporterName"
            disabled
            value={reporterName}
            className={`${inputClass} cursor-not-allowed opacity-60`}
          />
        </div>
        <div>
          <label htmlFor="reporterContact" className={labelClass}>
            Contact
          </label>
          <input
            id="reporterContact"
            value={reporterContact}
            onChange={(e) => {
              setReporterContact(e.target.value)
              if (contactErrorMsg) setContactErrorMsg(undefined)
            }}
            placeholder="email or phone"
            aria-invalid={contactErrorMsg ? true : undefined}
            className={inputClass}
          />
          <FieldError message={contactErrorMsg} />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-linear-to-b from-white to-gray-200 py-3 font-semibold text-neutral-900 shadow-sm transition hover:from-gray-100 hover:to-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit report'}
      </button>
      <FieldError message={submitError} />
    </form>
  )
}
