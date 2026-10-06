import { useCallback, useEffect, useRef, useState } from 'react'
import type { Claim, Handover, Report } from '../domain/types'
import {
  approveClaim,
  confirmHandover,
  getClaimsForReport,
  getHandoverForReport,
  rejectClaim,
} from '../storage/claimStore'
import { isSameUser } from '../storage/authStore'
import { notifyNotificationsChanged } from '../storage/notificationStore'
import { ClaimForm } from './ClaimForm'

interface Props {
  readonly report: Report
  readonly onClose: () => void
  readonly onReportChanged?: () => void
  readonly currentUser: string
  readonly currentUserEmail?: string
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return DATE_FORMAT.format(d)
}

export function ReportDetailsModal({
  report,
  onClose,
  onReportChanged,
  currentUser,
  currentUserEmail,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closingProgrammatically = useRef(false)
  const onReportChangedRef = useRef(onReportChanged)
  const [claims, setClaims] = useState<Claim[]>([])
  const [handover, setHandover] = useState<Handover | undefined>()
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState<string>()
  const [showClaimForm, setShowClaimForm] = useState(false)
  const isClosed = report.status === 'CLOSED'
  const isOwner = isSameUser(currentUser, report.reporterName)
  const approvedClaim = claims.find((c) => c.status === 'APPROVED')

  useEffect(() => {
    onReportChangedRef.current = onReportChanged
  }, [onReportChanged])

  const loadClaims = useCallback(async () => {
    const [nextClaims, nextHandover] = await Promise.all([
      getClaimsForReport(report.id),
      getHandoverForReport(report.id),
    ])
    setClaims(nextClaims)
    setHandover(nextHandover)
  }, [report.id])

  async function refreshAfterChange() {
    setActionError(undefined)
    await loadClaims()
    onReportChangedRef.current?.()
    notifyNotificationsChanged()
  }

  useEffect(() => {
    let cancelled = false
    void Promise.all([getClaimsForReport(report.id), getHandoverForReport(report.id)])
      .then(([nextClaims, nextHandover]) => {
        if (cancelled) return
        setClaims(nextClaims)
        setHandover(nextHandover)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setActionError(err instanceof Error ? err.message : 'Failed to load claims')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [report.id])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    return () => {
      closingProgrammatically.current = true
      dialog.close()
    }
  }, [])

  function handleClose() {
    if (closingProgrammatically.current) {
      closingProgrammatically.current = false
      return
    }
    onClose()
  }

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
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-lg text-ink-faint hover:text-ink"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={report.type === 'LOST' ? 'badge-lost' : 'badge-found'}>
          {report.type === 'LOST' ? 'Lost' : 'Found'}
        </span>
        {report.item.category && <span className="chip">{report.item.category}</span>}
      </div>

      {report.item.description && (
        <p className="mt-5 text-base text-ink-muted">{report.item.description}</p>
      )}

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

      {actionError && <p className="mt-4 text-sm text-danger">{actionError}</p>}
      {loading && <p className="mt-4 text-sm text-ink-faint">Loading claims…</p>}

      {handover && !handover.confirmed && (
        <div className="info-callout mt-5 space-y-3">
          <div>
            <p className="text-sm font-semibold">Claim approved — contact info shared</p>
            <p className="mt-1 text-sm">
              Handover code: <span className="font-mono font-semibold">{handover.handoverCode}</span>
            </p>
          </div>
          {isOwner && approvedClaim && (
            <p className="text-sm">{approvedClaim.claimantContact}</p>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => {
                void confirmHandover(report.id)
                  .then(() => refreshAfterChange())
                  .catch((err: unknown) => {
                    setActionError(err instanceof Error ? err.message : 'Failed to confirm handover')
                  })
              }}
              className="btn-primary"
            >
              Mark as handed over
            </button>
          )}
        </div>
      )}

      {handover?.confirmed && (
        <div className="info-callout mt-5">
          <p className="text-sm font-semibold">Claim approved — item handed over</p>
          <p className="mt-1 text-sm">
            Handover code: <span className="font-mono font-semibold">{handover.handoverCode}</span>
          </p>
        </div>
      )}

      {!isClosed && !handover && isOwner && !loading && (
        <div className="mt-5 border-t border-line pt-5">
          <h4 className="text-sm font-semibold text-ink">Claims</h4>
          {claims.length === 0 ? (
            <p className="mt-2 text-sm text-ink-faint">No claims yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {claims.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{c.claimantName}</p>
                    {c.status !== 'PENDING' && (
                      <p className="text-xs text-ink-faint">
                        {c.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                      </p>
                    )}
                  </div>
                  {c.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void approveClaim(c.id)
                            .then(() => refreshAfterChange())
                            .catch((err: unknown) => {
                              setActionError(err instanceof Error ? err.message : 'Failed to approve claim')
                            })
                        }}
                        className="rounded bg-teal-soft px-3 py-1 text-xs font-semibold text-teal hover:bg-mint"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void rejectClaim(c.id)
                            .then(() => refreshAfterChange())
                            .catch((err: unknown) => {
                              setActionError(err instanceof Error ? err.message : 'Failed to reject claim')
                            })
                        }}
                        className="rounded bg-danger-soft px-3 py-1 text-xs font-semibold text-danger hover:opacity-80"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!isClosed && !handover && !isOwner && !loading && (
        <div className="mt-5 border-t border-line pt-5">
          {showClaimForm ? (
            <ClaimForm
              reportId={report.id}
              reportType={report.type}
              claimantName={currentUser}
              defaultContact={currentUserEmail}
              onSubmitted={() => {
                setShowClaimForm(false)
                void refreshAfterChange()
              }}
              onCancel={() => setShowClaimForm(false)}
            />
          ) : (
            <button type="button" onClick={() => setShowClaimForm(true)} className="btn-secondary w-full">
              {report.type === 'FOUND' ? 'This is mine' : 'Found it'}
            </button>
          )}
        </div>
      )}
    </dialog>
  )
}
