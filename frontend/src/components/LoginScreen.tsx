import { useState } from 'react'
import { MOCK_USERS } from '../domain/mockUsers'
import { setCurrentUser } from '../storage/authStore'
import { FieldError } from './FieldError'

interface Props {
  readonly onLogin: (name: string) => void
}

export function LoginScreen({ onLogin }: Props) {
  const [name, setName] = useState('')
  const [nameErrorMsg, setNameErrorMsg] = useState<string>()

  function login(chosenName: string) {
    const trimmed = chosenName.trim()
    if (!trimmed) {
      setNameErrorMsg('Name is required')
      return
    }
    setCurrentUser(trimmed)
    onLogin(trimmed)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-white/5 blur-3xl"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900/60 p-8 shadow-xl backdrop-blur">
        <h1 className="mb-1 text-2xl font-bold text-white">Lost & Found</h1>
        <p className="mb-6 text-sm text-gray-400">Sign in to report items and manage your claims.</p>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            login(name)
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="loginName" className="mb-1 block text-xs font-medium text-gray-400">
              Your name
            </label>
            <input
              id="loginName"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (nameErrorMsg) setNameErrorMsg(undefined)
              }}
              placeholder="Full name"
              aria-invalid={nameErrorMsg ? true : undefined}
              className="w-full rounded-lg border border-white/10 bg-neutral-800/60 px-3 py-2 text-white placeholder-gray-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
            />
            <FieldError message={nameErrorMsg} />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-linear-to-b from-white to-gray-200 py-2.5 font-semibold text-neutral-900 shadow-sm transition hover:from-gray-100 hover:to-gray-300"
          >
            Continue
          </button>
        </form>

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="mb-2 text-xs text-gray-500">Or continue as a demo user:</p>
          <div className="flex flex-wrap gap-2">
            {MOCK_USERS.map((user) => (
              <button
                key={user}
                onClick={() => login(user)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-white/30 hover:text-white"
              >
                {user}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
