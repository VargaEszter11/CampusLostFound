import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearSession,
  expireSession,
  getAuthToken,
  getSession,
  setSession,
  subscribeToSessionExpiry,
  type AuthSession,
} from '../../session/session'

const session: AuthSession = {
  token: 'jwt-token',
  userId: 'u1',
  displayName: 'Anna Kiss',
  email: 'anna@example.com',
  isAdmin: false,
}

describe('session', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing is stored', () => {
    expect(getSession()).toBeNull()
  })

  it('round-trips a session through setSession/getSession', () => {
    setSession(session)

    expect(getSession()).toEqual(session)
  })

  it('treats a missing isAdmin as false', () => {
    localStorage.setItem(
      'lostfound.authSession',
      JSON.stringify({ token: 't', userId: 'u1', displayName: 'Anna', email: 'a@example.com' }),
    )

    expect(getSession()?.isAdmin).toBe(false)
  })

  it('clears and removes a corrupt session, returning null', () => {
    localStorage.setItem('lostfound.authSession', '{not json')

    expect(getSession()).toBeNull()
    expect(localStorage.getItem('lostfound.authSession')).toBeNull()
  })

  it('clears and removes a session missing required fields', () => {
    localStorage.setItem('lostfound.authSession', JSON.stringify({ token: 't' }))

    expect(getSession()).toBeNull()
    expect(localStorage.getItem('lostfound.authSession')).toBeNull()
  })

  it('clearSession removes the stored session', () => {
    setSession(session)
    clearSession()

    expect(getSession()).toBeNull()
  })

  it('getAuthToken returns the token when signed in, null otherwise', () => {
    expect(getAuthToken()).toBeNull()

    setSession(session)
    expect(getAuthToken()).toBe('jwt-token')
  })
})

describe('session expiry', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('expireSession clears the session and notifies subscribers', () => {
    setSession(session)
    const onExpired = vi.fn()
    const unsubscribe = subscribeToSessionExpiry(onExpired)

    expireSession()

    expect(getSession()).toBeNull()
    expect(onExpired).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('unsubscribe stops further notifications', () => {
    const onExpired = vi.fn()
    const unsubscribe = subscribeToSessionExpiry(onExpired)
    unsubscribe()

    expireSession()

    expect(onExpired).not.toHaveBeenCalled()
  })
})
