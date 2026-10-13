import { CATEGORIES } from '../domain/categories'
import { todayIso } from '../domain/format'
import { useCategorySuggestion } from '../hooks/useCategorySuggestion'
import { useReportForm } from '../hooks/useReportForm'
import { DatePicker } from './DatePicker'
import { FieldError } from './FieldError'

interface Props {
  readonly reporterName: string
  readonly defaultContact?: string
  readonly onCreated: () => void
}

export function ReportForm({ reporterName, defaultContact = '', onCreated }: Props) {
  const form = useReportForm(defaultContact, onCreated)
  const categorySuggestion = useCategorySuggestion(form.itemName, form.itemDescription)

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        form.submit()
      }}
      className="space-y-5"
    >
      <h2 className="brand-display text-2xl text-ink">Report an item</h2>

      <div className="flex rounded-lg border border-line bg-paper p-1">
        <button
          type="button"
          onClick={() => form.setType('LOST')}
          className={
            form.type === 'LOST'
              ? 'flex-1 rounded-md bg-ink py-2 text-sm font-semibold text-paper transition'
              : 'flex-1 rounded-md py-2 text-sm font-medium text-ink-muted transition hover:text-ink'
          }
        >
          Lost
        </button>
        <button
          type="button"
          onClick={() => form.setType('FOUND')}
          className={
            form.type === 'FOUND'
              ? 'flex-1 rounded-md bg-teal py-2 text-sm font-semibold text-paper transition'
              : 'flex-1 rounded-md py-2 text-sm font-medium text-ink-muted transition hover:text-ink'
          }
        >
          Found
        </button>
      </div>

      <div>
        <label htmlFor="itemName" className="field-label">
          Item name
        </label>
        <input
          id="itemName"
          value={form.itemName}
          onChange={(e) => form.changeItemName(e.target.value)}
          placeholder="e.g. Blue keychain"
          aria-invalid={form.itemNameErrorMsg ? true : undefined}
          className="field-input"
        />
        <FieldError message={form.itemNameErrorMsg} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="itemCategory" className="field-label">
              Category
            </label>
            {categorySuggestion.loading && <span className="text-xs text-ink-faint">Suggesting…</span>}
          </div>
          <select
            id="itemCategory"
            value={form.itemCategory}
            onChange={(e) => form.setItemCategory(e.target.value)}
            className="field-input"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {categorySuggestion.suggestion && categorySuggestion.suggestion !== form.itemCategory && (
            <p className="mt-1 text-xs text-ink-muted">
              Suggested: <span className="font-medium text-ink">{categorySuggestion.suggestion}</span>{' '}
              <button
                type="button"
                onClick={() => form.setItemCategory(categorySuggestion.suggestion as string)}
                className="text-teal hover:underline"
              >
                Use
              </button>
            </p>
          )}
          {categorySuggestion.error && <p className="mt-1 text-xs text-danger">{categorySuggestion.error}</p>}
        </div>
        <div>
          <label htmlFor="date" className="field-label">
            Date
          </label>
          <DatePicker
            id="date"
            value={form.date}
            max={todayIso()}
            onChange={form.changeDate}
            ariaInvalid={Boolean(form.dateErrorMsg)}
          />
          <FieldError message={form.dateErrorMsg} />
        </div>
      </div>

      <div>
        <label htmlFor="itemDescription" className="field-label">
          Description
        </label>
        <textarea
          id="itemDescription"
          value={form.itemDescription}
          onChange={(e) => form.setItemDescription(e.target.value)}
          rows={2}
          placeholder="Distinguishing features, brand, color, etc."
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="location" className="field-label">
          Location
        </label>
        <input
          id="location"
          value={form.location}
          onChange={(e) => form.changeLocation(e.target.value)}
          placeholder="e.g. Main hall, library"
          aria-invalid={form.locationErrorMsg ? true : undefined}
          className="field-input"
        />
        <FieldError message={form.locationErrorMsg} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="reporterName" className="field-label">
            Reporter name
          </label>
          <input id="reporterName" disabled value={reporterName} className="field-input" />
        </div>
        <div>
          <label htmlFor="reporterContact" className="field-label">
            Contact
          </label>
          <input
            id="reporterContact"
            value={form.reporterContact}
            onChange={(e) => form.changeContact(e.target.value)}
            placeholder="email or phone"
            aria-invalid={form.contactErrorMsg ? true : undefined}
            className="field-input"
          />
          <FieldError message={form.contactErrorMsg} />
        </div>
      </div>

      <button type="submit" disabled={form.submitting} className="btn-primary">
        {form.submitting ? 'Submitting…' : 'Submit report'}
      </button>
      <FieldError message={form.submitError} />
    </form>
  )
}
