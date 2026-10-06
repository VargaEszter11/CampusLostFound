import type { Handover } from '../domain/types'

interface Props {
  readonly handover: Handover | undefined
  readonly approvedClaimContact: string | undefined
  readonly isOwner: boolean
  readonly onConfirm: () => void
}

export function HandoverPanel({ handover, approvedClaimContact, isOwner, onConfirm }: Props) {
  if (!handover) return null

  if (handover.confirmed) {
    return (
      <div className="info-callout mt-5">
        <p className="text-sm font-semibold">Claim approved — item handed over</p>
        <p className="mt-1 text-sm">
          Handover code: <span className="font-mono font-semibold">{handover.handoverCode}</span>
        </p>
      </div>
    )
  }

  return (
    <div className="info-callout mt-5 space-y-3">
      <div>
        <p className="text-sm font-semibold">Claim approved — contact info shared</p>
        <p className="mt-1 text-sm">
          Handover code: <span className="font-mono font-semibold">{handover.handoverCode}</span>
        </p>
      </div>
      {isOwner && approvedClaimContact && <p className="text-sm">{approvedClaimContact}</p>}
      {isOwner && (
        <button type="button" onClick={onConfirm} className="btn-primary">
          Mark as handed over
        </button>
      )}
    </div>
  )
}
