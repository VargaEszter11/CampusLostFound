import type { AuthSession } from '../session/session'
import { apiUrl, throwIfNotOk } from '../api/http'

interface AuthResponse {
  token: string
  userId: string
  displayName: string
  email: string
}

function toSession(dto: AuthResponse): AuthSession {
  return {
    token: dto.token,
    userId: dto.userId,
    displayName: dto.displayName,
    email: dto.email,
  }
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const res = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  await throwIfNotOk(res)
  return toSession((await res.json()) as AuthResponse)
}

export async function register(
  displayName: string,
  email: string,
  password: string,
): Promise<AuthSession> {
  const res = await fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, email, password }),
  })
  await throwIfNotOk(res)
  return toSession((await res.json()) as AuthResponse)
}

export async function loginWithGoogle(idToken: string): Promise<AuthSession> {
  const res = await fetch(apiUrl('/api/auth/google'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  await throwIfNotOk(res)
  return toSession((await res.json()) as AuthResponse)
}
