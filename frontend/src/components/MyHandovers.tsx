import { useEffect } from 'react'
import { useMyHandovers } from '../hooks/useMyHandovers'

interface Props {
  readonly focusHandoverId?: string | null
}

export function MyHandovers({ focusHandoverId = null }: Props) {
  const { items, loading, error, actionError, confirm } = useMyHandovers()

  useEffect(() => {
    if (!focusHandoverId || loading) return
    document
      .getElementById(`handover-${focusHandoverId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusHandoverId, loading, items])

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

  return (
    <div>
      {actionError && <p className="mb-4 text-sm text-danger">{actionError}</p>}
      <ul className="border-t border-line">
        {items.map((h) => (
          <li
            key={h.id}
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
              {h.confirmed && h.date && (
                <p className="text-xs opacity-80">Confirmed {new Date(h.date).toLocaleString()}</p>
              )}
            </div>

            {h.yourRole === 'REPORTER' && !h.confirmed && (
              <button type="button" onClick={() => confirm(h.id)} className="btn-primary mt-3">
                Mark as handed over
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
