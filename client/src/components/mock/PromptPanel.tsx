import { Badge, Card } from '../ui'
import type { WritingPrompt } from '../../types/writing'
import { formatDuration } from '../../hooks/useCountdown'

interface PromptPanelProps {
  prompt: WritingPrompt
}

export function PromptPanel({ prompt }: PromptPanelProps) {
  return (
    <Card
      aria-label="Exam prompt and rubric"
      className="flex flex-col gap-gutter-md"
      padding="lg"
      role="region"
    >
      <header className="flex flex-wrap items-center justify-between gap-gutter-sm border-b border-light-outline-variant pb-gutter-sm">
        <span className="font-mono text-label-sm text-light-on-surface-variant">
          {prompt.taskName} · {formatDuration(prompt.durationSeconds)}
        </span>
        <Badge variant="neutral">Min {prompt.minimumWords} words</Badge>
      </header>

      <p className="font-body text-body-md leading-relaxed text-pretty text-light-on-surface">
        {prompt.prompt}
      </p>

      <p className="font-body text-body-sm text-light-on-surface-variant">
        {prompt.timingNote}
      </p>

      <section className="flex flex-col gap-gutter-xs rounded-default border border-light-outline-variant bg-light-surface-container-low p-gutter-md">
        <h2 className="font-mono text-label-sm text-light-primary">B2 Scoring Checklist</h2>
        <ul className="flex list-none flex-col gap-1 p-0 font-body text-body-sm text-light-on-surface-variant">
          {prompt.checklist.map((item, index) => (
            <li className="flex gap-2" key={item}>
              <span aria-hidden="true" className="shrink-0">
                {index + 1}.
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </Card>
  )
}
