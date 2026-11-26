import { Button, Card } from '../ui'

interface QuestionCardProps {
  question: string
  answer: string
  isListening: boolean
  isSupported: boolean
  isTimerExpired: boolean
  recognitionError: string | null
  listenError: string | null
  isLastQuestion: boolean
  onAnswerChange: (answer: string) => void
  onListen: () => void
  onSpeakToggle: () => void
  onNext: () => void
}

export function QuestionCard({
  question,
  answer,
  isListening,
  isSupported,
  isTimerExpired,
  recognitionError,
  listenError,
  isLastQuestion,
  onAnswerChange,
  onListen,
  onSpeakToggle,
  onNext,
}: QuestionCardProps) {
  return (
    <Card
      aria-labelledby="interview-question"
      className="flex flex-col gap-gutter-md"
      padding="lg"
      role="article"
    >
      <header className="flex flex-wrap items-center justify-between gap-gutter-sm border-b border-light-outline-variant pb-gutter-sm">
        <span className="font-mono text-label-sm text-light-on-surface-variant">
          Interviewer · Staff Engineer
        </span>
        <Button
          aria-label="Listen to the interviewer question"
          className="gap-1.5 px-2.5 py-1.5 font-mono text-label-sm"
          onClick={onListen}
          size="sm"
          variant="secondary"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-body-md">
            volume_up
          </span>
          Listen
        </Button>
      </header>

      <h2
        className="font-headline text-headline-md text-light-on-surface text-balance"
        id="interview-question"
      >
        “{question}”
      </h2>

      <div className="flex min-h-36 flex-col gap-gutter-xs rounded-default border border-light-outline-variant bg-light-surface-container-low p-gutter-md">
        <label
          className="font-mono text-label-sm text-light-on-surface-variant"
          htmlFor="interview-answer"
        >
          Your Spoken Transcript
        </label>
        <textarea
          aria-live="polite"
          className="min-h-24 w-full flex-1 resize-y border-0 bg-transparent p-0 font-body text-body-md leading-relaxed text-light-on-surface placeholder:text-light-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary"
          id="interview-answer"
          onChange={(event) => onAnswerChange(event.currentTarget.value)}
          placeholder={
            isSupported
              ? 'Your spoken answer will appear here. You can also type or edit your response.'
              : 'Speech recognition is unavailable. Type your answer here.'
          }
          value={answer}
        />
      </div>

      {!isSupported && (
        <p
          className="rounded-default border border-warning bg-warning-container px-gutter-md py-gutter-sm font-body text-body-sm text-on-warning-container"
          role="alert"
        >
          Speech recognition is not supported in this browser. You can type your answer above; use Chrome or Edge to speak.
        </p>
      )}
      {recognitionError && (
        <p
          className="rounded-default border border-light-error bg-light-error-container px-gutter-md py-gutter-sm font-body text-body-sm text-light-on-error-container"
          role="alert"
        >
          {recognitionError}
        </p>
      )}
      {listenError && (
        <p
          className="rounded-default border border-light-error bg-light-error-container px-gutter-md py-gutter-sm font-body text-body-sm text-light-on-error-container"
          role="alert"
        >
          {listenError}
        </p>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-gutter-sm pt-gutter-sm">
        <Button
          disabled={!isSupported || isTimerExpired}
          onClick={onSpeakToggle}
          variant="secondary"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-body-lg">
            {isListening ? 'stop_circle' : 'mic'}
          </span>
          {isListening ? 'Stop' : 'Speak Answer'}
        </Button>
        <Button onClick={onNext}>
          {isLastQuestion ? 'Finish Interview' : 'Next Question'}
        </Button>
      </footer>
    </Card>
  )
}
