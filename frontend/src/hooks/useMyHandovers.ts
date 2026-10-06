import { useCallback, useEffect, useState } from 'react'
import type { HandoverListItem } from '../domain/types'
import { confirmHandoverById, getMyHandovers } from '../services/handoverStore'
import { notifyNotificationsChanged } from '../services/notificationStore'

export function useMyHandovers() {
  const [items, setItems] = useState<HandoverListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [actionError, setActionError] = useState<string>()

  const reload = useCallback(async () => {
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

  function confirm(handoverId: string) {
    setActionError(undefined)
    void confirmHandoverById(handoverId)
      .then(() => {
        notifyNotificationsChanged()
        return reload()
      })
      .catch((err: unknown) => {
        setActionError(err instanceof Error ? err.message : 'Failed to confirm handover')
      })
  }

  return { items, loading, error, actionError, confirm }
}
