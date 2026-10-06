import type { Item, ItemId, Report, ReportStatus, ReportType } from '../domain/types'
import { apiFetch, throwIfNotOk } from '../api/http'

export interface NewReportInput {
  type: ReportType
  itemName: string
  itemDescription?: string
  itemCategory?: string
  location: string
  date: string
  reporterContact: string
}

type ApiItem = Omit<Item, 'description' | 'category'> & {
  description: string | null
  category: string | null
}

type ApiReport = Omit<Report, 'item'> & { item: ApiItem }

function mapReport(dto: ApiReport): Report {
  return {
    ...dto,
    item: {
      ...dto.item,
      id: dto.item.id as ItemId,
      description: dto.item.description ?? undefined,
      category: dto.item.category ?? undefined,
    },
  }
}

export async function getReports(status?: ReportStatus): Promise<Report[]> {
  const query = status ? `?status=${status}` : ''
  const res = await apiFetch(`/api/reports${query}`)
  await throwIfNotOk(res)
  const data = (await res.json()) as ApiReport[]
  return data.map(mapReport)
}

export async function getOpenReports(): Promise<Report[]> {
  return getReports('OPEN')
}

export async function getReport(reportId: string): Promise<Report | undefined> {
  const res = await apiFetch(`/api/reports/${reportId}`)
  if (res.status === 404) return undefined
  await throwIfNotOk(res)
  return mapReport((await res.json()) as ApiReport)
}

export async function createReport(input: NewReportInput): Promise<Report> {
  const res = await apiFetch('/api/reports', {
    method: 'POST',
    body: JSON.stringify({
      type: input.type,
      itemName: input.itemName,
      itemDescription: input.itemDescription,
      itemCategory: input.itemCategory,
      location: input.location,
      date: input.date,
      reporterContact: input.reporterContact,
    }),
  })
  await throwIfNotOk(res)
  return mapReport((await res.json()) as ApiReport)
}
