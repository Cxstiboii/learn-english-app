import { Badge, Card } from '../ui'
import type { WritingEvaluation } from '../../types/writing'

interface WritingResultsPanelProps {
  evaluation: WritingEvaluation
}

export function WritingResultsPanel({ evaluation }: WritingResultsPanelProps) {
  return (
    <Card
      aria-label="Estimated writing evaluation"
      className="flex flex-col gap-gutter-md"
      padding="lg"
      role="region"
    >
      <header className="flex flex-wrap items-start justify-between gap-gutter-sm">
        <div className="flex flex-col gap-1">
          <h2 className="font-title text-title-md text-light-on-surface">Writing Evaluation</h2>
          <p className="font-body text-body-sm text-light-on-surface-variant">
            Your practice results are ready.
          </p>
        </div>
        <Badge variant="neutral">Estimated</Badge>
      </header>

      <p className="rounded-default border border-light-primary bg-light-primary-container px-gutter-md py-gutter-sm font-label text-label-lg text-light-on-primary-container">
        Estimated band: {evaluation.estimatedBand.toFixed(1)} / 9
      </p>

      <ul className="grid list-none grid-cols-1 gap-gutter-sm p-0 sm:grid-cols-2">
        {evaluation.scores.map(({ criterion, score, maxScore }) => {
          const progress = Math.min(100, Math.max(0, (score / maxScore) * 100))
          return (
            <li
              className="flex flex-col gap-2 rounded-default border border-light-outline-variant bg-light-surface-container-low p-gutter-md"
              key={criterion}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-label text-label-md text-light-on-surface">{criterion}</span>
                <span className="font-mono text-label-md text-light-on-surface-variant">
                  {score} / {maxScore}
                </span>
              </div>
              <div
                aria-label={`${criterion}: ${score} out of ${maxScore}`}
                aria-valuemax={maxScore}
                aria-valuemin={0}
                aria-valuenow={score}
                className="h-1.5 overflow-hidden rounded-full bg-light-surface-container-high"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-light-primary"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>

      <section className="flex flex-col gap-gutter-xs">
        <h3 className="font-label text-label-md text-light-on-surface">Suggestions to improve</h3>
        <ul className="flex list-none flex-col gap-2 p-0 font-body text-body-sm text-light-on-surface-variant">
          {evaluation.suggestions.map((suggestion) => (
            <li className="flex gap-2" key={suggestion}>
              <span aria-hidden="true" className="text-light-primary">
                •
              </span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </section>

      {evaluation.corrections.length > 0 && (
        <section className="flex flex-col gap-gutter-xs">
          <h3 className="font-label text-label-md text-light-on-surface">Main corrections</h3>
          <ul className="flex list-none flex-col gap-2 p-0 font-body text-body-sm text-light-on-surface-variant">
            {evaluation.corrections.map((correction, index) => (
              <li className="rounded-default bg-light-surface-container-low p-3" key={`${correction.original}-${index}`}>
                <p className="font-mono text-light-error">{correction.original} → {correction.corrected}</p>
                <p>{correction.explanation}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="border-t border-light-outline-variant pt-gutter-sm font-mono text-label-sm text-light-on-surface-variant">
        {evaluation.disclaimer}
      </p>
    </Card>
  )
}
