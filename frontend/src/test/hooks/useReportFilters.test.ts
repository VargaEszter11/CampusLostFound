import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useReportFilters } from '../../hooks/useReportFilters'
import type { ItemId, Report } from '../../domain/types'

function report(overrides: Partial<Report>): Report {
  return {
    id: overrides.id ?? 'r1',
    type: 'FOUND',
    item: { id: 'i1' as ItemId, name: 'Black wallet', category: 'Other' },
    location: 'Main hall',
    date: '2026-10-05',
    reporterName: 'Anna Kiss',
    reporterContact: 'anna@example.com',
    status: 'OPEN',
    createdAt: '2026-10-01T00:00:00Z',
    ...overrides,
  }
}

describe('useReportFilters', () => {
  const own = report({ id: 'own', reporterName: 'Anna Kiss' })
  const lost = report({ id: 'lost', type: 'LOST', reporterName: 'Bence Toth' })
  const found = report({ id: 'found', type: 'FOUND', reporterName: 'Csenge Nagy' })
  const reports = [own, lost, found]

  it('MINE shows only the current user\'s reports', () => {
    const { result } = renderHook(() => useReportFilters(reports, 'MINE', 'Anna Kiss'))

    expect(result.current.filtered.map((r) => r.id)).toEqual(['own'])
  })

  it('ALL, LOST and FOUND never include the current user\'s own reports', () => {
    const { result } = renderHook(() => useReportFilters(reports, 'ALL', 'Anna Kiss'))

    expect(result.current.filtered.map((r) => r.id).sort()).toEqual(['found', 'lost'])
  })

  it('LOST filters to lost reports from others', () => {
    const { result } = renderHook(() => useReportFilters(reports, 'LOST', 'Anna Kiss'))

    expect(result.current.filtered.map((r) => r.id)).toEqual(['lost'])
  })

  it('search matches item name, location and reporter name', () => {
    const { result } = renderHook(() => useReportFilters(reports, 'ALL', 'Anna Kiss'))

    act(() => result.current.setSearch('bence'))

    expect(result.current.filtered.map((r) => r.id)).toEqual(['lost'])
  })

  it('date range excludes reports outside it', () => {
    const early = report({ id: 'early', type: 'LOST', date: '2026-09-01', reporterName: 'Bence Toth' })
    const late = report({ id: 'late', type: 'LOST', date: '2026-11-01', reporterName: 'Bence Toth' })
    const { result } = renderHook(() => useReportFilters([early, late], 'LOST', 'Anna Kiss'))

    act(() => result.current.changeDateFrom('2026-10-01'))
    act(() => result.current.changeDateTo('2026-10-31'))

    expect(result.current.filtered).toHaveLength(0)
  })

  it('changing dateFrom past the current dateTo pulls dateTo along with it', () => {
    const { result } = renderHook(() => useReportFilters(reports, 'ALL', 'Anna Kiss'))

    act(() => result.current.changeDateTo('2026-10-10'))
    act(() => result.current.changeDateFrom('2026-10-20'))

    expect(result.current.dateTo).toBe('2026-10-20')
  })

  it('hasExtraFilters and clearExtraFilters reset category and dates', () => {
    const { result } = renderHook(() => useReportFilters(reports, 'ALL', 'Anna Kiss'))

    act(() => result.current.setCategory('Electronics'))
    expect(result.current.hasExtraFilters).toBe(true)

    act(() => result.current.clearExtraFilters())

    expect(result.current.hasExtraFilters).toBe(false)
    expect(result.current.category).toBe('ALL')
  })
})
