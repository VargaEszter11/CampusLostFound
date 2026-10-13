import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCategorySuggestion } from '../../hooks/useCategorySuggestion'
import { suggestCategory } from '../../services/categoryService'

vi.mock('../../services/categoryService', () => ({
  suggestCategory: vi.fn(),
}))

const suggestCategoryMock = vi.mocked(suggestCategory)

describe('useCategorySuggestion', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    suggestCategoryMock.mockReset()
    suggestCategoryMock.mockResolvedValue('Other')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not call the API until the name reaches the minimum length', () => {
    const { result, rerender } = renderHook(
      ({ name }) => useCategorySuggestion(name, ''),
      { initialProps: { name: 'ab' } },
    )

    act(() => vi.advanceTimersByTime(1000))
    expect(suggestCategoryMock).not.toHaveBeenCalled()
    expect(result.current.suggestion).toBeUndefined()

    rerender({ name: 'abc' })
    act(() => vi.advanceTimersByTime(1000))
    expect(suggestCategoryMock).toHaveBeenCalledTimes(1)
  })

  it('debounces: only the last edit within the window triggers a call', () => {
    const { rerender } = renderHook(
      ({ name }) => useCategorySuggestion(name, ''),
      { initialProps: { name: 'Blue b' } },
    )

    act(() => vi.advanceTimersByTime(300))
    rerender({ name: 'Blue ba' })
    act(() => vi.advanceTimersByTime(300))
    rerender({ name: 'Blue bag' })
    act(() => vi.advanceTimersByTime(700))

    expect(suggestCategoryMock).toHaveBeenCalledTimes(1)
    expect(suggestCategoryMock).toHaveBeenCalledWith('Blue bag', '')
  })

  it('exposes the resolved suggestion', async () => {
    suggestCategoryMock.mockResolvedValue('Bag / backpack')
    const { result } = renderHook(() => useCategorySuggestion('Blue backpack', 'Navy with laptop sleeve'))

    act(() => vi.advanceTimersByTime(700))
    vi.useRealTimers()

    await waitFor(() => expect(result.current.suggestion).toBe('Bag / backpack'))
    expect(result.current.loading).toBe(false)
  })

  it('exposes an error message when the call fails', async () => {
    suggestCategoryMock.mockRejectedValue(new Error('Category suggestion is not configured on the server'))
    const { result } = renderHook(() => useCategorySuggestion('Blue backpack', ''))

    act(() => vi.advanceTimersByTime(700))
    vi.useRealTimers()

    await waitFor(() =>
      expect(result.current.error).toBe('Category suggestion is not configured on the server'),
    )
  })

  it('does not call the API again for the same name and description', () => {
    suggestCategoryMock.mockResolvedValue('Other')
    const { rerender } = renderHook(
      ({ name }) => useCategorySuggestion(name, ''),
      { initialProps: { name: 'Blue backpack' } },
    )

    act(() => vi.advanceTimersByTime(700))
    rerender({ name: 'Blue backpack' })
    act(() => vi.advanceTimersByTime(700))

    expect(suggestCategoryMock).toHaveBeenCalledTimes(1)
  })
})
