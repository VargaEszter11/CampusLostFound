import { useCallback, useEffect, useState } from 'react'
import { fetchCurrentUser } from '../services/authService'
import {
  clearSession,
  getSession,
  setSession as storeSession,
  subscribeToSessionExpiry,
  type AuthSession,
} from '../session/session'

export function useSession() {
  const [session, setSession] = useState<AuthSession | null>(() => getSession())

  useEffect(() => subscribeToSessionExpiry(() => setSession(null)), [])

  // Refresh the stored session once on load so changes to the admin list take effect without re-login.
  useEffect(() => {
    if (!getSession()) return
    let cancelled = false
    void fetchCurrentUser()
      .then((fresh) => {
        if (cancelled) return
        storeSession(fresh)
        setSession(fresh)
      })
      .catch(() => {
        // keep the stored session; a 401 already expires it via apiFetch
      })
    return () => {
      cancelled = true
    }
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  return { session, setSession, signOut }
}
