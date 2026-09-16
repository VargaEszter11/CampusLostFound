import { useState } from 'react'
import type { ReportType } from '../domain/types'
import { CATEGORIES } from '../domain/categories'
import { createReport } from '../storage/reportStore'

interface Props {
  readonly onCreated: () => void
}

const inputClass =
  'w-full rounded-lg border border-white/10 bg-neutral-800/60 px-3 py-2 text-white placeholder-gray-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20'
const labelClass = 'mb-1 block text-xs font-medium text-gray-400'

export function ReportForm({ onCreated }: Props) {
  const [type, setType] = useState<ReportType>('LOST')
  const [itemName, setItemName] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [itemCategory, setItemCategory] = useState<string>(CATEGORIES[0])
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [reporterName, setReporterName] = useState('')
  const [reporterContact, setReporterContact] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        createReport({
          type,
          itemName,
          itemDescription: itemDescription || undefined,
          itemCategory,
          location,
          date,
          reporterName,
          reporterContact,
        })
        setItemName('')
        setItemDescription('')
        setItemCategory(CATEGORIES[0])
        setLocation('')
        setDate('')
        setReporterName('')
        setReporterContact('')
        onCreated()
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
          required
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="e.g. Blue keychain"
          className={inputClass}
        />
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
          <input
            id="date"
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${inputClass} scheme-dark`}
          />
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
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Main hall, library"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="reporterName" className={labelClass}>
            Reporter name
          </label>
          <input
            id="reporterName"
            required
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
            placeholder="Full name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="reporterContact" className={labelClass}>
            Contact
          </label>
          <input
            id="reporterContact"
            required
            value={reporterContact}
            onChange={(e) => setReporterContact(e.target.value)}
            placeholder="email or phone"
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-linear-to-b from-white to-gray-200 py-3 font-semibold text-neutral-900 shadow-sm transition hover:from-gray-100 hover:to-gray-300"
      >
        Submit report
      </button>
    </form>
  )
}
