import { useEffect, useRef, useState } from 'react'
import { login, loginWithGoogle, register } from '../api/authApi'
import { GOOGLE_CLIENT_ID } from '../api/config'
import { DEMO_PASSWORD, DEMO_USERS } from '../domain/demoUsers'
import type { AuthSession } from '../storage/authStore'
import { setSession } from '../storage/authStore'
import { FieldError } from './FieldError'

interface Props {
  readonly onLogin: (session: AuthSession) => void
}

type Mode = 'login' | 'register'

function waitForGoogle(timeoutMs = 8000): Promise<NonNullable<Window['google']>> {
  return new Promise((resolve, reject) => {
    const started = Date.now()
    const tick = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google)
        return
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('Google Sign-In failed to load'))
        return
      }
      window.setTimeout(tick, 50)
    }
    tick()
  })
}

export function LoginScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<Mode>('login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayNameError, setDisplayNameError] = useState<string>()
  const [emailError, setEmailError] = useState<string>()
  const [passwordError, setPasswordError] = useState<string>()
  const [formError, setFormError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const onLoginRef = useRef(onLogin)
  onLoginRef.current = onLogin

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) {
      return
    }

    let cancelled = false

    void waitForGoogle()
      .then((google) => {
        if (cancelled || !googleButtonRef.current) return

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            const idToken = response.credential
            if (!idToken) {
              setFormError('Google Sign-In did not return a credential')
              return
            }
            setSubmitting(true)
            setFormError(undefined)
            void loginWithGoogle(idToken)
              .then((session) => {
                setSession(session)
                onLoginRef.current(session)
              })
              .catch((err: unknown) => {
                setFormError(err instanceof Error ? err.message : 'Google Sign-In failed')
              })
              .finally(() => {
                setSubmitting(false)
              })
          },
          ux_mode: 'popup',
          context: 'signin',
        })

        googleButtonRef.current.innerHTML = ''
        google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 320,
        })
        setGoogleReady(true)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setFormError(err instanceof Error ? err.message : 'Google Sign-In failed to load')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  function clearFieldErrors() {
    setDisplayNameError(undefined)
    setEmailError(undefined)
    setPasswordError(undefined)
    setFormError(undefined)
  }

  function validate(): boolean {
    let ok = true
    if (mode === 'register' && !displayName.trim()) {
      setDisplayNameError('Name is required')
      ok = false
    }
    if (!email.trim()) {
      setEmailError('Email is required')
      ok = false
    }
    if (!password) {
      setPasswordError('Password is required')
      ok = false
    } else if (mode === 'register' && password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      ok = false
    }
    return ok
  }

  async function submit() {
    clearFieldErrors()
    if (!validate()) return

    setSubmitting(true)
    try {
      const session =
        mode === 'login'
          ? await login(email.trim(), password)
          : await register(displayName.trim(), email.trim(), password)
      setSession(session)
      onLogin(session)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-white/5 blur-3xl"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900/60 p-8 shadow-xl backdrop-blur">
        <h1 className="mb-1 text-2xl font-bold text-white">Lost & Found</h1>
        <p className="mb-6 text-sm text-gray-400">Sign in to report items and manage your claims.</p>

        <div className="mb-5 flex gap-2 rounded-lg border border-white/10 bg-neutral-950/40 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              clearFieldErrors()
            }}
            className={
              mode === 'login'
                ? 'flex-1 rounded-md bg-white/10 py-1.5 text-sm font-semibold text-white'
                : 'flex-1 rounded-md py-1.5 text-sm font-medium text-gray-400 hover:text-gray-200'
            }
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register')
              clearFieldErrors()
            }}
            className={
              mode === 'register'
                ? 'flex-1 rounded-md bg-white/10 py-1.5 text-sm font-semibold text-white'
                : 'flex-1 rounded-md py-1.5 text-sm font-medium text-gray-400 hover:text-gray-200'
            }
          >
            Register
          </button>
        </div>

        <div className="mb-5">
          {GOOGLE_CLIENT_ID ? (
            <div className="flex flex-col items-center gap-2">
              <div ref={googleButtonRef} className="flex min-h-10 w-full justify-center" />
              {!googleReady && (
                <p className="text-xs text-gray-500">Loading Google Sign-In…</p>
              )}
            </div>
          ) : (
            <p className="rounded-lg border border-white/10 bg-neutral-950/40 px-3 py-2 text-xs text-gray-500">
              Google Sign-In is unavailable until <span className="font-mono">VITE_GOOGLE_CLIENT_ID</span> is
              set.
            </p>
          )}
          <div className="my-4 flex items-center gap-3 text-xs text-gray-500">
            <div className="h-px flex-1 bg-white/10" />
            <span>or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
          className="space-y-4"
        >
          {mode === 'register' && (
            <div>
              <label htmlFor="displayName" className="mb-1 block text-xs font-medium text-gray-400">
                Your name
              </label>
              <input
                id="displayName"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                  if (displayNameError) setDisplayNameError(undefined)
                }}
                placeholder="Full name"
                aria-invalid={displayNameError ? true : undefined}
                className="w-full rounded-lg border border-white/10 bg-neutral-800/60 px-3 py-2 text-white placeholder-gray-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
              />
              <FieldError message={displayNameError} />
            </div>
          )}

          <div>
            <label htmlFor="loginEmail" className="mb-1 block text-xs font-medium text-gray-400">
              Email
            </label>
            <input
              id="loginEmail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError(undefined)
              }}
              placeholder="you@example.com"
              aria-invalid={emailError ? true : undefined}
              className="w-full rounded-lg border border-white/10 bg-neutral-800/60 px-3 py-2 text-white placeholder-gray-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
            />
            <FieldError message={emailError} />
          </div>

          <div>
            <label htmlFor="loginPassword" className="mb-1 block text-xs font-medium text-gray-400">
              Password
            </label>
            <input
              id="loginPassword"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (passwordError) setPasswordError(undefined)
              }}
              placeholder={mode === 'login' ? 'Your password' : 'At least 6 characters'}
              aria-invalid={passwordError ? true : undefined}
              className="w-full rounded-lg border border-white/10 bg-neutral-800/60 px-3 py-2 text-white placeholder-gray-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
            />
            <FieldError message={passwordError} />
          </div>

          <FieldError message={formError} />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-linear-to-b from-white to-gray-200 py-2.5 font-semibold text-neutral-900 shadow-sm transition hover:from-gray-100 hover:to-gray-300 disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="mb-2 text-xs text-gray-500">
            Demo users (password <span className="font-mono text-gray-400">{DEMO_PASSWORD}</span>):
          </p>
          <div className="flex flex-wrap gap-2">
            {DEMO_USERS.map((user) => (
              <button
                key={user.email}
                type="button"
                onClick={() => {
                  setMode('login')
                  setDisplayName(user.displayName)
                  setEmail(user.email)
                  setPassword(DEMO_PASSWORD)
                  clearFieldErrors()
                }}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-white/30 hover:text-white"
              >
                {user.displayName}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
