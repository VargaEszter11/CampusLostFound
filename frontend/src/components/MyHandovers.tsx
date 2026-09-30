import { useCallback, useEffect, useState } from 'react'
import {
  confirmHandoverById,
  getMyHandovers,
  type HandoverListItem,
} from '../storage/handoverStore'
import { notifyNotificationsChanged } from '../storage/notificationStore'

export function MyHandovers() {
  const [items, setItems] = useState<HandoverListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [actionError, setActionError] = useState<string>()

  const load = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      setItems(await getMyHandovers())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load handovers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <p className="text-gray-500">Loading handovers…</p>
  }

  if (error) {
    return <p className="text-sm text-red-300">{error}</p>
  }

  if (items.length === 0) {
    return (
      <p className="text-gray-500">
        No handovers yet. Approve a claim on one of your reports to start a handover.
      </p>
    )
  }

  return (
    <div>
      {actionError && <p className="mb-4 text-sm text-red-300">{actionError}</p>}
      <ul className="space-y-3">
        {items.map((h) => (
          <li key={h.id} className="rounded-xl border border-white/10 bg-neutral-900/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-white">{h.itemName}</span>
              <span
                className={
                  h.confirmed
                    ? 'rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300'
                    : 'rounded-full bg-blue-500/20 px-2.5 py-1 text-xs font-medium text-blue-300'
                }
              >
                {h.confirmed ? 'Handed over' : 'Awaiting handover'}
              </span>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              {h.reportType === 'LOST' ? 'Lost' : 'Found'} · you are the{' '}
              {h.yourRole === 'REPORTER' ? 'reporter' : 'claimant'}
            </p>

            <div className="mt-3 space-y-1 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
              <p className="text-sm text-blue-200">
                Code: <span className="font-mono font-semibold">{h.handoverCode}</span>
              </p>
              <p className="text-sm text-blue-200">
                {h.yourRole === 'REPORTER' ? (
                  <>Claimant: {h.claimantName} · ✉️ {h.claimantContact}</>
                ) : (
                  <>Reporter: {h.reporterName} · ✉️ {h.reporterContact}</>
                )}
              </p>
              {h.confirmed && h.date && (
                <p className="text-xs text-blue-300">Confirmed {new Date(h.date).toLocaleString()}</p>
              )}
            </div>

            {h.yourRole === 'REPORTER' && !h.confirmed && (
              <button
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
                className="mt-3 w-full rounded-xl bg-blue-500/20 py-2.5 text-sm font-semibold text-blue-200 hover:bg-blue-500/30"
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
