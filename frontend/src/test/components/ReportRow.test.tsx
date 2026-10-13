import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReportRow } from '../../components/ReportRow'
import { deleteReport } from '../../services/reportStore'
import type { ItemId, Report } from '../../domain/types'
import type { ClaimSummary } from '../../hooks/useClaimSummaries'

vi.mock('../../services/reportStore', () => ({
  deleteReport: vi.fn(),
}))

const deleteReportMock = vi.mocked(deleteReport)

const report: Report = {
  id: 'r1',
  type: 'LOST',
  item: { id: 'i1' as ItemId, name: 'kocsi', category: 'Electronics' },
  location: 'itt',
  date: '2026-10-06',
  reporterName: 'Anna Kiss',
  reporterContact: 'anna@example.com',
  status: 'OPEN',
  createdAt: '2026-10-01T00:00:00Z',
}

const noClaims: ClaimSummary = { pending: 0, inProgress: false }

describe('ReportRow', () => {
  beforeEach(() => {
    deleteReportMock.mockReset()
  })

  it('shows the item name, type, category, location and date', () => {
    render(<ReportRow report={report} summary={noClaims} isOwner={false} onSelect={vi.fn()} onDeleted={vi.fn()} />)

    expect(screen.getByText('kocsi')).toBeInTheDocument()
    expect(screen.getByText('Lost')).toBeInTheDocument()
    expect(screen.getByText('Electronics')).toBeInTheDocument()
    expect(screen.getByText('itt')).toBeInTheDocument()
  })

  it('shows claim and handover badges when present', () => {
    render(
      <ReportRow
        report={report}
        summary={{ pending: 2, inProgress: true }}
        isOwner
        onSelect={vi.fn()}
        onDeleted={vi.fn()}
      />,
    )

    expect(screen.getByText('2 claims pending')).toBeInTheDocument()
    expect(screen.getByText('Handover in progress')).toBeInTheDocument()
  })

  it('clicking the card selects the report', async () => {
    const onSelect = vi.fn()
    render(<ReportRow report={report} summary={noClaims} isOwner={false} onSelect={onSelect} onDeleted={vi.fn()} />)

    await userEvent.click(screen.getByText('kocsi'))

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('does not show a delete option for a report the user does not own', () => {
    render(<ReportRow report={report} summary={noClaims} isOwner={false} onSelect={vi.fn()} onDeleted={vi.fn()} />)

    expect(screen.queryByLabelText('Delete report')).not.toBeInTheDocument()
  })

  it('clicking delete shows a confirm step without selecting the report', async () => {
    const onSelect = vi.fn()
    render(<ReportRow report={report} summary={noClaims} isOwner onSelect={onSelect} onDeleted={vi.fn()} />)

    await userEvent.click(screen.getByLabelText('Delete report'))

    expect(screen.getByLabelText('Confirm delete')).toBeInTheDocument()
    expect(screen.getByLabelText('Cancel delete')).toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
    expect(deleteReportMock).not.toHaveBeenCalled()
  })

  it('cancel returns to the trash icon without deleting', async () => {
    render(<ReportRow report={report} summary={noClaims} isOwner onSelect={vi.fn()} onDeleted={vi.fn()} />)

    await userEvent.click(screen.getByLabelText('Delete report'))
    await userEvent.click(screen.getByLabelText('Cancel delete'))

    expect(screen.getByLabelText('Delete report')).toBeInTheDocument()
    expect(deleteReportMock).not.toHaveBeenCalled()
  })

  it('confirming deletes the report and calls onDeleted, never onSelect', async () => {
    deleteReportMock.mockResolvedValue(undefined)
    const onSelect = vi.fn()
    const onDeleted = vi.fn()
    render(<ReportRow report={report} summary={noClaims} isOwner onSelect={onSelect} onDeleted={onDeleted} />)

    await userEvent.click(screen.getByLabelText('Delete report'))
    await userEvent.click(screen.getByLabelText('Confirm delete'))

    expect(deleteReportMock).toHaveBeenCalledWith('r1')
    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('shows the error message when deletion fails', async () => {
    deleteReportMock.mockRejectedValue(new Error('Cannot delete a report with an approved claim'))
    render(<ReportRow report={report} summary={noClaims} isOwner onSelect={vi.fn()} onDeleted={vi.fn()} />)

    await userEvent.click(screen.getByLabelText('Delete report'))
    await userEvent.click(screen.getByLabelText('Confirm delete'))

    expect(await screen.findByText('Cannot delete a report with an approved claim')).toBeInTheDocument()
  })
})
