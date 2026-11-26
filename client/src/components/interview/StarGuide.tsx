import { Card } from '../ui'
import type { StarAssessment, StarItemStatus } from '../../types/interview'

interface StarGuideProps {
  assessment: StarAssessment
  isFinalized: boolean
}

const items: {
  key: keyof StarAssessment
  label: string
  advice: string
}[] = [
  {
    key: 'situationTask',
    label: 'S / T · Situation & Task',
    advice: 'Set the context in about 15 seconds. Explain what you needed to do.',
  },
  {
    key: 'action',
    label: 'A · Action',
    advice: 'Use “I” to describe the specific steps you took.',
  },
  {
    key: 'result',
    label: 'R · Result',
    advice: 'Close with an outcome, ideally a number or a measurable change.',
  },
]

const statusLabels: Record<StarItemStatus, string> = {
  completed: 'Complete',
  pending: 'Pending',
  missing: 'Missing',
}

export function StarGuide({ assessment, isFinalized }: StarGuideProps) {
  return (
    <Card
      aria-labelledby="star-guide-title"
      className="flex flex-col gap-gutter-md"
      padding="lg"
      role="region"
    >
      <header className="flex flex-col gap-1">
        <h2 className="font-headline text-headline-md text-light-on-surface" id="star-guide-title">
          STAR Framework Guide
        </h2>
        <p className="font-body text-body-sm text-light-on-surface-variant">
          A provisional keyword check updates as you answer.
        </p>
      </header>

      <ul aria-live="polite" className="flex list-none flex-col gap-gutter-sm p-0">
        {items.map(({ key, label, advice }) => {
          const status = assessment[key]
          const isMissing = status === 'missing' && isFinalized
          const isComplete = status === 'completed'
          const statusLabel = isMissing ? 'Missing' : statusLabels[status]

          return (
            <li
              className={`flex items-start justify-between gap-2 rounded-default border p-3 ${
                isMissing
                  ? 'border-light-error bg-light-error-container'
                  : 'border-light-outline-variant bg-light-surface-container-low'
              }`}
              key={key}
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span
                  className={`font-mono text-label-sm ${
                    isMissing
                      ? 'text-light-on-error-container'
                      : isComplete
                        ? 'text-light-primary'
                        : 'text-light-on-surface-variant'
                  }`}
                >
                  {label} · {statusLabel}
                </span>
                <span className="font-body text-body-sm text-light-on-surface-variant">
                  {advice}
                </span>
              </div>
              <span
                aria-hidden="true"
                className={`material-symbols-outlined shrink-0 text-body-lg ${
                  isMissing
                    ? 'text-light-error'
                    : isComplete
                      ? 'text-light-primary'
                      : 'text-light-on-surface-variant'
                }`}
              >
                {isMissing
                  ? 'error'
                  : isComplete
                    ? 'check_circle'
                    : 'radio_button_unchecked'}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
