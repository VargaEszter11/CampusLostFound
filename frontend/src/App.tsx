import { useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { AppTabs } from './components/AppTabs'
import { LoginScreen } from './components/LoginScreen'
import { MyClaims } from './components/MyClaims'
import { MyHandovers } from './components/MyHandovers'
import { ReportForm } from './components/ReportForm'
import { ReportList, type ReportFilter } from './components/ReportList'
import { useAppNavigation } from './hooks/useAppNavigation'
import { useOpenReports } from './hooks/useOpenReports'
import { useSession } from './hooks/useSession'
import { isOwnerOf } from './domain/rules'
import type { AuthSession } from './session/session'

function App() {
  const { session, setSession, signOut } = useSession()

  if (!session) {
    return <LoginScreen onLogin={setSession} />
  }

  return <Dashboard key={session.userId} session={session} onSignOut={signOut} />
}

interface DashboardProps {
  readonly session: AuthSession
  readonly onSignOut: () => void
}

function Dashboard({ session, onSignOut }: DashboardProps) {
  const { openReports, loading, error, refresh } = useOpenReports(session, onSignOut)
  const { tab, setTab, focus, focusedReport, selectTab, navigateTo } = useAppNavigation(refresh)
  const [filter, setFilter] = useState<ReportFilter>('ALL')

  const currentUser = session.displayName
  const otherOpenCount = openReports.filter((r) => !isOwnerOf(r, currentUser)).length
  const myOpenCount = openReports.filter((r) => isOwnerOf(r, currentUser)).length
  const headerCount = filter === 'MINE' ? myOpenCount : otherOpenCount

  return (
    <div className="app-shell">
      <div className="relative mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <AppHeader userName={currentUser} onNavigate={(target) => void navigateTo(target)} onSignOut={onSignOut} />

        <AppTabs active={tab} onSelect={selectTab} />

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
            {error && <p className="mb-4 text-sm text-danger">{error}</p>}
            {loading && openReports.length === 0 ? (
              <p className="text-ink-faint">Loading reports…</p>
            ) : (
              <ReportList
                key={focus?.key ?? 'list'}
                initialSelected={focusedReport}
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
            <MyClaims
              key={focus?.key ?? 'claims'}
              focusClaimId={focus?.tab === 'MY_CLAIMS' ? (focus.claimId ?? null) : null}
            />
          </div>
        )}

        {tab === 'HANDOVERS' && (
          <div key="handovers" className="panel-enter mt-8">
            <h2 className="brand-display mb-5 text-2xl text-ink">Handovers</h2>
            <MyHandovers
              key={focus?.key ?? 'handovers'}
              focusHandoverId={focus?.tab === 'HANDOVERS' ? (focus.handoverId ?? null) : null}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
