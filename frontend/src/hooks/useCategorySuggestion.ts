import { useEffect, useRef, useState } from 'react'
import { suggestCategory } from '../services/categoryService'

const DEBOUNCE_MS = 700
const MIN_NAME_LENGTH = 3

export function useCategorySuggestion(itemName: string, itemDescription: string) {
  const [suggestion, setSuggestion] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const lastRequested = useRef('')

  const name = itemName.trim()
  const description = itemDescription.trim()
  const eligible = name.length >= MIN_NAME_LENGTH

  useEffect(() => {
    if (!eligible) {
      lastRequested.current = ''
      return
    }

    const key = `${name}|${description}`
    if (key === lastRequested.current) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      lastRequested.current = key
      setLoading(true)
      setError(undefined)
      void suggestCategory(name, description)
        .then((category) => {
          if (!cancelled) setSuggestion(category)
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(err instanceof Error ? err.message : 'Could not suggest a category')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [eligible, name, description])

  return {
    suggestion: eligible ? suggestion : undefined,
    loading: eligible && loading,
    error: eligible ? error : undefined,
  }
}
