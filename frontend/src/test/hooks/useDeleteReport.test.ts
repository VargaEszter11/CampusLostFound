import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDeleteReport } from '../../hooks/useDeleteReport'
import { deleteReport } from '../../services/reportStore'

vi.mock('../../services/reportStore', () => ({
  deleteReport: vi.fn(),
}))

const deleteReportMock = vi.mocked(deleteReport)

describe('useDeleteReport', () => {
  beforeEach(() => {
    deleteReportMock.mockReset()
  })

  it('calls onDeleted after a successful delete', async () => {
    deleteReportMock.mockResolvedValue(undefined)
    const onDeleted = vi.fn()
    const { result } = renderHook(() => useDeleteReport(onDeleted))

    act(() => result.current.remove('report-1'))

    expect(result.current.deleting).toBe(true)
    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1))
    expect(deleteReportMock).toHaveBeenCalledWith('report-1')
  })

  it('surfaces the server error and stops deleting without calling onDeleted', async () => {
    deleteReportMock.mockRejectedValue(new Error('Cannot delete a report with an approved claim'))
    const onDeleted = vi.fn()
    const { result } = renderHook(() => useDeleteReport(onDeleted))

    act(() => result.current.remove('report-1'))

    await waitFor(() => expect(result.current.error).toBe('Cannot delete a report with an approved claim'))
    expect(result.current.deleting).toBe(false)
    expect(onDeleted).not.toHaveBeenCalled()
  })
})
