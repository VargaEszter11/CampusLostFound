import type { Report, ReportType } from '../domain/types'
import { newItemId } from '../domain/types'

const STORAGE_KEY = 'lostfound.reports'

function readAll(): Report[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Report[]
  } catch {
    return []
  }
}

function writeAll(list: Report[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function getReports(): Report[] {
  return readAll()
}

export function getOpenReports(): Report[] {
  return readAll().filter((r) => r.status === 'OPEN')
}

export interface NewReportInput {
  type: ReportType
  itemName: string
  itemDescription?: string
  itemCategory?: string
  location: string
  date: string
  reporterName: string
  reporterContact: string
}

export function createReport(input: NewReportInput): Report {
  const report: Report = {
    id: crypto.randomUUID(),
    type: input.type,
    item: {
      id: newItemId(),
      name: input.itemName,
      description: input.itemDescription,
      category: input.itemCategory,
    },
    location: input.location,
    date: input.date,
    reporterName: input.reporterName,
    reporterContact: input.reporterContact,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  }
  const list = readAll()
  list.push(report)
  writeAll(list)
  return report
}
