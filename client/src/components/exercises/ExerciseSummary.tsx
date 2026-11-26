import { Button, Card } from '../ui'

interface ExerciseSummaryProps {
  correctCount: number
  totalQuestions: number
  onRestart: () => void
}

export function ExerciseSummary({
  correctCount,
  onRestart,
  totalQuestions,
}: ExerciseSummaryProps) {
  return (
    <Card
      aria-labelledby="exercise-summary-title"
      className="mx-auto flex w-full max-w-2xl flex-col items-center gap-gutter-md text-center"
      padding="lg"
    >
      <span className="font-mono text-label-sm uppercase tracking-wider text-light-secondary">
        Practice complete
      </span>
      <h2
        className="font-headline text-headline-lg text-light-on-surface"
        id="exercise-summary-title"
      >
        Your result
      </h2>
      <p className="font-body text-body-lg text-light-on-surface-variant">
        You got <strong className="text-light-primary">{correctCount} of {totalQuestions}</strong>{' '}
        questions correct.
      </p>
      <Button onClick={onRestart}>Try Again</Button>
    </Card>
  )
}
