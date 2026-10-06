import { useCallback, useEffect, useState } from 'react'
import {
  confirmHandoverById,
  getMyHandovers,
  type HandoverListItem,
} from '../storage/handoverStore'
import { notifyNotificationsChanged } from '../storage/notificationStore'

interface Props {
  readonly focusHandoverId?: string | null
}

export function MyHandovers({ focusHandoverId = null }: Props) {
  const [items, setItems] = useState<HandoverListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [actionError, setActionError] = useState<string>()

  useEffect(() => {
    if (!focusHandoverId || loading) return
    document
      .getElementById(`handover-${focusHandoverId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusHandoverId, loading, items])

  const load = useCallback(async () => {
    try {
      setItems(await getMyHandovers())
      setError(undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load handovers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void getMyHandovers()
      .then((data) => {
        if (cancelled) return
        setItems(data)
        setError(undefined)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load handovers')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <p className="text-ink-faint">Loading handovers…</p>
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>
  }

  if (items.length === 0) {
    return (
      <p className="text-ink-faint">
        No handovers yet. Approve a claim on one of your reports to start a handover.
      </p>
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
              <button
                type="button"
                onClick={() => {
                  setActionError(undefined)
                  void confirmHandoverById(h.id)
                    .then(() => {
                      notifyNotificationsChanged()
                      return load()
                    })
                    .catch((err: unknown) => {
                      setActionError(err instanceof Error ? err.message : 'Failed to confirm handover')
                    })
                }}
                className="btn-primary mt-3"
              >
                Mark as handed over
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
