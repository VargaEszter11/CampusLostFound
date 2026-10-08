export interface AuthSession {
  token: string
  userId: string
  displayName: string
  email: string
  isAdmin: boolean
}

const SESSION_KEY = 'lostfound.authSession'

export function getSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>
    if (
      typeof parsed.token === 'string' &&
      typeof parsed.userId === 'string' &&
      typeof parsed.displayName === 'string' &&
      typeof parsed.email === 'string'
    ) {
      return {
        token: parsed.token,
        userId: parsed.userId,
        displayName: parsed.displayName,
        email: parsed.email,
        isAdmin: parsed.isAdmin === true,
      }
    }
  } catch {
    // ignore corrupt session
  }
  localStorage.removeItem(SESSION_KEY)
  return null
}

export function setSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function getAuthToken(): string | null {
  return getSession()?.token ?? null
}


const AUTH_EXPIRED_EVENT = 'lostfound:auth-expired'

export function expireSession(): void {
  clearSession()
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
}

export function subscribeToSessionExpiry(onExpired: () => void): () => void {
  window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
  return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
}
