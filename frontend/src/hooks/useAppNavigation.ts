import { useState } from 'react'
import type { Report } from '../domain/types'
import type { NotificationTarget } from '../services/notificationStore'
import { getReport } from '../services/reportStore'

export type Tab = 'REPORT' | 'OPEN_REPORTS' | 'MY_CLAIMS' | 'HANDOVERS'

export type Focus = NotificationTarget & { key: number }

const TABS: readonly Tab[] = ['REPORT', 'OPEN_REPORTS', 'MY_CLAIMS', 'HANDOVERS']

function tabStorageKey(userId: string): string {
  return `lostfound.tab.${userId}`
}

function readStoredTab(userId: string): Tab {
  const raw = sessionStorage.getItem(tabStorageKey(userId))
  return (TABS as readonly string[]).includes(raw ?? '') ? (raw as Tab) : 'REPORT'
}

export function useAppNavigation(userId: string, onOpenReports: () => void) {
  const [tab, setTabState] = useState<Tab>(() => readStoredTab(userId))
  const [focus, setFocus] = useState<Focus | null>(null)
  const [focusedReport, setFocusedReport] = useState<Report | null>(null)
  const [navigationNotice, setNavigationNotice] = useState<string | null>(null)

  function setTab(next: Tab) {
    setTabState(next)
    sessionStorage.setItem(tabStorageKey(userId), next)
  }

  function selectTab(next: Tab) {
    setTab(next)
    setFocus(null)
    setNavigationNotice(null)
    if (next === 'OPEN_REPORTS') onOpenReports()
  }

  async function navigateTo(target: NotificationTarget) {
    const opensReport = target.tab === 'OPEN_REPORTS' && Boolean(target.reportId)
    const report = opensReport && target.reportId ? await getReport(target.reportId) : undefined
    setFocusedReport(report ?? null)
    setNavigationNotice(opensReport && !report ? 'This report no longer exists — it was deleted by its reporter.' : null)
    setTab(target.tab)
    setFocus({ ...target, key: Date.now() })
    if (target.tab === 'OPEN_REPORTS') onOpenReports()
  }

  return { tab, setTab, focus, focusedReport, navigationNotice, selectTab, navigateTo }
}
