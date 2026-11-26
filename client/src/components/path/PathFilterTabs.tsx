import type { KeyboardEvent } from 'react'
import type { PathFilter } from '../../types/path'

interface PathFilterTabsProps {
  selectedFilter: PathFilter
  onSelectFilter: (filter: PathFilter) => void
}

const filters: { id: PathFilter; label: string }[] = [
  { id: 'all', label: 'Toda la ruta (5)' },
  { id: 'a2', label: 'A2+ Base' },
  { id: 'b1', label: 'B1 Remoto' },
  { id: 'b2', label: 'B2 Entrevistas' },
]

export function PathFilterTabs({ selectedFilter, onSelectFilter }: PathFilterTabsProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const tabs = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    )
    const currentIndex = tabs.indexOf(event.currentTarget)
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1

    if (nextIndex !== null) {
      event.preventDefault()
      tabs[nextIndex].focus()
      tabs[nextIndex].click()
    }
  }

  return (
    <div
      aria-label="Filtrar por nivel MCER"
      className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-md border border-light-outline-variant bg-light-surface-container p-1"
      role="tablist"
    >
      {filters.map(({ id, label }) => {
        const isSelected = selectedFilter === id

        return (
          <button
            aria-controls="path-units"
            aria-selected={isSelected}
            className={`rounded-sm px-3 py-1.5 font-label text-label-md transition-colors duration-state-change ease-state-change focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary ${
              isSelected
                ? 'border border-light-outline-variant bg-light-surface-container-lowest text-light-on-surface'
                : 'text-light-on-surface-variant hover:text-light-on-surface'
            }`}
            id={`path-filter-${id}`}
            key={id}
            onClick={() => onSelectFilter(id)}
            onKeyDown={handleKeyDown}
            role="tab"
            tabIndex={isSelected ? 0 : -1}
            type="button"
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
