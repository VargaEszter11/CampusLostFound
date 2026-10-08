import type { AdminReport } from '../domain/types'
import { apiFetch, throwIfNotOk } from '../api/http'

type ApiAdminReport = Omit<AdminReport, 'item'> & {
  item: Omit<AdminReport['item'], 'description' | 'category'> & {
    description: string | null
    category: string | null
  }
}

export async function getAllReports(): Promise<AdminReport[]> {
  const res = await apiFetch('/api/admin/reports')
  await throwIfNotOk(res)
  const data = (await res.json()) as ApiAdminReport[]
  return data.map((dto) => ({
    ...dto,
    item: {
      ...dto.item,
      description: dto.item.description ?? undefined,
      category: dto.item.category ?? undefined,
    },
  }))
}
