import { useState } from 'react'
import { ReportForm } from './components/ReportForm'
import { ReportList } from './components/ReportList'
import { getOpenReports } from './storage/reportStore'
import type { ReportType } from './domain/types'

type Tab = 'REPORT' | 'OPEN_REPORTS'

function App() {
  const [tab, setTab] = useState<Tab>('REPORT')
  const [openReports, setOpenReports] = useState(() => getOpenReports())
  const [filter, setFilter] = useState<ReportType | 'ALL'>('ALL')

  function refresh() {
    setOpenReports(getOpenReports())
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-white/5 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-white/5 blur-3xl"
      />

      <div className="relative mx-auto max-w-2xl px-4 py-16">
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
          <span>Lost & Found reporting portal</span>
        </div>

        <h1 className="mb-3 text-5xl font-bold text-white">Lost & Found</h1>

        <div className="mt-8 flex gap-6 border-b border-white/10">
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
            onClick={() => setTab('OPEN_REPORTS')}
            className={
              tab === 'OPEN_REPORTS'
                ? 'border-b-2 border-white pb-2 text-sm font-semibold text-white'
                : 'border-b-2 border-transparent pb-2 text-sm font-medium text-gray-400 hover:text-gray-200'
            }
          >
            Open reports
          </button>
        </div>

        {tab === 'REPORT' ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-neutral-900/60 p-6 shadow-xl backdrop-blur">
            <ReportForm
              onCreated={() => {
                refresh()
                setTab('OPEN_REPORTS')
              }}
            />
          </div>
        ) : (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Open reports</h2>
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300">
                {openReports.length} {openReports.length === 1 ? 'report' : 'reports'}
              </span>
            </div>
            <ReportList reports={openReports} filter={filter} onFilterChange={setFilter} />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
