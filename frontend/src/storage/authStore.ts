export interface AuthSession {
  token: string
  userId: string
  displayName: string
  email: string
}

const SESSION_KEY = 'lostfound.authSession'
const LEGACY_USER_KEY = 'lostfound.currentUser'

// Drop pre-API localStorage copies and legacy mock login key.
localStorage.removeItem('lostfound.reports')
localStorage.removeItem('lostfound.claims')
localStorage.removeItem('lostfound.handovers')
localStorage.removeItem(LEGACY_USER_KEY)

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

export function isSameUser(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}
