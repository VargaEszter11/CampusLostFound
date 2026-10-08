import { useCallback, useEffect, useState } from 'react'
import type { AdminReport } from '../domain/types'
import { getAllReports } from '../services/adminStore'

export function useAdminReports() {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setReports(await getAllReports())
      setError(undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void getAllReports()
      .then((data) => {
        if (cancelled) return
        setReports(data)
        setError(undefined)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load reports')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { reports, loading, error, refresh }
}
