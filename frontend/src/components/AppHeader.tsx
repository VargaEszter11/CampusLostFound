import type { NotificationTarget } from '../services/notificationStore'
import { NotificationBell } from './NotificationBell'

interface Props {
  readonly userName: string
  readonly onNavigate: (target: NotificationTarget) => void
  readonly onSignOut: () => void
}

export function AppHeader({ userName, onNavigate, onSignOut }: Props) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="brand-display text-4xl text-ink sm:text-5xl">Lost & Found</h1>
        <p className="mt-2 max-w-md text-base text-ink-muted">Report and reclaim items on campus.</p>
      </div>
      <div className="flex shrink-0 items-center gap-3 pt-1">
        <NotificationBell onNavigate={onNavigate} />
        <div className="hidden text-right text-sm sm:block">
          <p className="font-medium text-ink">{userName}</p>
          <button
            type="button"
            onClick={onSignOut}
            className="text-ink-muted underline-offset-2 hover:text-teal hover:underline"
          >
            Sign out
          </button>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="text-sm text-ink-muted underline-offset-2 hover:text-teal hover:underline sm:hidden"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
