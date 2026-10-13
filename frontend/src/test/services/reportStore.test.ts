import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createReport, deleteReport, getOpenReports, getReport, getReports } from '../../services/reportStore'
import { apiFetch, throwIfNotOk } from '../../api/http'

vi.mock('../../api/http', () => ({
  apiFetch: vi.fn(),
  throwIfNotOk: vi.fn(),
}))

const apiFetchMock = vi.mocked(apiFetch)
const throwIfNotOkMock = vi.mocked(throwIfNotOk)

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

const apiReport = {
  id: 'r1',
  type: 'FOUND',
  item: { id: 'i1', name: 'Black wallet', description: null, category: null },
  location: 'Main hall',
  date: '2026-10-05',
  reporterName: 'Anna Kiss',
  reporterContact: null,
  status: 'OPEN',
  createdAt: '2026-10-01T00:00:00Z',
}

describe('reportStore', () => {
  beforeEach(() => {
    apiFetchMock.mockReset()
    throwIfNotOkMock.mockReset()
    throwIfNotOkMock.mockResolvedValue(undefined)
  })

  it('getReports maps null item fields to undefined', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse([apiReport]))

    const [report] = await getReports()

    expect(report.item.description).toBeUndefined()
    expect(report.item.category).toBeUndefined()
    expect(report.reporterContact).toBeNull()
  })

  it('getReports appends a status query string when given one', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse([]))

    await getReports('OPEN')

    expect(apiFetchMock).toHaveBeenCalledWith('/api/reports?status=OPEN')
  })

  it('getReports omits the query string when no status is given', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse([]))

    await getReports()

    expect(apiFetchMock).toHaveBeenCalledWith('/api/reports')
  })

  it('getOpenReports requests only OPEN reports', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse([]))

    await getOpenReports()

    expect(apiFetchMock).toHaveBeenCalledWith('/api/reports?status=OPEN')
  })

  it('getReport returns undefined on a 404 without throwing', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 404 }))

    const result = await getReport('missing')

    expect(result).toBeUndefined()
    expect(throwIfNotOkMock).not.toHaveBeenCalled()
  })

  it('getReport maps a found report', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(apiReport))

    const result = await getReport('r1')

    expect(result?.id).toBe('r1')
    expect(result?.item.name).toBe('Black wallet')
  })

  it('createReport posts the input and maps the created report', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(apiReport))

    const result = await createReport({
      type: 'FOUND',
      itemName: 'Black wallet',
      location: 'Main hall',
      date: '2026-10-05',
      reporterContact: 'anna@example.com',
    })

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/reports',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result.id).toBe('r1')
  })

  it('deleteReport calls DELETE and surfaces server errors via throwIfNotOk', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await deleteReport('r1')

    expect(apiFetchMock).toHaveBeenCalledWith('/api/reports/r1', { method: 'DELETE' })
    expect(throwIfNotOkMock).toHaveBeenCalled()
  })

  it('deleteReport rejects when throwIfNotOk rejects', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 400 }))
    throwIfNotOkMock.mockRejectedValue(new Error('Cannot delete a report with an approved claim'))

    await expect(deleteReport('r1')).rejects.toThrow('Cannot delete a report with an approved claim')
  })
})
