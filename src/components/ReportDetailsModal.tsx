import { useEffect, useRef } from 'react'
import type { Report } from '../domain/types'

interface Props {
  readonly report: Report
  readonly onClose: () => void
}

export function ReportDetailsModal({ report, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closingProgrammatically = useRef(false)

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
        <p className="text-base text-gray-400">✉️ {report.reporterContact}</p>
      </div>
    </dialog>
  )
}
