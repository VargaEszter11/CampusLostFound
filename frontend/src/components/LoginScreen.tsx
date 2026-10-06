import { useLoginForm } from '../hooks/useLoginForm'
import { useGoogleSignIn } from '../hooks/useGoogleSignIn'
import type { AuthSession } from '../session/session'
import { GoogleSignInButton } from './GoogleSignInButton'
import { LoginForm } from './LoginForm'

interface Props {
  readonly onLogin: (session: AuthSession) => void
}

export function LoginScreen({ onLogin }: Props) {
  const form = useLoginForm(onLogin)
  const google = useGoogleSignIn(onLogin)

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4 py-12">
      <div className="panel-enter w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="brand-display text-4xl text-ink">Lost & Found</h1>
          <p className="mt-2 text-sm text-ink-muted">Report and reclaim items on campus.</p>
        </div>

        <div className="surface-panel">
          <GoogleSignInButton buttonRef={google.buttonRef} ready={google.ready} />
          <LoginForm
            form={form}
            busy={form.submitting || google.busy}
            error={form.formError ?? google.error}
          />
        </div>
      </div>
    </div>
  )
}
