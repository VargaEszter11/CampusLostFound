import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppNavigation } from '../../hooks/useAppNavigation'
import { getReport } from '../../services/reportStore'
import type { ItemId, Report } from '../../domain/types'

vi.mock('../../services/reportStore', () => ({
  getReport: vi.fn(),
}))

const getReportMock = vi.mocked(getReport)

const report: Report = {
  id: 'r1',
  type: 'FOUND',
  item: { id: 'i1' as ItemId, name: 'Black wallet' },
  location: 'Main hall',
  date: '2026-10-05',
  reporterName: 'Anna Kiss',
  reporterContact: 'anna@example.com',
  status: 'OPEN',
  createdAt: '2026-10-01T00:00:00Z',
}

describe('useAppNavigation', () => {
  beforeEach(() => {
    sessionStorage.clear()
    getReportMock.mockReset()
  })

  it('starts on the Report tab when nothing is stored', () => {
    const { result } = renderHook(() => useAppNavigation('user-1', vi.fn()))

    expect(result.current.tab).toBe('REPORT')
  })

  it('restores a previously selected tab for the same user', () => {
    sessionStorage.setItem('lostfound.tab.user-1', 'MY_CLAIMS')

    const { result } = renderHook(() => useAppNavigation('user-1', vi.fn()))

    expect(result.current.tab).toBe('MY_CLAIMS')
  })

  it('ignores a stored tab belonging to a different user', () => {
    sessionStorage.setItem('lostfound.tab.user-1', 'HANDOVERS')

    const { result } = renderHook(() => useAppNavigation('user-2', vi.fn()))

    expect(result.current.tab).toBe('REPORT')
  })

  it('ignores garbage stored under the key', () => {
    sessionStorage.setItem('lostfound.tab.user-1', 'NOT_A_REAL_TAB')

    const { result } = renderHook(() => useAppNavigation('user-1', vi.fn()))

    expect(result.current.tab).toBe('REPORT')
  })

  it('selectTab persists the choice and calls onOpenReports only for OPEN_REPORTS', () => {
    const onOpenReports = vi.fn()
    const { result } = renderHook(() => useAppNavigation('user-1', onOpenReports))

    act(() => result.current.selectTab('MY_CLAIMS'))
    expect(sessionStorage.getItem('lostfound.tab.user-1')).toBe('MY_CLAIMS')
    expect(onOpenReports).not.toHaveBeenCalled()

    act(() => result.current.selectTab('OPEN_REPORTS'))
    expect(onOpenReports).toHaveBeenCalledTimes(1)
  })

  it('selectTab clears any previous notification focus', () => {
    const { result } = renderHook(() => useAppNavigation('user-1', vi.fn()))

    act(() => result.current.selectTab('MY_CLAIMS'))
    expect(result.current.focus).toBeNull()
  })

  it('navigateTo a report loads it, sets focus, and switches tabs', async () => {
    getReportMock.mockResolvedValue(report)
    const onOpenReports = vi.fn()
    const { result } = renderHook(() => useAppNavigation('user-1', onOpenReports))

    await act(async () =>
      result.current.navigateTo({ tab: 'OPEN_REPORTS', reportId: 'r1', claimId: null, handoverId: null }),
    )

    await waitFor(() => expect(result.current.tab).toBe('OPEN_REPORTS'))
    expect(result.current.focusedReport).toEqual(report)
    expect(result.current.focus?.reportId).toBe('r1')
    expect(onOpenReports).toHaveBeenCalledTimes(1)
  })

  it('navigateTo a claim does not fetch a report', async () => {
    const { result } = renderHook(() => useAppNavigation('user-1', vi.fn()))

    await act(async () =>
      result.current.navigateTo({ tab: 'MY_CLAIMS', reportId: null, claimId: 'c1', handoverId: null }),
    )

    expect(getReportMock).not.toHaveBeenCalled()
    expect(result.current.tab).toBe('MY_CLAIMS')
    expect(result.current.focusedReport).toBeNull()
  })
})
