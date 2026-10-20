import { useEffect, useState } from 'react'
import type { HandoverListItem } from '../domain/types'
import { useMyHandovers } from '../hooks/useMyHandovers'

interface Props {
  readonly focusHandoverId?: string | null
}

const TABS: ReadonlyArray<{ confirmed: boolean; label: string }> = [
  { confirmed: false, label: 'Pending' },
  { confirmed: true, label: 'Handed over' },
]

export function MyHandovers({ focusHandoverId = null }: Props) {
  const { items, loading, error, actionError, confirm } = useMyHandovers()
  const [userTab, setUserTab] = useState<boolean | null>(null)
  const focusedConfirmed = focusHandoverId ? items.find((h) => h.id === focusHandoverId)?.confirmed : undefined
  const tab = userTab ?? focusedConfirmed ?? false

  useEffect(() => {
    if (!focusHandoverId || loading) return
    document
      .getElementById(`handover-${focusHandoverId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusHandoverId, loading, items, tab])

  if (loading) {
    return <p className="text-ink-faint">Loading handovers…</p>
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>
  }

  if (items.length === 0) {
    return (
      <p className="text-ink-faint">No handovers yet. Approve a claim on one of your reports to start a handover.</p>
    )
  }

  const tabItems = items.filter((h) => h.confirmed === tab)

  return (
    <div>
      {actionError && <p className="mb-4 text-sm text-danger">{actionError}</p>}

      <div className="mb-2 flex flex-wrap gap-2">
        {TABS.map(({ confirmed, label }) => (
          <button
            key={label}
            type="button"
            onClick={() => setUserTab(confirmed)}
            className={tab === confirmed ? 'chip chip-active' : 'chip'}
          >
            {label} ({items.filter((h) => h.confirmed === confirmed).length})
          </button>
        ))}
      </div>

      {tabItems.length === 0 ? (
        <p className="text-ink-faint">No handovers here.</p>
      ) : (
        <ul className="border-t border-line">
          {tabItems.map((h) => (
            <HandoverListItemRow key={h.id} h={h} focusHandoverId={focusHandoverId} confirm={confirm} />
          ))}
        </ul>
      )}
    </div>
  )
}

function HandoverListItemRow({
  h,
  focusHandoverId,
  confirm,
}: {
  readonly h: HandoverListItem
  readonly focusHandoverId: string | null
  readonly confirm: (handoverId: string) => void
}) {
  return (
    <li
      id={`handover-${h.id}`}
      className={
        h.id === focusHandoverId
          ? 'rounded-lg border-b border-line bg-teal-soft/40 px-3 py-4 ring-1 ring-teal'
          : 'border-b border-line py-4'
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">{h.itemName}</span>
            <span
              className={
                h.confirmed
                  ? 'rounded px-2 py-0.5 text-xs font-semibold status-approved'
                  : 'rounded px-2 py-0.5 text-xs font-semibold status-pending'
              }
            >
              {h.confirmed ? 'Handed over' : 'Awaiting handover'}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            {h.reportType === 'LOST' ? 'Lost' : 'Found'} · you are the{' '}
            {h.yourRole === 'REPORTER' ? 'reporter' : 'claimant'}
          </p>
        </div>
      </div>

      <div className="info-callout mt-3 space-y-1 text-sm">
        <p>
          Code: <span className="font-mono font-semibold">{h.handoverCode}</span>
        </p>
        <p>
          {h.yourRole === 'REPORTER' ? (
            <>
              Claimant: {h.claimantName} · {h.claimantContact}
            </>
          ) : (
            <>
              Reporter: {h.reporterName} · {h.reporterContact}
            </>
          )}
        </p>
        {h.confirmed && h.date && <p className="text-xs opacity-80">Confirmed {new Date(h.date).toLocaleString()}</p>}
      </div>

      {h.yourRole === 'REPORTER' && !h.confirmed && (
        <button type="button" onClick={() => confirm(h.id)} className="btn-primary mt-3">
          Mark as handed over
        </button>
      )}
    </li>
  )
}
