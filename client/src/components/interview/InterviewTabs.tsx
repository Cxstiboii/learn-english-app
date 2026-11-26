import type { KeyboardEvent } from 'react'
import { interviewTrackLabels } from '../../content/interviewQuestions'
import type { InterviewTrack } from '../../types/interview'

interface InterviewTabsProps {
  activeTrack: InterviewTrack
  disabled?: boolean
  onChange: (track: InterviewTrack) => void
}

const tracks: InterviewTrack[] = ['behavioral', 'system-design', 'role-salary']

export function InterviewTabs({ activeTrack, disabled = false, onChange }: InterviewTabsProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return

    event.preventDefault()
    const activeIndex = tracks.indexOf(activeTrack)
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tracks.length - 1
          : (activeIndex + (event.key === 'ArrowRight' ? 1 : tracks.length - 1)) %
            tracks.length
    const nextTrack = tracks[nextIndex]
    onChange(nextTrack)
    event.currentTarget.parentElement
      ?.querySelector<HTMLButtonElement>(`[data-interview-track="${nextTrack}"]`)
      ?.focus()
  }

  return (
    <div
      aria-label="Interview round"
      className="inline-flex w-fit flex-wrap items-center gap-1 rounded-md border border-light-outline-variant bg-light-surface-container p-1"
      role="tablist"
    >
      {tracks.map((track) => {
        const isSelected = track === activeTrack
        return (
          <button
            aria-controls="interview-round-panel"
            aria-selected={isSelected}
            className={`rounded-sm px-3 py-1.5 font-label text-label-md transition-colors duration-state-change focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary disabled:cursor-not-allowed disabled:opacity-50 ${
              isSelected
                ? 'border border-light-outline-variant bg-light-surface-container-lowest text-light-on-surface'
                : 'text-light-on-surface-variant hover:text-light-on-surface'
            }`}
            data-interview-track={track}
            disabled={disabled}
            id={`interview-tab-${track}`}
            key={track}
            onClick={() => onChange(track)}
            onKeyDown={handleKeyDown}
            role="tab"
            tabIndex={isSelected ? 0 : -1}
            type="button"
          >
            {interviewTrackLabels[track]}
          </button>
        )
      })}
    </div>
  )
}
