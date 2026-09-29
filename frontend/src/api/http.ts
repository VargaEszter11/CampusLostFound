import { API_BASE } from './config'

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
