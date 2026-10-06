import { formatDate } from '../domain/format'
import { findApprovedClaim, isOwnerOf, isReportClosed } from '../domain/rules'
import type { Report } from '../domain/types'
import { useModalDialog } from '../hooks/useModalDialog'
import { useReportClaims } from '../hooks/useReportClaims'
import { ClaimAction } from './ClaimAction'
import { ClaimsPanel } from './ClaimsPanel'
import { HandoverPanel } from './HandoverPanel'

interface Props {
  readonly report: Report
  readonly onClose: () => void
  readonly onReportChanged?: () => void
  readonly currentUser: string
  readonly currentUserEmail?: string
}

export function ReportDetailsModal({ report, onClose, onReportChanged, currentUser, currentUserEmail }: Props) {
  const { dialogRef, handleClose } = useModalDialog(onClose)
  const { claims, handover, loading, error, approve, reject, confirm, afterChange } = useReportClaims(
    report.id,
    onReportChanged,
  )

  const isClosed = isReportClosed(report)
  const isOwner = isOwnerOf(report, currentUser)
  const approvedClaim = findApprovedClaim(claims)

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) handleClose()
      }}
      className="fixed inset-0 m-auto w-full max-w-lg rounded-2xl border border-line bg-surface p-8 text-ink shadow-xl backdrop:bg-black/70"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="brand-display text-2xl text-ink">{report.item.name}</h3>
        <button type="button" onClick={onClose} aria-label="Close" className="text-lg text-ink-faint hover:text-ink">
          ✕
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={report.type === 'LOST' ? 'badge-lost' : 'badge-found'}>
          {report.type === 'LOST' ? 'Lost' : 'Found'}
        </span>
        {report.item.category && <span className="chip">{report.item.category}</span>}
      </div>

      {report.item.description && <p className="mt-5 text-base text-ink-muted">{report.item.description}</p>}

      <dl className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-faint">Location</dt>
          <dd className="text-right font-medium text-ink">{report.location}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-faint">Date</dt>
          <dd className="text-right font-medium text-ink">{formatDate(report.date)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-faint">Reporter</dt>
          <dd className="text-right font-medium text-ink">{report.reporterName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-faint">Contact</dt>
          <dd className="text-right font-medium text-ink">
            {handover || isOwner ? (
              report.reporterContact
            ) : (
              <span className="font-normal text-ink-faint italic">Hidden until a claim is approved</span>
            )}
          </dd>
        </div>
      </dl>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      {loading && <p className="mt-4 text-sm text-ink-faint">Loading claims…</p>}

      <HandoverPanel
        handover={handover}
        approvedClaimContact={approvedClaim?.claimantContact}
        isOwner={isOwner}
        onConfirm={confirm}
      />

      {!isClosed && !handover && !loading && isOwner && (
        <ClaimsPanel claims={claims} onApprove={approve} onReject={reject} />
      )}

      {!isClosed && !handover && !loading && !isOwner && (
        <ClaimAction
          reportId={report.id}
          reportType={report.type}
          currentUser={currentUser}
          currentUserEmail={currentUserEmail}
          onSubmitted={() => {
            void afterChange()
          }}
        />
      )}
    </dialog>
  )
}
