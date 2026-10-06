import { useState } from 'react'
import type { Report } from '../domain/types'
import type { NotificationTarget } from '../services/notificationStore'
import { getReport } from '../services/reportStore'

export type Tab = 'REPORT' | 'OPEN_REPORTS' | 'MY_CLAIMS' | 'HANDOVERS'

export type Focus = NotificationTarget & { key: number }

export function useAppNavigation(onOpenReports: () => void) {
  const [tab, setTab] = useState<Tab>('REPORT')
  const [focus, setFocus] = useState<Focus | null>(null)
  const [focusedReport, setFocusedReport] = useState<Report | null>(null)

  function selectTab(next: Tab) {
    setTab(next)
    setFocus(null)
    if (next === 'OPEN_REPORTS') onOpenReports()
  }

  async function navigateTo(target: NotificationTarget) {
    const report =
      target.tab === 'OPEN_REPORTS' && target.reportId ? await getReport(target.reportId) : undefined
    setFocusedReport(report ?? null)
    setTab(target.tab)
    setFocus({ ...target, key: Date.now() })
    if (target.tab === 'OPEN_REPORTS') onOpenReports()
  }

  return { tab, setTab, focus, focusedReport, selectTab, navigateTo }
}
