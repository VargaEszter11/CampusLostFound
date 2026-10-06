import type { Tab } from '../hooks/useAppNavigation'

const TABS: { id: Tab; label: string }[] = [
  { id: 'REPORT', label: 'Report' },
  { id: 'OPEN_REPORTS', label: 'Open reports' },
  { id: 'MY_CLAIMS', label: 'My claims' },
  { id: 'HANDOVERS', label: 'Handovers' },
]

interface Props {
  readonly active: Tab
  readonly onSelect: (tab: Tab) => void
}

export function AppTabs({ active, onSelect }: Props) {
  return (
    <nav className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className={
            active === id
              ? 'tab-active pb-2.5 text-sm'
              : 'pb-2.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink'
          }
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
