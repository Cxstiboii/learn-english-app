import { Badge, Card } from '../ui'
import type { Evaluation } from '../../types/speaking'

interface EvaluationPanelProps {
  evaluation: Evaluation | null
  isEvaluating: boolean
}

const scoreLabels = [
  { key: 'fluency', label: 'Fluency' },
  { key: 'grammar', label: 'Grammar' },
  { key: 'vocab', label: 'Vocab' },
] as const

export function EvaluationPanel({ evaluation, isEvaluating }: EvaluationPanelProps) {
  return (
    <Card
      aria-busy={isEvaluating}
      className="flex flex-col gap-gutter-md"
      padding="lg"
      role="article"
    >
      <header className="flex flex-wrap items-center justify-between gap-gutter-sm border-b border-light-outline-variant pb-gutter-md">
        <h2 className="font-headline text-headline-md text-light-on-surface">AI Evaluation</h2>
        {evaluation && (
          <Badge variant="success">
            {evaluation.estimatedCEFR} · Band {evaluation.estimatedBand.toFixed(1)}
          </Badge>
        )}
      </header>

      {evaluation ? (
        <>
          <dl className="grid grid-cols-3 gap-gutter-sm tabular-nums">
            {scoreLabels.map(({ key, label }) => (
              <div
                className="flex min-w-0 flex-col rounded-default border border-light-outline-variant bg-light-surface-container-low p-3"
                key={key}
              >
                <dt className="font-mono text-label-sm text-light-on-surface-variant">{label}</dt>
                <dd
                  className={`font-headline text-headline-md ${
                    key === 'vocab' ? 'text-light-primary' : 'text-light-on-surface'
                  }`}
                >
                  {(key === 'vocab' ? evaluation.vocabulary : evaluation[key]).toFixed(1)}
                </dd>
              </div>
            ))}
          </dl>

          <section className="flex flex-col gap-gutter-xs">
            <h3 className="font-mono text-label-sm text-light-primary">
              B2 Upgrade Suggestion
            </h3>
            <p className="font-body text-body-sm text-pretty text-light-on-surface-variant">
              {evaluation.b2UpgradeSuggestion}
            </p>
          </section>
          <p className="border-t border-light-outline-variant pt-gutter-sm font-mono text-label-sm text-light-on-surface-variant">
            {evaluation.disclaimer}
          </p>
        </>
      ) : (
        isEvaluating ? (
          <div aria-label="Evaluating speaking" className="flex flex-col gap-gutter-sm py-gutter-md">
            <div className="h-14 animate-pulse rounded-default bg-light-surface-container-high" />
            <div className="h-12 animate-pulse rounded-default bg-light-surface-container-high" />
          </div>
        ) : (
          <p aria-live="polite" className="py-gutter-md font-body text-body-sm text-light-on-surface-variant">
            Your speaking evaluation will appear here after you submit a transcript.
          </p>
        )
      )}
    </Card>
  )
}
