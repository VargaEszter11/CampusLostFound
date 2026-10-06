import type { AppNotification } from '../domain/types'
import { apiFetch, throwIfNotOk } from '../api/http'

export type NotificationTab = 'OPEN_REPORTS' | 'MY_CLAIMS' | 'HANDOVERS'

export interface NotificationTarget {
  readonly tab: NotificationTab
  readonly reportId?: string | null
  readonly claimId?: string | null
  readonly handoverId?: string | null
}

export interface NotificationList {
  items: AppNotification[]
  unreadCount: number
}

export const NOTIFICATIONS_CHANGED_EVENT = 'lostfound:notifications-changed'

export function notifyNotificationsChanged(): void {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
}

export async function getNotifications(): Promise<NotificationList> {
  const res = await apiFetch('/api/notifications')
  await throwIfNotOk(res)
  return (await res.json()) as NotificationList
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const res = await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' })
  await throwIfNotOk(res)
  return (await res.json()) as AppNotification
}

export async function deleteNotification(id: string): Promise<void> {
  const res = await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' })
  await throwIfNotOk(res)
}

export async function markAllNotificationsRead(): Promise<NotificationList> {
  const res = await apiFetch('/api/notifications/read-all', { method: 'POST' })
  await throwIfNotOk(res)
  return (await res.json()) as NotificationList
}
