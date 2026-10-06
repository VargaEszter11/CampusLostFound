import { useCallback, useEffect, useState } from 'react'
import { clearSession, getSession, subscribeToSessionExpiry, type AuthSession } from '../session/session'

export function useSession() {
  const [session, setSession] = useState<AuthSession | null>(() => getSession())

  useEffect(() => subscribeToSessionExpiry(() => setSession(null)), [])

  const signOut = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  return { session, setSession, signOut }
}
