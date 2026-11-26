import type { KeyboardEvent } from 'react'
import type { WritingMode } from '../../types/writing'

interface ExamModeToggleProps {
  mode: WritingMode
  onChange: (mode: WritingMode) => void
}

const modes: { id: WritingMode; label: string }[] = [
  { id: 'toefl', label: 'TOEFL Writing' },
  { id: 'ielts', label: 'IELTS Essay' },
]

export function ExamModeToggle({ mode, onChange }: ExamModeToggleProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return

    event.preventDefault()
    const nextMode = mode === 'toefl' ? 'ielts' : 'toefl'
    onChange(nextMode)
    event.currentTarget.parentElement
      ?.querySelector<HTMLButtonElement>(`[data-exam-mode="${nextMode}"]`)
      ?.focus()
  }

  return (
    <div
      aria-label="Exam section"
      className="inline-flex w-fit items-center gap-1 rounded-md border border-light-outline-variant bg-light-surface-container p-1"
      role="tablist"
    >
      {modes.map(({ id, label }) => {
        const isSelected = mode === id
        return (
          <button
            aria-selected={isSelected}
            className={`rounded-sm px-3 py-1.5 font-label text-label-md transition-colors duration-state-change focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary ${
              isSelected
                ? 'border border-light-outline-variant bg-light-surface-container-lowest text-light-on-surface'
                : 'text-light-on-surface-variant hover:text-light-on-surface'
            }`}
            data-exam-mode={id}
            key={id}
            onClick={() => onChange(id)}
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
