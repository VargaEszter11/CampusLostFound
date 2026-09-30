import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_CHANGED_EVENT,
  type AppNotification,
  type NotificationType,
} from '../storage/notificationStore'

export type NotificationTab = 'OPEN_REPORTS' | 'MY_CLAIMS' | 'HANDOVERS'

interface Props {
  readonly onNavigate: (tab: NotificationTab) => void
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffSec = Math.round((Date.now() - then) / 1000)
  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}

function tabForType(type: NotificationType): NotificationTab {
  switch (type) {
    case 'CLAIM_CREATED':
      return 'OPEN_REPORTS'
    case 'CLAIM_APPROVED':
    case 'CLAIM_REJECTED':
      return 'MY_CLAIMS'
    case 'HANDOVER_CONFIRMED':
      return 'HANDOVERS'
  }
}

export function NotificationBell({ onNavigate }: Props) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 })
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      const data = await getNotifications()
      setItems(data.items)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const interval = window.setInterval(() => {
      void refresh()
    }, 20_000)
    const onChanged = () => {
      void refresh()
    }
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged)
    }
  }, [refresh])

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setMenuPos({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function handleItemClick(n: AppNotification) {
    if (!n.read) {
      try {
        await markNotificationRead(n.id)
        setItems((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)))
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch {
        // still navigate
      }
    }
    setOpen(false)
    onNavigate(tabForType(n.type))
  }

  async function handleMarkAll() {
    try {
      const data = await markAllNotificationsRead()
      setItems(data.items)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all read')
    }
  }

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          style={{ top: menuPos.top, right: menuPos.right }}
          className="fixed z-[100] w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-white/10 bg-neutral-900 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAll()}
                className="text-xs text-blue-300 hover:text-blue-200"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 && (
              <p className="px-3 py-4 text-sm text-gray-500">Loading…</p>
            )}
            {error && <p className="px-3 py-3 text-sm text-red-300">{error}</p>}
            {!loading && !error && items.length === 0 && (
              <p className="px-3 py-4 text-sm text-gray-500">No notifications yet.</p>
            )}
            <ul>
              {items.map((n) => (
                <li key={n.id} className="border-b border-white/5 last:border-0">
                  <button
                    type="button"
                    onClick={() => void handleItemClick(n)}
                    className={
                      n.read
                        ? 'flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-white/5'
                        : 'flex w-full flex-col gap-0.5 bg-blue-500/10 px-3 py-2.5 text-left hover:bg-blue-500/15'
                    }
                  >
                    <span className="text-sm font-medium text-white">{n.title}</span>
                    {n.body && <span className="text-xs text-gray-400">{n.body}</span>}
                    <span className="text-[11px] text-gray-500">{relativeTime(n.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v)
          if (!open) void refresh()
        }}
        className="relative rounded-lg border border-white/20 bg-white/5 px-2.5 py-1.5 text-gray-200 hover:border-white/40 hover:text-white"
      >
        <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 rounded-full bg-blue-500 px-1 text-center text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {menu}
    </div>
  )
}
