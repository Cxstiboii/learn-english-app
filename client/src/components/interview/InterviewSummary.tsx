import { Badge, Button, Card } from '../ui'
import type { InterviewAnswer, InterviewEvaluation } from '../../types/interview'

interface InterviewSummaryProps {
  trackLabel: string
  answers: InterviewAnswer[]
  evaluation: InterviewEvaluation | null
  isEvaluating: boolean
  error: string | null
  onEvaluate: () => void
}

export function InterviewSummary({
  trackLabel,
  answers,
  evaluation,
  isEvaluating,
  error,
  onEvaluate,
}: InterviewSummaryProps) {
  return (
    <section aria-labelledby="interview-summary-title" className="flex flex-col gap-gutter-md">
      <header className="flex flex-col gap-gutter-xs">
        <p className="font-mono text-label-sm uppercase tracking-wider text-light-secondary">
          Interview complete · {trackLabel}
        </p>
        <h2
          className="font-headline text-display-lg-mobile text-light-on-surface md:text-headline-lg"
          id="interview-summary-title"
        >
          Your interview summary
        </h2>
        <p className="font-body text-body-md text-light-on-surface-variant">
          Review your answers, then get AI feedback on your STAR structure and English.
        </p>
      </header>

      <ol className="flex list-none flex-col gap-gutter-sm p-0">
        {answers.map(({ questionNumber, questionId, question, answer }) => (
          <li key={questionId}>
            <Card className="flex flex-col gap-gutter-xs" padding="md">
              <div className="flex items-start justify-between gap-gutter-sm">
                <h3 className="font-label text-label-md text-light-on-surface">
                  Q{questionNumber}. {question}
                </h3>
                <Badge variant={answer.trim() ? 'success' : 'warning'}>
                  {answer.trim() ? 'Answered' : 'Skipped'}
                </Badge>
              </div>
              <p className="whitespace-pre-wrap font-body text-body-sm leading-relaxed text-light-on-surface-variant">
                {answer.trim() || 'No response recorded.'}
              </p>
              {evaluation?.answers.find((evaluated) => evaluated.question === question) && (
                <div className="mt-2 flex flex-col gap-gutter-sm border-t border-light-outline-variant pt-gutter-sm">
                  {(() => {
                    const evaluated = evaluation.answers.find((item) => item.question === question)
                    if (!evaluated) return null
                    return (
                      <>
                        <div className="flex flex-wrap gap-2 font-mono text-label-sm">
                          <span>Situation/Task: {evaluated.situationTaskMet ? 'Met' : 'Needs work'}</span>
                          <span>Action: {evaluated.actionMet ? 'Met' : 'Needs work'}</span>
                          <span>Result: {evaluated.resultMet ? 'Met' : 'Needs work'}</span>
                        </div>
                        {evaluated.comments.map((comment) => (
                          <p className="font-body text-body-sm text-light-on-surface-variant" key={comment}>{comment}</p>
                        ))}
                        <p className="font-mono text-label-sm text-light-primary">
                          Improved answer: {evaluated.improvedResponse}
                        </p>
                      </>
                    )
                  })()}
                </div>
              )}
            </Card>
          </li>
        ))}
      </ol>

      {error && (
        <p
          className="rounded-default border border-light-error bg-light-error-container px-gutter-md py-gutter-sm font-body text-body-sm text-light-on-error-container"
          role="alert"
        >
          {error}
        </p>
      )}

      {isEvaluating && (
        <div aria-label="Evaluating interview" className="flex flex-col gap-gutter-sm rounded-default border border-light-outline-variant bg-light-surface-container-lowest p-gutter-md">
          <div className="h-6 animate-pulse rounded bg-light-surface-container-high" />
          <div className="h-16 animate-pulse rounded bg-light-surface-container-high" />
        </div>
      )}

      {evaluation ? (
        <Card
          aria-labelledby="interview-evaluation-title"
          className="flex flex-col gap-gutter-md"
          padding="lg"
          role="region"
        >
          <header className="flex flex-wrap items-start justify-between gap-gutter-sm">
            <div className="flex flex-col gap-1">
              <h3
                className="font-headline text-headline-md text-light-on-surface"
                id="interview-evaluation-title"
              >
                AI Interview Evaluation
              </h3>
              <p className="font-label text-label-lg text-light-primary">
                {evaluation.estimatedLevel}
              </p>
            </div>
            <Badge variant="neutral">Estimated</Badge>
          </header>

          <p className="font-body text-body-md leading-relaxed text-light-on-surface-variant">
            {evaluation.summary}
          </p>

          <div className="grid grid-cols-1 gap-gutter-md sm:grid-cols-2">
            <section className="flex flex-col gap-gutter-xs">
              <h4 className="font-label text-label-md text-light-on-surface">Strengths</h4>
              <ul className="flex list-none flex-col gap-2 p-0 font-body text-body-sm text-light-on-surface-variant">
                {evaluation.strengths.map((strength) => (
                  <li className="flex gap-2" key={strength}>
                    <span aria-hidden="true" className="text-light-primary">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="flex flex-col gap-gutter-xs">
              <h4 className="font-label text-label-md text-light-on-surface">Suggestions</h4>
              <ul className="flex list-none flex-col gap-2 p-0 font-body text-body-sm text-light-on-surface-variant">
                {evaluation.suggestions.map((suggestion) => (
                  <li className="flex gap-2" key={suggestion}>
                    <span aria-hidden="true" className="text-light-secondary">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <p className="border-t border-light-outline-variant pt-gutter-sm font-mono text-label-sm text-light-on-surface-variant">
            {evaluation.disclaimer}
          </p>
        </Card>
      ) : (
        <Button className="w-fit" disabled={isEvaluating} onClick={onEvaluate}>
          {isEvaluating ? 'Evaluating…' : error ? 'Retry evaluation' : 'Evaluate with AI'}
        </Button>
      )}
    </section>
  )
}
