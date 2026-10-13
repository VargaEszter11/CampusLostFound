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

  function setTab(next: Tab) {
    setTabState(next)
    sessionStorage.setItem(tabStorageKey(userId), next)
  }

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
