import { useCallback, useEffect, useState } from 'react'
import { ReportForm } from './components/ReportForm'
import { ReportList, type ReportFilter } from './components/ReportList'
import { LoginScreen } from './components/LoginScreen'
import { MyClaims } from './components/MyClaims'
import { MyHandovers } from './components/MyHandovers'
import { NotificationBell } from './components/NotificationBell'
import { getOpenReports } from './storage/reportStore'
import {
  clearSession,
  getSession,
  isSameUser,
  type AuthSession,
} from './storage/authStore'
import { AUTH_EXPIRED_EVENT } from './api/http'
import type { Report } from './domain/types'

type Tab = 'REPORT' | 'OPEN_REPORTS' | 'MY_CLAIMS' | 'HANDOVERS'

const TABS: { id: Tab; label: string }[] = [
  { id: 'REPORT', label: 'Report' },
  { id: 'OPEN_REPORTS', label: 'Open reports' },
  { id: 'MY_CLAIMS', label: 'My claims' },
  { id: 'HANDOVERS', label: 'Handovers' },
]

function App() {
  const [session, setSessionState] = useState<AuthSession | null>(() => getSession())
  const [tab, setTab] = useState<Tab>('REPORT')
  const [openReports, setOpenReports] = useState<Report[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState<string>()
  const [filter, setFilter] = useState<ReportFilter>('ALL')

  const currentUser = session?.displayName ?? null

  useEffect(() => {
    const onExpired = () => setSessionState(null)
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [])

  const refresh = useCallback(async () => {
    setReportsLoading(true)
    setReportsError(undefined)
    try {
      setOpenReports(await getOpenReports())
    } catch (err) {
      if (!getSession()) {
        setSessionState(null)
        return
      }
      setReportsError(err instanceof Error ? err.message : 'Failed to load reports')
    } finally {
      setReportsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) {
      void refresh()
    }
  }, [session, refresh])

  if (!session || !currentUser) {
    return <LoginScreen onLogin={setSessionState} />
  }

  const otherOpenCount = openReports.filter((r) => !isSameUser(currentUser, r.reporterName)).length
  const myOpenCount = openReports.filter((r) => isSameUser(currentUser, r.reporterName)).length
  const headerCount = filter === 'MINE' ? myOpenCount : otherOpenCount

  function selectTab(next: Tab) {
    setTab(next)
    if (next === 'OPEN_REPORTS') void refresh()
  }

  return (
    <div className="app-shell">
      <div className="relative mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="brand-display text-4xl text-ink sm:text-5xl">Lost & Found</h1>
            <p className="mt-2 max-w-md text-base text-ink-muted">
              Report and reclaim items on campus.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 pt-1">
            <NotificationBell
              onNavigate={(next) => {
                selectTab(next)
              }}
            />
            <div className="hidden text-right text-sm sm:block">
              <p className="font-medium text-ink">{currentUser}</p>
              <button
                type="button"
                onClick={() => {
                  clearSession()
                  setSessionState(null)
                }}
                className="text-ink-muted underline-offset-2 hover:text-teal hover:underline"
              >
                Sign out
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                clearSession()
                setSessionState(null)
              }}
              className="text-sm text-ink-muted underline-offset-2 hover:text-teal hover:underline sm:hidden"
            >
              Sign out
            </button>
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => selectTab(id)}
              className={
                tab === id
                  ? 'tab-active pb-2.5 text-sm'
                  : 'pb-2.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink'
              }
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === 'REPORT' && (
          <div key="report" className="panel-enter mt-8">
            <div className="surface-panel">
              <ReportForm
                reporterName={currentUser}
                defaultContact={session.email}
                onCreated={() => {
                  void refresh()
                  setTab('OPEN_REPORTS')
                }}
              />
            </div>
          </div>
        )}

        {tab === 'OPEN_REPORTS' && (
          <div key="open" className="panel-enter mt-8">
            <div className="mb-5 flex items-end justify-between gap-3">
              <h2 className="brand-display text-2xl text-ink">Open reports</h2>
              <span className="rounded bg-teal-soft px-2.5 py-1 text-xs font-semibold text-teal">
                {headerCount} {headerCount === 1 ? 'report' : 'reports'}
              </span>
            </div>
            {reportsError && <p className="mb-4 text-sm text-danger">{reportsError}</p>}
            {reportsLoading && openReports.length === 0 ? (
              <p className="text-ink-faint">Loading reports…</p>
            ) : (
              <ReportList
                reports={openReports}
                filter={filter}
                onFilterChange={setFilter}
                onReportChanged={() => {
                  void refresh()
                }}
                currentUser={currentUser}
                currentUserEmail={session.email}
              />
            )}
          </div>
        )}

        {tab === 'MY_CLAIMS' && (
          <div key="claims" className="panel-enter mt-8">
            <h2 className="brand-display mb-5 text-2xl text-ink">My claims</h2>
            <MyClaims />
          </div>
        )}

        {tab === 'HANDOVERS' && (
          <div key="handovers" className="panel-enter mt-8">
            <h2 className="brand-display mb-5 text-2xl text-ink">Handovers</h2>
            <MyHandovers />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
