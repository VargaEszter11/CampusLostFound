import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppNotification } from '../domain/types'
import { useNotifications } from '../hooks/useNotifications'
import { notifyNotificationsChanged, type NotificationTarget } from '../services/notificationStore'

interface Props {
  readonly onNavigate: (target: NotificationTarget) => void
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

function targetFor(n: AppNotification): NotificationTarget {
  switch (n.type) {
    case 'CLAIM_CREATED':
      return { tab: 'OPEN_REPORTS', reportId: n.reportId }
    case 'CLAIM_APPROVED':
    case 'CLAIM_REJECTED':
      return { tab: 'MY_CLAIMS', claimId: n.claimId }
    case 'HANDOVER_CONFIRMED':
      return { tab: 'HANDOVERS', handoverId: n.handoverId }
  }
}

export function NotificationBell({ onNavigate }: Props) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 })
  const { items, unreadCount, loading, error, markRead, remove, markAll } = useNotifications()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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
    await markRead(n)
    setOpen(false)
    onNavigate(targetFor(n))
  }

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          style={{ top: menuPos.top, right: menuPos.right }}
          className="fixed z-[100] w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-line bg-surface shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
            <span className="text-sm font-semibold text-ink">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAll()}
                className="text-xs font-medium text-teal hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 && <p className="px-3 py-4 text-sm text-ink-faint">Loading…</p>}
            {error && <p className="px-3 py-3 text-sm text-danger">{error}</p>}
            {!loading && !error && items.length === 0 && (
              <p className="px-3 py-4 text-sm text-ink-faint">No notifications yet.</p>
            )}
            <ul>
              {items.map((n) => (
                <li key={n.id} className="flex items-start border-b border-line last:border-0">
                  <button
                    type="button"
                    onClick={() => void handleItemClick(n)}
                    className={
                      n.read
                        ? 'flex min-w-0 flex-1 flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-mint'
                        : 'flex min-w-0 flex-1 flex-col gap-0.5 bg-teal-soft/50 px-3 py-2.5 text-left hover:bg-teal-soft'
                    }
                  >
                    <span className="text-sm font-medium text-ink">{n.title}</span>
                    {n.body && <span className="text-xs text-ink-muted">{n.body}</span>}
                    <span className="text-[11px] text-ink-faint">{relativeTime(n.createdAt)}</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Delete notification"
                    onClick={() => void remove(n)}
                    className="px-3 py-2.5 text-ink-faint transition hover:text-danger"
                  >
                    ✕
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
          if (!open) notifyNotificationsChanged()
        }}
        className="relative rounded-lg border border-line bg-surface px-2.5 py-1.5 text-ink-muted transition hover:border-teal hover:text-teal"
      >
        <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 rounded-full bg-teal px-1 text-center text-[10px] font-semibold text-paper">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {menu}
    </div>
  )
}
