import { apiFetch, throwIfNotOk } from '../api/http'

export type NotificationType =
  | 'CLAIM_CREATED'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REJECTED'
  | 'HANDOVER_CONFIRMED'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string | null
  reportId: string | null
  claimId: string | null
  handoverId: string | null
  read: boolean
  createdAt: string
}

export interface NotificationList {
  items: AppNotification[]
  unreadCount: number
}

interface ApiNotification {
  id: string
  type: NotificationType
  title: string
  body: string | null
  reportId: string | null
  claimId: string | null
  handoverId: string | null
  read: boolean
  createdAt: string
}

interface ApiNotificationList {
  items: ApiNotification[]
  unreadCount: number
}

function mapItem(dto: ApiNotification): AppNotification {
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title,
    body: dto.body,
    reportId: dto.reportId,
    claimId: dto.claimId,
    handoverId: dto.handoverId,
    read: dto.read,
    createdAt: dto.createdAt,
  }
}

function mapList(dto: ApiNotificationList): NotificationList {
  return {
    items: dto.items.map(mapItem),
    unreadCount: dto.unreadCount,
  }
}

export const NOTIFICATIONS_CHANGED_EVENT = 'lostfound:notifications-changed'

export function notifyNotificationsChanged(): void {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
}

export async function getNotifications(): Promise<NotificationList> {
  const res = await apiFetch('/api/notifications')
  await throwIfNotOk(res)
  return mapList((await res.json()) as ApiNotificationList)
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const res = await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' })
  await throwIfNotOk(res)
  return mapItem((await res.json()) as ApiNotification)
}

export async function markAllNotificationsRead(): Promise<NotificationList> {
  const res = await apiFetch('/api/notifications/read-all', { method: 'POST' })
  await throwIfNotOk(res)
  return mapList((await res.json()) as ApiNotificationList)
}
