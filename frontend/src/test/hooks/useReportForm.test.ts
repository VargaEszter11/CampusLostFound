import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useReportForm } from '../../hooks/useReportForm'
import { createReport } from '../../services/reportStore'

vi.mock('../../services/reportStore', () => ({
  createReport: vi.fn(),
}))

const createReportMock = vi.mocked(createReport)

describe('useReportForm', () => {
  beforeEach(() => {
    createReportMock.mockReset()
  })

  it('shows every missing field at once on an empty submit', () => {
    const { result } = renderHook(() => useReportForm('', vi.fn()))

    act(() => result.current.submit())

    expect(result.current.itemNameErrorMsg).toBe('Item name is required')
    expect(result.current.locationErrorMsg).toBe('Location is required')
    expect(result.current.dateErrorMsg).toBe('Date is required')
    expect(result.current.contactErrorMsg).toBe('Contact is required')
    expect(createReportMock).not.toHaveBeenCalled()
  })

  it('only flags the fields that are still wrong', () => {
    const { result } = renderHook(() => useReportForm('anna@example.com', vi.fn()))

    act(() => result.current.changeItemName('Blue backpack'))
    act(() => result.current.submit())

    expect(result.current.itemNameErrorMsg).toBeUndefined()
    expect(result.current.contactErrorMsg).toBeUndefined()
    expect(result.current.locationErrorMsg).toBe('Location is required')
    expect(result.current.dateErrorMsg).toBe('Date is required')
  })
})
