import { useEffect, useRef, useState } from 'react'
import { loginWithGoogle } from '../services/authService'
import { GOOGLE_CLIENT_ID } from '../api/config'
import type { AuthSession } from '../session/session'
import { setSession } from '../session/session'

function waitForGoogle(timeoutMs = 8000): Promise<NonNullable<Window['google']>> {
  const started = Date.now()
  return new Promise((resolve, reject) => {
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

export function useGoogleSignIn(onSignedIn: (session: AuthSession) => void) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const onSignedInRef = useRef(onSignedIn)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    onSignedInRef.current = onSignedIn
  }, [onSignedIn])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) {
      return
    }

    let cancelled = false

    void waitForGoogle()
      .then((google) => {
        if (cancelled || !buttonRef.current) return

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            const idToken = response.credential
            if (!idToken) {
              setError('Google Sign-In did not return a credential')
              return
            }
            setBusy(true)
            setError(undefined)
            void loginWithGoogle(idToken)
              .then((session) => {
                setSession(session)
                onSignedInRef.current(session)
              })
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Google Sign-In failed')
              })
              .finally(() => {
                setBusy(false)
              })
          },
          ux_mode: 'popup',
          context: 'signin',
        })

        buttonRef.current.innerHTML = ''
        google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 320,
        })
        setReady(true)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Google Sign-In failed to load')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { buttonRef, ready, busy, error }
}
