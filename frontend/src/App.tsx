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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-neutral-950">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-white/5 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-white/5 blur-3xl"
      />

      <div className="relative mx-auto max-w-2xl px-4 py-16">
        <div className="mb-4 flex items-center justify-between gap-3 text-sm text-gray-400">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
            <span className="truncate">Lost & Found reporting portal</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden sm:inline">
              Signed in as <span className="font-medium text-gray-200">{currentUser}</span>
            </span>
            <button
              onClick={() => {
                clearSession()
                setSessionState(null)
              }}
              className="text-gray-400 underline-offset-2 hover:text-white hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="mb-3 flex items-start justify-between gap-4">
          <h1 className="text-5xl font-bold text-white">Lost & Found</h1>
          <NotificationBell
            onNavigate={(next) => {
              setTab(next)
              if (next === 'OPEN_REPORTS') void refresh()
            }}
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-6 border-b border-white/10">
          <button
            onClick={() => setTab('REPORT')}
            className={
              tab === 'REPORT'
                ? 'border-b-2 border-white pb-2 text-sm font-semibold text-white'
                : 'border-b-2 border-transparent pb-2 text-sm font-medium text-gray-400 hover:text-gray-200'
            }
          >
            Report
          </button>
          <button
            onClick={() => {
              setTab('OPEN_REPORTS')
              void refresh()
            }}
            className={
              tab === 'OPEN_REPORTS'
                ? 'border-b-2 border-white pb-2 text-sm font-semibold text-white'
                : 'border-b-2 border-transparent pb-2 text-sm font-medium text-gray-400 hover:text-gray-200'
            }
          >
            Open reports
          </button>
          <button
            onClick={() => setTab('MY_CLAIMS')}
            className={
              tab === 'MY_CLAIMS'
                ? 'border-b-2 border-white pb-2 text-sm font-semibold text-white'
                : 'border-b-2 border-transparent pb-2 text-sm font-medium text-gray-400 hover:text-gray-200'
            }
          >
            My claims
          </button>
          <button
            onClick={() => setTab('HANDOVERS')}
            className={
              tab === 'HANDOVERS'
                ? 'border-b-2 border-white pb-2 text-sm font-semibold text-white'
                : 'border-b-2 border-transparent pb-2 text-sm font-medium text-gray-400 hover:text-gray-200'
            }
          >
            Handovers
          </button>
        </div>

        {tab === 'REPORT' && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-neutral-900/60 p-6 shadow-xl backdrop-blur">
            <ReportForm
              reporterName={currentUser}
              defaultContact={session.email}
              onCreated={() => {
                void refresh()
                setTab('OPEN_REPORTS')
              }}
            />
          </div>
        )}

        {tab === 'OPEN_REPORTS' && (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Open reports</h2>
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300">
                {headerCount} {headerCount === 1 ? 'report' : 'reports'}
              </span>
            </div>
            {reportsError && <p className="mb-4 text-sm text-red-300">{reportsError}</p>}
            {reportsLoading && openReports.length === 0 ? (
              <p className="text-gray-500">Loading reports…</p>
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
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-bold text-white">My claims</h2>
            <MyClaims />
          </div>
        )}

        {tab === 'HANDOVERS' && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-bold text-white">Handovers</h2>
            <MyHandovers />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
