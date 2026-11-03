import { useState } from 'react'
import { AdminPage } from './components/AdminPage'
import { AppHeader } from './components/AppHeader'
import { AppTabs } from './components/AppTabs'
import { LoginScreen } from './components/LoginScreen'
import { MyClaims } from './components/MyClaims'
import { MyHandovers } from './components/MyHandovers'
import { ReportForm } from './components/ReportForm'
import { ReportList, ReportListHeading, type ReportFilter } from './components/ReportList'
import { useAppNavigation } from './hooks/useAppNavigation'
import { useHashRoute } from './hooks/useHashRoute'
import { useOpenReports } from './hooks/useOpenReports'
import { useSession } from './hooks/useSession'
import type { AuthSession } from './session/session'

function App() {
  const { session, setSession, signOut } = useSession()

  if (!session) {
    return <LoginScreen onLogin={setSession} />
  }

  return <Main key={session.userId} session={session} onSignOut={signOut} />
}

interface MainProps {
  readonly session: AuthSession
  readonly onSignOut: () => void
}

function Main({ session, onSignOut }: MainProps) {
  const { route, navigate } = useHashRoute()

  if (route === 'ADMIN' && session.isAdmin) {
    return (
      <div className="app-shell">
        <div className="relative mx-auto max-w-4xl px-4 py-12 sm:py-16">
          <AdminPage onBack={() => navigate('APP')} />
        </div>
      </div>
    )
  }

  return (
    <Dashboard
      session={session}
      onSignOut={onSignOut}
      onOpenAdmin={session.isAdmin ? () => navigate('ADMIN') : undefined}
    />
  )
}

interface DashboardProps {
  readonly session: AuthSession
  readonly onSignOut: () => void
  readonly onOpenAdmin?: () => void
}

function Dashboard({ session, onSignOut, onOpenAdmin }: DashboardProps) {
  const { openReports, loading, error, refresh } = useOpenReports(session, onSignOut)
  const { tab, setTab, focus, focusedReport, navigationNotice, selectTab, navigateTo } = useAppNavigation(
    session.userId,
    refresh,
  )
  const [filter, setFilter] = useState<ReportFilter>('ALL')

  const currentUser = session.displayName

  return (
    <div className="app-shell">
      <div className="relative mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <AppHeader
          userName={currentUser}
          onNavigate={(target) => void navigateTo(target)}
          onSignOut={onSignOut}
          onOpenAdmin={onOpenAdmin}
        />

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
            {navigationNotice && <p className="mb-4 text-sm text-ink-muted">{navigationNotice}</p>}
            {error && <p className="mb-4 text-sm text-danger">{error}</p>}
            {loading && openReports.length === 0 ? (
              <>
                <ReportListHeading />
                <p className="text-ink-faint">Loading reports…</p>
              </>
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
                currentUserId={session.userId}
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
