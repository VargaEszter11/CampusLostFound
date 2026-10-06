import { CATEGORIES } from '../domain/categories'
import { todayIso } from '../domain/format'
import type { CategoryFilter, ReportFilter } from '../hooks/useReportFilters'
import { DatePicker } from './DatePicker'

const FILTER_OPTIONS: ReportFilter[] = ['ALL', 'LOST', 'FOUND', 'MINE']

const FILTER_LABELS: Record<ReportFilter, string> = {
  ALL: 'All',
  LOST: 'Lost',
  FOUND: 'Found',
  MINE: 'My reports',
}

interface Props {
  readonly filter: ReportFilter
  readonly onFilterChange: (filter: ReportFilter) => void
  readonly search: string
  readonly onSearchChange: (value: string) => void
  readonly category: CategoryFilter
  readonly onCategoryChange: (value: CategoryFilter) => void
  readonly dateFrom: string
  readonly dateTo: string
  readonly onDateFromChange: (value: string) => void
  readonly onDateToChange: (value: string) => void
  readonly hasExtraFilters: boolean
  readonly onClearExtraFilters: () => void
}

export function ReportFilters({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  hasExtraFilters,
  onClearExtraFilters,
}: Props) {
  return (
    <>
      <div className="relative mb-4">
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-faint"
        >
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M17 17L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, description, location, or reporter…"
          aria-label="Search reports"
          className="field-input pl-9"
        />
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onFilterChange(option)}
            className={filter === option ? 'chip chip-active' : 'chip'}
          >
            {FILTER_LABELS[option]}
          </button>
        ))}
      </div>

      <div className="mb-4 mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="filterCategory" className="field-label">
            Category
          </label>
          <select
            id="filterCategory"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as CategoryFilter)}
            className="field-input"
          >
            <option value="ALL">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filterDateFrom" className="field-label">
            From date
          </label>
          <DatePicker
            id="filterDateFrom"
            value={dateFrom}
            max={dateTo || todayIso()}
            onChange={onDateFromChange}
          />
        </div>
        <div>
          <label htmlFor="filterDateTo" className="field-label">
            To date
          </label>
          <DatePicker id="filterDateTo" value={dateTo} max={todayIso()} onChange={onDateToChange} />
        </div>
      </div>

      {hasExtraFilters && (
        <div className="mb-3">
          <button
            type="button"
            onClick={onClearExtraFilters}
            className="text-xs font-medium text-teal hover:underline"
          >
            Clear category & date filters
          </button>
        </div>
      )}
    </>
  )
}
