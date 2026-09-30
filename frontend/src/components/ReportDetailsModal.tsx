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
}

export function ReportDetailsModal({ report, onClose, onReportChanged, currentUser }: Props) {
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
    setLoading(true)
    setActionError(undefined)
    void loadClaims()
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
  }, [loadClaims])

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
      className="fixed inset-0 m-auto w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-900 p-8 text-white backdrop:bg-black/70"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-2xl font-bold text-white">{report.item.name}</h3>
        <button onClick={onClose} aria-label="Close" className="text-xl text-gray-400 hover:text-white">
          ✕
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <span
          className={
            report.type === 'LOST'
              ? 'rounded-full bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-300'
              : 'rounded-full bg-green-500/20 px-3 py-1.5 text-sm font-medium text-green-300'
          }
        >
          {report.type === 'LOST' ? 'Lost' : 'Found'}
        </span>
        {report.item.category && (
          <span className="rounded-full bg-neutral-800 px-3 py-1.5 text-sm text-gray-300">
            {report.item.category}
          </span>
        )}
      </div>

      {report.item.description && (
        <p className="mt-5 text-base text-gray-300">{report.item.description}</p>
      )}

      <div className="mt-5 space-y-2 border-t border-white/10 pt-5">
        <p className="text-base text-gray-400">📍 {report.location}</p>
        <p className="text-base text-gray-400">📅 {report.date}</p>
        <p className="text-base text-gray-400">👤 {report.reporterName}</p>
        {handover || isOwner ? (
          <p className="text-base text-gray-400">✉️ {report.reporterContact}</p>
        ) : (
          <p className="text-base text-gray-500 italic">
            ✉️ Contact hidden until a claim is approved
          </p>
        )}
      </div>

      {actionError && <p className="mt-4 text-sm text-red-300">{actionError}</p>}
      {loading && <p className="mt-4 text-sm text-gray-500">Loading claims…</p>}

      {handover && !handover.confirmed && (
        <div className="mt-5 space-y-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
          <div>
            <p className="text-sm font-semibold text-blue-300">Claim approved — contact info shared</p>
            <p className="mt-1 text-sm text-blue-200">
              Handover code: <span className="font-mono font-semibold">{handover.handoverCode}</span>
            </p>
          </div>
          {isOwner && approvedClaim && (
            <p className="text-sm text-blue-200">✉️ {approvedClaim.claimantContact}</p>
          )}
          {isOwner && (
            <button
              onClick={() => {
                void confirmHandover(report.id)
                  .then(() => refreshAfterChange())
                  .catch((err: unknown) => {
                    setActionError(err instanceof Error ? err.message : 'Failed to confirm handover')
                  })
              }}
              className="w-full rounded-xl bg-blue-500/20 py-2.5 text-sm font-semibold text-blue-200 hover:bg-blue-500/30"
            >
              Mark as handed over
            </button>
          )}
        </div>
      )}

      {handover?.confirmed && (
        <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-300">Claim approved — item handed over</p>
          <p className="mt-1 text-sm text-emerald-200">
            Handover code: <span className="font-mono font-semibold">{handover.handoverCode}</span>
          </p>
        </div>
      )}

      {!isClosed && !handover && isOwner && !loading && (
        <div className="mt-5 border-t border-white/10 pt-5">
          <h4 className="text-sm font-semibold text-white">Claims</h4>
          {claims.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No claims yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {claims.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-neutral-800/60 px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-white">{c.claimantName}</p>
                    {c.status !== 'PENDING' && (
                      <p className="text-xs text-gray-500">{c.status === 'APPROVED' ? 'Approved' : 'Rejected'}</p>
                    )}
                  </div>
                  {c.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          void approveClaim(c.id)
                            .then(() => refreshAfterChange())
                            .catch((err: unknown) => {
                              setActionError(err instanceof Error ? err.message : 'Failed to approve claim')
                            })
                        }}
                        className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          void rejectClaim(c.id)
                            .then(() => refreshAfterChange())
                            .catch((err: unknown) => {
                              setActionError(err instanceof Error ? err.message : 'Failed to reject claim')
                            })
                        }}
                        className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-500/30"
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
        <div className="mt-5 border-t border-white/10 pt-5">
          {showClaimForm ? (
            <ClaimForm
              reportId={report.id}
              reportType={report.type}
              claimantName={currentUser}
              onSubmitted={() => {
                setShowClaimForm(false)
                void refreshAfterChange()
              }}
              onCancel={() => setShowClaimForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowClaimForm(true)}
              className="w-full rounded-xl border border-white/10 py-2.5 text-sm font-medium text-gray-300 hover:border-white/30 hover:text-white"
            >
              {report.type === 'FOUND' ? 'This is mine' : 'Found it'}
            </button>
          )}
        </div>
      )}
    </dialog>
  )
}
