import { API_BASE } from './config'
import { expireSession, getAuthToken } from '../session/session'

export async function throwIfNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = (await res.json()) as { error?: string; fields?: Record<string, string>; message?: string }
      if (body.error) message = body.error
      else if (body.message) message = body.message
      else if (body.fields) message = Object.values(body.fields).join(', ')
    } catch {
      // keep default
    }
    throw new Error(message)
  }
}

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  const token = getAuthToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (init.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(apiUrl(path), { ...init, headers })
  if (res.status === 401) {
    expireSession()
  }
  return res
}
