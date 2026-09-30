import type { Handover, HandoverCode, ReportType } from '../domain/types'
import { apiFetch, throwIfNotOk } from '../api/http'

export interface HandoverListItem {
  id: string
  claimId: string
  reportId: string
  itemName: string
  reportType: ReportType
  handoverCode: HandoverCode
  confirmed: boolean
  date?: string
  reporterName: string
  claimantName: string
  claimantContact: string
  reporterContact: string
  yourRole: 'REPORTER' | 'CLAIMANT'
}

interface ApiHandoverListItem {
  id: string
  claimId: string
  reportId: string
  itemName: string
  reportType: ReportType
  handoverCode: string
  confirmed: boolean
  date: string | null
  reporterName: string
  claimantName: string
  claimantContact: string
  reporterContact: string
  yourRole: 'REPORTER' | 'CLAIMANT'
}

interface ApiHandover {
  id: string
  claimId: string
  handoverCode: string
  confirmed: boolean
  date: string | null
}

function mapListItem(dto: ApiHandoverListItem): HandoverListItem {
  return {
    id: dto.id,
    claimId: dto.claimId,
    reportId: dto.reportId,
    itemName: dto.itemName,
    reportType: dto.reportType,
    handoverCode: dto.handoverCode as HandoverCode,
    confirmed: dto.confirmed,
    date: dto.date ?? undefined,
    reporterName: dto.reporterName,
    claimantName: dto.claimantName,
    claimantContact: dto.claimantContact,
    reporterContact: dto.reporterContact,
    yourRole: dto.yourRole,
  }
}

function mapHandover(dto: ApiHandover): Handover {
  return {
    id: dto.id,
    claimId: dto.claimId,
    handoverCode: dto.handoverCode as HandoverCode,
    confirmed: dto.confirmed,
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
