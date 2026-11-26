import { Card } from '../ui'
import { formatDuration } from '../../hooks/useCountdown'
import type { SpeakingPrompt } from '../../types/speaking'

interface PromptCardProps {
  prompt: SpeakingPrompt
  elapsedSeconds: number
  transcript: string
}

export function PromptCard({ prompt, elapsedSeconds, transcript }: PromptCardProps) {
  return (
    <Card className="flex flex-col gap-gutter-md" padding="lg" role="article">
      <header className="flex flex-wrap items-center justify-between gap-gutter-sm border-b border-light-outline-variant pb-gutter-md">
        <span className="inline-flex items-center rounded-sm border border-light-outline-variant bg-light-surface-container-high px-2 py-0.5 font-mono text-label-sm text-light-on-surface">
          {prompt.label}
        </span>
        <span
          aria-label={`Elapsed time ${formatDuration(elapsedSeconds)} of ${formatDuration(prompt.durationSeconds)}`}
          aria-live="off"
          className="font-mono text-label-md tabular-nums text-light-on-surface"
        >
          {formatDuration(elapsedSeconds)} / {formatDuration(prompt.durationSeconds)}
        </span>
      </header>

      <div className="flex flex-col gap-gutter-sm">
        <h2 className="font-headline text-headline-md text-balance text-light-on-surface">
          “{prompt.question}”
        </h2>
        <p className="font-body text-body-sm text-light-on-surface-variant">
          Tip: {prompt.tip}
        </p>
      </div>

      <section
        aria-labelledby="live-transcript-heading"
        className="flex min-h-36 flex-col gap-gutter-xs rounded-default border border-light-outline-variant bg-light-surface-container-low p-gutter-md"
      >
        <h3
          className="font-mono text-label-sm text-light-on-surface-variant"
          id="live-transcript-heading"
        >
          Live Transcript
        </h3>
        <p
          aria-live="polite"
          aria-atomic="true"
          className="font-body text-body-md leading-relaxed text-pretty text-light-on-surface"
        >
          {transcript || 'Your words will appear here as you speak.'}
        </p>
      </section>
    </Card>
  )
}
