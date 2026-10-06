import { useCallback, useEffect, useState } from 'react'
import type { AppNotification } from '../domain/types'
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_CHANGED_EVENT,
} from '../services/notificationStore'

const POLL_INTERVAL_MS = 20_000

export function useNotifications() {
  const [items, setItems] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let cancelled = false
    const load = () => {
      void getNotifications()
        .then((data) => {
          if (cancelled) return
          setItems(data.items)
          setUnreadCount(data.unreadCount)
          setError(undefined)
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load notifications')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }
    load()
    const interval = window.setInterval(load, POLL_INTERVAL_MS)
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, load)
    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, load)
    }
  }, [])

  const markRead = useCallback(async (n: AppNotification) => {
    if (n.read) return
    try {
      await markNotificationRead(n.id)
      setItems((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      // navigation still happens without the read receipt
    }
  }, [])

  const remove = useCallback(async (n: AppNotification) => {
    try {
      await deleteNotification(n.id)
      setItems((prev) => prev.filter((item) => item.id !== n.id))
      if (!n.read) setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification')
    }
  }, [])

  const markAll = useCallback(async () => {
    try {
      const data = await markAllNotificationsRead()
      setItems(data.items)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all read')
    }
  }, [])

  return { items, unreadCount, loading, error, markRead, remove, markAll }
}
