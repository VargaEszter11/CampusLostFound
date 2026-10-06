import type { Claim } from '../domain/types'
import { isApproved, isPending } from '../domain/rules'

interface Props {
  readonly claims: Claim[]
  readonly onApprove: (claimId: string) => void
  readonly onReject: (claimId: string) => void
}

export function ClaimsPanel({ claims, onApprove, onReject }: Props) {
  return (
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
                {!isPending(c) && (
                  <p className="text-xs text-ink-faint">{isApproved(c) ? 'Approved' : 'Rejected'}</p>
                )}
              </div>
              {isPending(c) && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onApprove(c.id)}
                    className="rounded bg-teal-soft px-3 py-1 text-xs font-semibold text-teal hover:bg-mint"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(c.id)}
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
  )
}
