import { useState } from 'react'
import { CATEGORIES } from '../domain/categories'
import type { Report, ReportType } from '../domain/types'
import { isOwnerOf } from '../domain/rules'

export type ReportFilter = ReportType | 'ALL' | 'MINE'
export type CategoryFilter = 'ALL' | (typeof CATEGORIES)[number]

function matchesSearch(r: Report, search: string): boolean {
  const term = search.trim().toLowerCase()
  if (term === '') return true
  return [r.item.name, r.item.description, r.item.category, r.location, r.reporterName]
    .filter((field): field is string => Boolean(field))
    .some((field) => field.toLowerCase().includes(term))
}

export function useReportFilters(reports: Report[], filter: ReportFilter, currentUser: string) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = reports
    .filter((r) => {
      const isMine = isOwnerOf(r, currentUser)
      if (filter === 'MINE') return isMine
      if (isMine) return false
      return filter === 'ALL' || r.type === filter
    })
    .filter((r) => matchesSearch(r, search))
    .filter((r) => category === 'ALL' || r.item.category === category)
    .filter((r) => {
      if (dateFrom && r.date < dateFrom) return false
      if (dateTo && r.date > dateTo) return false
      return true
    })

  function changeDateFrom(value: string) {
    setDateFrom(value)
    if (dateTo && value && value > dateTo) setDateTo(value)
  }

  function changeDateTo(value: string) {
    setDateTo(value)
    if (dateFrom && value && value < dateFrom) setDateFrom(value)
  }

  function clearExtraFilters() {
    setCategory('ALL')
    setDateFrom('')
    setDateTo('')
  }

  return {
    filtered,
    search,
    setSearch,
    category,
    setCategory,
    dateFrom,
    dateTo,
    changeDateFrom,
    changeDateTo,
    hasExtraFilters: category !== 'ALL' || dateFrom !== '' || dateTo !== '',
    clearExtraFilters,
  }
}
