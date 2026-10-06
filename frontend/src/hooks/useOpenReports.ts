import { useCallback, useEffect, useState } from 'react'
import type { Report } from '../domain/types'
import { getSession, type AuthSession } from '../session/session'
import { getOpenReports } from '../services/reportStore'

export function useOpenReports(session: AuthSession | null, onAuthLost: () => void) {
  const [openReports, setOpenReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const refresh = useCallback(async () => {
    try {
      setOpenReports(await getOpenReports())
      setError(undefined)
    } catch (err) {
      if (!getSession()) {
        onAuthLost()
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [onAuthLost])

  useEffect(() => {
    if (!session) return
    let cancelled = false
    void getOpenReports()
      .then((reports) => {
        if (cancelled) return
        setOpenReports(reports)
        setError(undefined)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (!getSession()) {
          onAuthLost()
          return
        }
        setError(err instanceof Error ? err.message : 'Failed to load reports')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session, onAuthLost])

  return { openReports, loading, error, refresh }
}
