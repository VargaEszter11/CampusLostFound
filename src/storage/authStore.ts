const CURRENT_USER_KEY = 'lostfound.currentUser'

export function getCurrentUser(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY)
}

export function setCurrentUser(name: string): void {
  localStorage.setItem(CURRENT_USER_KEY, name.trim())
}

export function clearCurrentUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY)
}

export function isSameUser(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}
