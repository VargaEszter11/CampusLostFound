import type { Report, ReportStatus, ReportType } from '../domain/types'
import { newItemId } from '../domain/types'
import { MOCK_USERS } from '../domain/mockUsers'

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

export function getReport(reportId: string): Report | undefined {
  return readAll().find((r) => r.id === reportId)
}

export function closeReport(reportId: string): void {
  const list = readAll()
  const updated = list.map((r) => (r.id === reportId ? { ...r, status: 'CLOSED' as ReportStatus } : r))
  writeAll(updated)
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

function seedReport(input: NewReportInput, daysAgo: number): Report {
  return {
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
    createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
  }
}

function ensureSeedData(): void {
  if (readAll().length > 0) return
  const [anna, bence, csenge] = MOCK_USERS
  writeAll([
    seedReport(
      {
        type: 'FOUND',
        itemName: 'Black wallet',
        itemDescription: 'Leather wallet with a few cards inside, found near the entrance.',
        itemCategory: 'Other',
        location: 'Main hall',
        date: '2026-09-18',
        reporterName: anna,
        reporterContact: 'anna.kiss@example.com',
      },
      3,
    ),
    seedReport(
      {
        type: 'LOST',
        itemName: 'Silver keys with a blue keychain',
        itemDescription: '3 keys on a ring, blue rubber keychain shaped like a cat.',
        itemCategory: 'Keys',
        location: 'Library',
        date: '2026-09-19',
        reporterName: bence,
        reporterContact: 'bence.toth@example.com',
      },
      2,
    ),
    seedReport(
      {
        type: 'FOUND',
        itemName: 'Wired earphones',
        itemDescription: 'White wired earphones in a small pouch.',
        itemCategory: 'Electronics',
        location: 'Cafeteria',
        date: '2026-09-20',
        reporterName: csenge,
        reporterContact: 'csenge.nagy@example.com',
      },
      1,
    ),
    seedReport(
      {
        type: 'LOST',
        itemName: 'Blue backpack',
        itemDescription: 'Navy blue backpack with a laptop compartment.',
        itemCategory: 'Bag / backpack',
        location: 'Lecture hall B',
        date: '2026-09-21',
        reporterName: anna,
        reporterContact: 'anna.kiss@example.com',
      },
      0,
    ),
  ])
}

ensureSeedData()
