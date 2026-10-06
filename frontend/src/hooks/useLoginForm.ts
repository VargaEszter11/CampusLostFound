import { useState } from 'react'
import { login, register } from '../services/authService'
import { DEMO_PASSWORD, DEMO_USERS } from '../domain/demoUsers'
import type { AuthSession } from '../session/session'
import { setSession } from '../session/session'

export type Mode = 'login' | 'register'
type DemoUser = (typeof DEMO_USERS)[number]

export function useLoginForm(onLogin: (session: AuthSession) => void) {
  const [mode, setMode] = useState<Mode>('login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayNameError, setDisplayNameError] = useState<string>()
  const [emailError, setEmailError] = useState<string>()
  const [passwordError, setPasswordError] = useState<string>()
  const [formError, setFormError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  function clearFieldErrors() {
    setDisplayNameError(undefined)
    setEmailError(undefined)
    setPasswordError(undefined)
    setFormError(undefined)
  }

  function validate(): boolean {
    let ok = true
    if (mode === 'register' && !displayName.trim()) {
      setDisplayNameError('Name is required')
      ok = false
    }
    if (!email.trim()) {
      setEmailError('Email is required')
      ok = false
    }
    if (!password) {
      setPasswordError('Password is required')
      ok = false
    } else if (mode === 'register' && password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      ok = false
    }
    return ok
  }

  async function submit() {
    clearFieldErrors()
    if (!validate()) return

    setSubmitting(true)
    try {
      const session =
        mode === 'login'
          ? await login(email.trim(), password)
          : await register(displayName.trim(), email.trim(), password)
      setSession(session)
      onLogin(session)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    clearFieldErrors()
  }

  function fillDemoUser(user: DemoUser) {
    setMode('login')
    setDisplayName(user.displayName)
    setEmail(user.email)
    setPassword(DEMO_PASSWORD)
    clearFieldErrors()
  }

  return {
    mode,
    switchMode,
    displayName,
    displayNameError,
    onDisplayNameChange(value: string) {
      setDisplayName(value)
      if (displayNameError) setDisplayNameError(undefined)
    },
    email,
    emailError,
    onEmailChange(value: string) {
      setEmail(value)
      if (emailError) setEmailError(undefined)
    },
    password,
    passwordError,
    onPasswordChange(value: string) {
      setPassword(value)
      if (passwordError) setPasswordError(undefined)
    },
    formError,
    setFormError,
    submitting,
    submit,
    fillDemoUser,
  }
}

export type LoginFormState = ReturnType<typeof useLoginForm>
