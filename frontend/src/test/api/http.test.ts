import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, apiUrl, throwIfNotOk } from '../../api/http'
import { clearSession, setSession } from '../../session/session'
import { API_BASE } from '../../api/config'

describe('throwIfNotOk', () => {
  it('does nothing for an ok response', async () => {
    await expect(throwIfNotOk(new Response('{}', { status: 200 }))).resolves.toBeUndefined()
  })

  it('throws the server "error" message', async () => {
    const res = new Response(JSON.stringify({ error: 'Contact is required' }), { status: 400 })

    await expect(throwIfNotOk(res)).rejects.toThrow('Contact is required')
  })

  it('falls back to "message" when there is no "error"', async () => {
    const res = new Response(JSON.stringify({ message: 'Something went wrong' }), { status: 500 })

    await expect(throwIfNotOk(res)).rejects.toThrow('Something went wrong')
  })

  it('joins validation "fields" into one message', async () => {
    const res = new Response(
      JSON.stringify({ fields: { itemName: 'must not be blank', location: 'must not be blank' } }),
      { status: 400 },
    )

    await expect(throwIfNotOk(res)).rejects.toThrow('must not be blank, must not be blank')
  })

  it('falls back to a status-based message when the body is not JSON', async () => {
    const res = new Response('not json', { status: 503 })

    await expect(throwIfNotOk(res)).rejects.toThrow('Request failed (503)')
  })
})

describe('apiUrl', () => {
  it('prefixes the path with the API base', () => {
    expect(apiUrl('/api/reports')).toBe(`${API_BASE}/api/reports`)
  })
})

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    clearSession()
  })

  it('does not set an Authorization header when signed out', async () => {
    await apiFetch('/api/reports')

    const [, init] = vi.mocked(fetch).mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(headers.has('Authorization')).toBe(false)
  })

  it('attaches the bearer token when signed in', async () => {
    setSession({ token: 'jwt-token', userId: 'u1', displayName: 'Anna', email: 'a@example.com', isAdmin: false })

    await apiFetch('/api/reports')

    const [, init] = vi.mocked(fetch).mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(headers.get('Authorization')).toBe('Bearer jwt-token')
  })

  it('sets JSON content type when a body is present and none was set', async () => {
    await apiFetch('/api/reports', { method: 'POST', body: '{}' })

    const [, init] = vi.mocked(fetch).mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('expires the session on a 401 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
    setSession({ token: 'jwt-token', userId: 'u1', displayName: 'Anna', email: 'a@example.com', isAdmin: false })

    await apiFetch('/api/reports')

    expect(localStorage.getItem('lostfound.authSession')).toBeNull()
  })
})
