import { useRef, type KeyboardEvent } from 'react'
import { settingsTabs, type SettingsTab } from './settingsTabs'

interface SettingsTabNavigationProps {
  activeTab: SettingsTab
  onSelect: (tab: SettingsTab) => void
}

export function SettingsTabNavigation({ activeTab, onSelect }: SettingsTabNavigationProps) {
  const tabButtons = useRef<Array<HTMLButtonElement | null>>([])

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % settingsTabs.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + settingsTabs.length) % settingsTabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = settingsTabs.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    const nextTab = settingsTabs[nextIndex]
    if (!nextTab) return
    onSelect(nextTab.id)
    tabButtons.current[nextIndex]?.focus()
  }

  return (
    <div
      aria-label="Settings sections"
      className="flex gap-gutter-xs overflow-x-auto border-b border-light-outline-variant"
      role="tablist"
    >
      {settingsTabs.map((tab, index) => (
        <button
          aria-controls={`settings-panel-${tab.id}`}
          aria-selected={activeTab === tab.id}
          className={`shrink-0 border-b-2 px-3 py-2 font-label text-label-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary ${activeTab === tab.id ? 'border-light-primary text-light-on-surface' : 'border-transparent text-light-on-surface-variant hover:text-light-on-surface'}`}
          id={`settings-tab-${tab.id}`}
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          ref={(element) => { tabButtons.current[index] = element }}
          role="tab"
          tabIndex={activeTab === tab.id ? 0 : -1}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
