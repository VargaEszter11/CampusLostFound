import type { Handover, HandoverCode, HandoverListItem } from '../domain/types'
import { apiFetch, throwIfNotOk } from '../api/http'

export type ApiHandover = Omit<Handover, 'handoverCode' | 'date'> & {
  handoverCode: string
  date: string | null
}

type ApiHandoverListItem = Omit<HandoverListItem, 'handoverCode' | 'date'> & {
  handoverCode: string
  date: string | null
}

export function mapHandover(dto: ApiHandover): Handover {
  return {
    ...dto,
    handoverCode: dto.handoverCode as HandoverCode,
    date: dto.date ?? undefined,
  }
}

function mapListItem(dto: ApiHandoverListItem): HandoverListItem {
  return {
    ...dto,
    handoverCode: dto.handoverCode as HandoverCode,
    date: dto.date ?? undefined,
  }
}

export async function getMyHandovers(): Promise<HandoverListItem[]> {
  const res = await apiFetch('/api/handovers')
  await throwIfNotOk(res)
  const data = (await res.json()) as ApiHandoverListItem[]
  return data.map(mapListItem)
}

export async function confirmHandoverById(handoverId: string): Promise<Handover> {
  const res = await apiFetch(`/api/handovers/${handoverId}/confirm`, { method: 'POST' })
  await throwIfNotOk(res)
  return mapHandover((await res.json()) as ApiHandover)
}
