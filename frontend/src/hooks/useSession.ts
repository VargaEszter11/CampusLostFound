import { useEffect, useState } from 'react'
import { clearSession, getSession, subscribeToSessionExpiry, type AuthSession } from '../session/session'

export function useSession() {
  const [session, setSession] = useState<AuthSession | null>(() => getSession())

  useEffect(() => subscribeToSessionExpiry(() => setSession(null)), [])

  function signOut() {
    clearSession()
    setSession(null)
  }

  return { session, setSession, signOut }
}
