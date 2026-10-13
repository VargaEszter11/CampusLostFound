import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useClaimSummaries } from '../../hooks/useClaimSummaries'
import { getClaimsForReport } from '../../services/claimStore'
import type { Claim, ItemId, Report } from '../../domain/types'

vi.mock('../../services/claimStore', () => ({
  getClaimsForReport: vi.fn(),
}))

const getClaimsForReportMock = vi.mocked(getClaimsForReport)

function report(id: string, reporterName: string): Report {
  return {
    id,
    type: 'FOUND',
    item: { id: `${id}-item` as ItemId, name: 'Black wallet' },
    location: 'Main hall',
    date: '2026-10-05',
    reporterName,
    reporterContact: 'anna@example.com',
    status: 'OPEN',
    createdAt: '2026-10-01T00:00:00Z',
  }
}

function claim(status: Claim['status']): Claim {
  return {
    id: Math.random().toString(),
    reportId: 'own',
    claimantName: 'Bence Toth',
    claimantContact: 'bence@example.com',
    status,
  }
}

describe('useClaimSummaries', () => {
  beforeEach(() => {
    getClaimsForReportMock.mockReset()
  })

  it('counts pending claims and flags an approved one as in progress, only for owned reports', async () => {
    const own = report('own', 'Anna Kiss')
    const others = report('others', 'Bence Toth')
    getClaimsForReportMock.mockResolvedValue([claim('PENDING'), claim('PENDING'), claim('APPROVED')])

    const { result } = renderHook(() => useClaimSummaries([own, others], 'Anna Kiss'))

    await waitFor(() => expect(result.current.own).toBeDefined())

    expect(result.current.own).toEqual({ pending: 2, inProgress: true })
    expect(result.current.others).toBeUndefined()
    expect(getClaimsForReportMock).toHaveBeenCalledWith('own')
    expect(getClaimsForReportMock).not.toHaveBeenCalledWith('others')
  })

  it('returns an empty map when the user owns nothing', async () => {
    const others = report('others', 'Bence Toth')

    const { result } = renderHook(() => useClaimSummaries([others], 'Anna Kiss'))

    expect(result.current).toEqual({})
    expect(getClaimsForReportMock).not.toHaveBeenCalled()
  })

  it('resets to an empty map when a later load fails', async () => {
    const own = report('own', 'Anna Kiss')
    getClaimsForReportMock.mockResolvedValueOnce([claim('PENDING')])
    const { result, rerender } = renderHook(
      ({ reports }) => useClaimSummaries(reports, 'Anna Kiss'),
      { initialProps: { reports: [own] } },
    )
    await waitFor(() => expect(result.current.own).toEqual({ pending: 1, inProgress: false }))

    const otherOwnReport = report('own-2', 'Anna Kiss')
    getClaimsForReportMock.mockRejectedValueOnce(new Error('network error'))
    rerender({ reports: [otherOwnReport] })

    await waitFor(() => expect(result.current).toEqual({}))
  })
})
