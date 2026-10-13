import { useState } from 'react'
import { deleteReport } from '../services/reportStore'

export function useDeleteReport(onDeleted: () => void) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string>()

  function remove(reportId: string) {
    setDeleting(true)
    setError(undefined)
    void deleteReport(reportId)
      .then(() => onDeleted())
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to delete report')
        setDeleting(false)
      })
  }

  return { deleting, error, remove }
}
