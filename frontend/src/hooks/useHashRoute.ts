import { useCallback, useEffect, useState } from 'react'

export type Route = 'APP' | 'ADMIN'

const ADMIN_HASH = '#/admin'

function readRoute(): Route {
  return window.location.hash === ADMIN_HASH ? 'ADMIN' : 'APP'
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(readRoute)

  useEffect(() => {
    const onChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((next: Route) => {
    window.location.hash = next === 'ADMIN' ? ADMIN_HASH : ''
    setRoute(next)
  }, [])

  return { route, navigate }
}
