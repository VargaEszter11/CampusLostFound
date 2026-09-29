import { useEffect, useRef, useState } from 'react'

interface Props {
  readonly id: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly max?: string
  readonly ariaInvalid?: boolean
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const DISPLAY_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const MONTH_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseIso(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

// Grid cells for the visible month, Monday-first, including leading/trailing days from adjacent months.
function buildGrid(viewDate: Date): Date[] {
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const startOffset = (firstOfMonth.getDay() + 6) % 7
  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(gridStart.getDate() - startOffset)

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })
}

export function DatePicker({ id, value, onChange, max, ariaInvalid }: Props) {
  const selected = parseIso(value)
  const maxDate = max ? parseIso(max) : null
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => selected ?? maxDate ?? new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  function openPicker() {
    setViewDate(selected ?? maxDate ?? new Date())
    setOpen(true)
  }

  function isDisabled(d: Date): boolean {
    return maxDate !== null && toIso(d) > toIso(maxDate)
  }

  const grid = buildGrid(viewDate)

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => (open ? setOpen(false) : openPicker())}
        aria-invalid={ariaInvalid ? true : undefined}
        className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-neutral-800/60 px-3 py-2 text-left text-white outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
      >
        <span className={selected ? 'text-white' : 'text-gray-500'}>
          {selected ? DISPLAY_FORMAT.format(selected) : 'Select a date'}
        </span>
        <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-gray-400">
          <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 8h14M7 2.5v3M13 2.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-72 rounded-xl border border-white/10 bg-neutral-900 p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              aria-label="Previous month"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-white">{MONTH_FORMAT.format(viewDate)}</span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              aria-label="Next month"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
            {WEEKDAYS.map((w) => (
              <span key={w} className="py-1">
                {w}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.map((d) => {
              const inMonth = d.getMonth() === viewDate.getMonth()
              const iso = toIso(d)
              const isSelected = selected !== null && iso === toIso(selected)
              const disabled = isDisabled(d)
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(iso)
                    setOpen(false)
                  }}
                  className={
                    isSelected
                      ? 'rounded-lg bg-white py-1.5 text-sm font-semibold text-neutral-900'
                      : disabled
                        ? 'rounded-lg py-1.5 text-sm text-gray-700 cursor-not-allowed'
                        : inMonth
                          ? 'rounded-lg py-1.5 text-sm text-gray-200 hover:bg-white/10'
                          : 'rounded-lg py-1.5 text-sm text-gray-600 hover:bg-white/10'
                  }
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs font-medium text-gray-400 hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={maxDate !== null && isDisabled(new Date())}
              onClick={() => {
                const today = new Date()
                onChange(toIso(today))
                setViewDate(today)
                setOpen(false)
              }}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 disabled:cursor-not-allowed disabled:text-gray-600"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
