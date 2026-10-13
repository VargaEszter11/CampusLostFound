import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLoginForm } from '../../hooks/useLoginForm'
import { login, register } from '../../services/authService'
import { setSession } from '../../session/session'
import type { AuthSession } from '../../session/session'

vi.mock('../../services/authService', () => ({
  login: vi.fn(),
  register: vi.fn(),
}))

vi.mock('../../session/session', () => ({
  setSession: vi.fn(),
}))

const loginMock = vi.mocked(login)
const registerMock = vi.mocked(register)
const setSessionMock = vi.mocked(setSession)

const session: AuthSession = {
  token: 't',
  userId: 'u1',
  displayName: 'Anna Kiss',
  email: 'anna@example.com',
  isAdmin: false,
}

describe('useLoginForm', () => {
  beforeEach(() => {
    loginMock.mockReset()
    registerMock.mockReset()
    setSessionMock.mockReset()
  })

  it('rejects an empty submit with field errors and does not call the API', async () => {
    const onLogin = vi.fn()
    const { result } = renderHook(() => useLoginForm(onLogin))

    await act(async () => result.current.submit())

    expect(result.current.emailError).toBe('Email is required')
    expect(result.current.passwordError).toBe('Password is required')
    expect(loginMock).not.toHaveBeenCalled()
    expect(onLogin).not.toHaveBeenCalled()
  })

  it('register mode also requires a display name and a 6+ character password', async () => {
    const { result } = renderHook(() => useLoginForm(vi.fn()))

    act(() => result.current.switchMode('register'))
    act(() => result.current.onEmailChange('anna@example.com'))
    act(() => result.current.onPasswordChange('short'))

    await act(async () => result.current.submit())

    expect(result.current.displayNameError).toBe('Name is required')
    expect(result.current.passwordError).toBe('Password must be at least 6 characters')
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('logs in with trimmed email and the entered password', async () => {
    loginMock.mockResolvedValue(session)
    const onLogin = vi.fn()
    const { result } = renderHook(() => useLoginForm(onLogin))

    act(() => result.current.onEmailChange('  anna@example.com  '))
    act(() => result.current.onPasswordChange('secret1'))
    await act(async () => result.current.submit())

    expect(loginMock).toHaveBeenCalledWith('anna@example.com', 'secret1')
    expect(setSessionMock).toHaveBeenCalledWith(session)
    expect(onLogin).toHaveBeenCalledWith(session)
  })

  it('registers with trimmed name and email in register mode', async () => {
    registerMock.mockResolvedValue(session)
    const { result } = renderHook(() => useLoginForm(vi.fn()))

    act(() => result.current.switchMode('register'))
    act(() => result.current.onDisplayNameChange('  Anna Kiss  '))
    act(() => result.current.onEmailChange('  anna@example.com  '))
    act(() => result.current.onPasswordChange('secret1'))
    await act(async () => result.current.submit())

    expect(registerMock).toHaveBeenCalledWith('Anna Kiss', 'anna@example.com', 'secret1')
  })

  it('shows the server error and does not call onLogin when the API rejects', async () => {
    loginMock.mockRejectedValue(new Error('Invalid email or password'))
    const onLogin = vi.fn()
    const { result } = renderHook(() => useLoginForm(onLogin))

    act(() => result.current.onEmailChange('anna@example.com'))
    act(() => result.current.onPasswordChange('wrong'))
    await act(async () => result.current.submit())

    await waitFor(() => expect(result.current.formError).toBe('Invalid email or password'))
    expect(result.current.submitting).toBe(false)
    expect(onLogin).not.toHaveBeenCalled()
  })

  it('clears a field error as soon as that field changes', async () => {
    const { result } = renderHook(() => useLoginForm(vi.fn()))

    await act(async () => result.current.submit())
    expect(result.current.emailError).toBe('Email is required')

    act(() => result.current.onEmailChange('a'))

    expect(result.current.emailError).toBeUndefined()
  })

  it('fillDemoUser switches to login mode and fills the known demo credentials', () => {
    const { result } = renderHook(() => useLoginForm(vi.fn()))

    act(() => result.current.switchMode('register'))
    act(() => result.current.fillDemoUser({ displayName: 'Anna Kiss', email: 'anna.kiss@example.com' }))

    expect(result.current.mode).toBe('login')
    expect(result.current.displayName).toBe('Anna Kiss')
    expect(result.current.email).toBe('anna.kiss@example.com')
    expect(result.current.password).toBe('demo123')
  })
})
