import { Badge, Button, Card } from '../ui'
import type { Question } from '../../types/exercises'

interface QuestionCardProps {
  question: Question
  selectedOptionId: string | null
  answer: { isCorrect: boolean; explanation: string; correctAnswer?: string } | null
  isAnswering: boolean
  isLastQuestion: boolean
  onSelectOption: (optionId: string) => void
  onCheckAnswer: () => void
  onNextQuestion: () => void
}

export function QuestionCard({
  answer,
  isAnswering,
  isLastQuestion,
  onCheckAnswer,
  onNextQuestion,
  onSelectOption,
  question,
  selectedOptionId,
}: QuestionCardProps) {
  return (
    <section aria-label="Active exercise" className="lg:col-span-8">
      <Card className="flex flex-col gap-gutter-lg" padding="lg">
        <header className="flex flex-wrap items-center justify-between gap-gutter-sm border-b border-light-outline-variant pb-gutter-md">
          <Badge variant="warning">Focus: {question.focusCategory}</Badge>
          <span className="font-mono text-label-sm text-light-on-surface-variant">
            Generated for your recent learning needs
          </span>
        </header>

        <fieldset className="flex flex-col gap-gutter-md">
          <legend className="w-full pb-gutter-md font-title text-title-md text-light-on-surface">
            {question.prompt}
          </legend>
          <div className="flex flex-col gap-gutter-sm">
            {question.options.map((option, index) => {
                const optionId = String.fromCharCode(65 + index)
                const isSelected = selectedOptionId === option
                const stateClasses = !answer
                  ? isSelected
                    ? 'border-light-primary bg-light-surface-container-low'
                    : 'border-light-outline-variant bg-light-surface-container-lowest hover:border-light-primary'
                  : isSelected
                    ? answer.isCorrect
                      ? 'border-light-primary bg-success-container text-on-success-container'
                      : 'border-light-secondary bg-light-error-container text-light-on-error-container'
                    : 'border-light-outline-variant bg-light-surface-container-lowest'

              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-start gap-gutter-sm rounded-default border p-gutter-md text-left transition-colors focus-within:ring-2 focus-within:ring-light-primary focus-within:ring-offset-2 ${stateClasses}`}
                >
                  <input
                    checked={isSelected}
                    className="mt-0.5 size-4 shrink-0 accent-light-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary"
                    name={`question-${question.id}`}
                    disabled={Boolean(answer) || isAnswering}
                    onChange={() => onSelectOption(option)}
                    type="radio"
                    value={option}
                  />
                  <span className="font-body text-body-md">{optionId}. {option}</span>
                </label>
              )
            })}
          </div>
        </fieldset>

        {answer && (
          <div
            aria-live="polite"
            className={`flex flex-col gap-1 rounded-default p-gutter-md ${
              answer.isCorrect
                ? 'bg-success-container text-on-success-container'
                : 'bg-light-error-container text-light-on-error-container'
            }`}
            role="status"
          >
            <span className="font-mono text-label-sm">
              {answer.isCorrect ? 'Correct · B2 Precision' : 'Not quite · Check rule'}
            </span>
            <p className="text-pretty font-body text-body-sm">
              {!answer.isCorrect && answer.correctAnswer
                ? `Best answer: ${answer.correctAnswer} `
                : ''}{answer.explanation}
            </p>
          </div>
        )}

        <footer className="flex flex-col gap-gutter-sm border-t border-light-outline-variant pt-gutter-md sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-label-sm text-light-on-surface-variant">
            Source: Your practice history
          </p>
          <Button
            disabled={answer ? false : selectedOptionId === null || isAnswering}
            onClick={answer ? onNextQuestion : onCheckAnswer}
          >
            {isAnswering ? 'Checking…' : answer ? (isLastQuestion ? 'See Results' : 'Next Question') : 'Check Answer'}
          </Button>
        </footer>
      </Card>
    </section>
  )
}
