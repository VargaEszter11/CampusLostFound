import { DEMO_PASSWORD, DEMO_USERS } from '../domain/demoUsers'
import type { LoginFormState } from '../hooks/useLoginForm'
import { FieldError } from './FieldError'

interface Props {
  readonly form: LoginFormState
  readonly busy: boolean
  readonly error: string | undefined
}

export function LoginForm({ form, busy, error }: Props) {
  const { mode } = form

  return (
    <>
      <div className="mb-5 flex gap-1 rounded-lg border border-line bg-paper p-1">
        <button
          type="button"
          onClick={() => form.switchMode('login')}
          className={
            mode === 'login'
              ? 'flex-1 rounded-md bg-line py-1.5 text-sm font-semibold text-ink'
              : 'flex-1 rounded-md py-1.5 text-sm font-medium text-ink-muted hover:text-ink'
          }
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => form.switchMode('register')}
          className={
            mode === 'register'
              ? 'flex-1 rounded-md bg-line py-1.5 text-sm font-semibold text-ink'
              : 'flex-1 rounded-md py-1.5 text-sm font-medium text-ink-muted hover:text-ink'
          }
        >
          Register
        </button>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void form.submit()
        }}
        className="space-y-4"
      >
        {mode === 'register' && (
          <div>
            <label htmlFor="displayName" className="field-label">
              Your name
            </label>
            <input
              id="displayName"
              value={form.displayName}
              onChange={(e) => form.onDisplayNameChange(e.target.value)}
              placeholder="Full name"
              aria-invalid={form.displayNameError ? true : undefined}
              className="field-input"
            />
            <FieldError message={form.displayNameError} />
          </div>
        )}

        <div>
          <label htmlFor="loginEmail" className="field-label">
            Email
          </label>
          <input
            id="loginEmail"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => form.onEmailChange(e.target.value)}
            placeholder="you@example.com"
            aria-invalid={form.emailError ? true : undefined}
            className="field-input"
          />
          <FieldError message={form.emailError} />
        </div>

        <div>
          <label htmlFor="loginPassword" className="field-label">
            Password
          </label>
          <input
            id="loginPassword"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={form.password}
            onChange={(e) => form.onPasswordChange(e.target.value)}
            placeholder={mode === 'login' ? 'Your password' : 'At least 6 characters'}
            aria-invalid={form.passwordError ? true : undefined}
            className="field-input"
          />
          <FieldError message={form.passwordError} />
        </div>

        <FieldError message={error} />

        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <div className="mt-6 border-t border-line pt-5">
        <p className="mb-2 text-xs text-ink-faint">
          Demo users (password <span className="font-mono text-ink-muted">{DEMO_PASSWORD}</span>):
        </p>
        <div className="flex flex-wrap gap-2">
          {DEMO_USERS.map((user) => (
            <button key={user.email} type="button" onClick={() => form.fillDemoUser(user)} className="chip">
              {user.displayName}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
