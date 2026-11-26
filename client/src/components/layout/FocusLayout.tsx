import type { ReactNode } from 'react'
import { Button } from '../ui'

interface FocusLayoutProps {
  title: string
  timerLabel: string
  isTimerWarning: boolean
  isPaused: boolean
  canPause: boolean
  exitLabel?: string
  confirmationMessage?: string
  headerContent?: ReactNode
  children: ReactNode
  onPauseToggle: () => void
  onExit: () => void
}

export default function FocusLayout({
  title,
  timerLabel,
  isTimerWarning,
  isPaused,
  canPause,
  exitLabel = 'Exit Mock',
  confirmationMessage = 'Exit this mock? Your draft is saved locally.',
  headerContent,
  children,
  onPauseToggle,
  onExit,
}: FocusLayoutProps) {
  function confirmExit() {
    if (window.confirm(confirmationMessage)) onExit()
  }

  return (
    <div className="flex min-h-screen flex-col bg-light-surface text-light-on-surface">
      <header className="sticky top-0 z-20 border-b border-light-outline-variant bg-light-surface">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-gutter-sm px-gutter-md sm:gap-gutter-md sm:px-page-margin">
          <div className="flex min-w-0 items-center gap-gutter-sm sm:gap-gutter-md">
            <Button
              className="shrink-0 px-2.5 py-1.5"
              onClick={confirmExit}
              size="sm"
              variant="secondary"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-body-lg">
                arrow_back
              </span>
              {exitLabel}
            </Button>
            <h1 className="hidden truncate font-title text-title-md text-light-on-surface sm:block">
              {title}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-gutter-sm">
            {headerContent}
            <div
              aria-label={`Time remaining ${timerLabel}`}
              className={`inline-flex items-center gap-gutter-xs rounded-sm px-3 py-1.5 tabular-nums ${
                isTimerWarning
                  ? 'bg-light-error-container text-light-on-error-container'
                  : 'bg-warning-container text-on-warning-container'
              }`}
              role="timer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-body-lg">
                timer
              </span>
              <span aria-live="off" className="font-mono text-label-md">
                {timerLabel}
              </span>
            </div>
            <Button
              aria-pressed={isPaused}
              disabled={!canPause}
              onClick={onPauseToggle}
              size="sm"
              variant="secondary"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-gutter-lg px-gutter-md py-gutter-lg sm:px-page-margin">
        {children}
      </main>
    </div>
  )
}
