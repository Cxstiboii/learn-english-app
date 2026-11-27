import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ExerciseSummary } from '../components/exercises/ExerciseSummary'
import { QuestionCard } from '../components/exercises/QuestionCard'
import { WeakSpotsQueue } from '../components/exercises/WeakSpotsQueue'
import { Button, Card } from '../components/ui'
import { useAnswerExercise, useGenerateExercises, useWeakSpots } from '../hooks/useExercises'
import type { ExerciseQuestion } from '../services/exercises'
import type { Question } from '../types/exercises'

function RetryNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-gutter-sm rounded-default border border-light-error bg-light-error-container px-gutter-md py-gutter-sm text-light-on-error-container"
      role="alert"
    >
      <span>{message}</span>
      <Button onClick={onRetry} size="sm" variant="secondary">Retry</Button>
    </div>
  )
}

function toQuestion(question: ExerciseQuestion): Question {
  return {
    id: question.id,
    focusCategory: question.focusCategory,
    prompt: question.prompt,
    options: question.options,
  }
}

export default function Exercises() {
  const [searchParams] = useSearchParams()
  const requestedFocusCategory = searchParams.get('focusCategory')?.trim()
  const focusCategory = requestedFocusCategory && requestedFocusCategory.length <= 80
    ? requestedFocusCategory
    : undefined
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [answer, setAnswer] = useState<{
    isCorrect: boolean
    explanation: string
    correctAnswer?: string
  } | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const weakSpotsQuery = useWeakSpots()
  const generateMutation = useGenerateExercises()
  const answerMutation = useAnswerExercise()
  const currentQuestion = questions[currentQuestionIndex]

  function generateSet() {
    generateMutation.mutate({
      count: 5,
      ...(focusCategory ? { focusCategory } : {}),
    }, {
      onSuccess: ({ exercises }) => {
        setQuestions(exercises.map(toQuestion))
        setCurrentQuestionIndex(0)
        setSelectedOption(null)
        setAnswer(null)
        setCorrectCount(0)
        setIsFinished(false)
      },
    })
  }

  function checkAnswer() {
    if (!currentQuestion || !selectedOption || answerMutation.isPending) return
    submitAnswer({ id: currentQuestion.id, selectedOption })
  }

  function submitAnswer(input: { id: string; selectedOption: string }) {
    answerMutation.mutate(input, {
        onSuccess: (result) => {
          setAnswer(result)
          setCorrectCount((count) => count + (result.isCorrect ? 1 : 0))
        },
      })
  }

  function nextQuestion() {
    if (!answer) return
    if (currentQuestionIndex === questions.length - 1) {
      setIsFinished(true)
      return
    }
    setCurrentQuestionIndex((index) => index + 1)
    setSelectedOption(null)
    setAnswer(null)
    answerMutation.reset()
  }

  function restartQuiz() {
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setAnswer(null)
    setCorrectCount(0)
    setIsFinished(false)
    answerMutation.reset()
  }

  const activeWeakSpotId = currentQuestion
    ? weakSpotsQuery.data?.find(
        ({ category }) => category.toLocaleLowerCase() === currentQuestion.focusCategory.toLocaleLowerCase(),
      )?.id ?? null
    : null

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-gutter-lg px-gutter-md py-gutter-lg sm:px-page-margin">
      <section
        aria-labelledby="exercises-title"
        className="flex flex-col justify-between gap-gutter-md md:flex-row md:items-end"
      >
        <div className="flex flex-col gap-gutter-xs">
          <span className="font-mono text-label-sm uppercase tracking-wider text-light-secondary">
            Module 03 · Error-Driven Drills
          </span>
          <h1 className="font-headline text-display-lg-mobile text-light-on-surface md:text-headline-lg" id="exercises-title">
            Targeted Exercises
          </h1>
          <p className="font-body text-body-md text-light-on-surface-variant">
            {focusCategory
              ? `Focused practice for your recurring ${focusCategory} errors.`
              : 'Generated from your recent Tutor Chat and evaluation mistakes.'}
          </p>
        </div>
        {questions.length > 0 && !isFinished && (
          <span aria-live="polite" className="font-mono text-label-md tabular-nums text-light-on-surface">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        )}
      </section>

      {weakSpotsQuery.isError && (
        <RetryNotice message={weakSpotsQuery.error.message} onRetry={() => void weakSpotsQuery.refetch()} />
      )}
      {generateMutation.isError && (
        <RetryNotice message={generateMutation.error.message} onRetry={generateSet} />
      )}
      {answerMutation.isError && answerMutation.variables && (
        <RetryNotice
          message={answerMutation.error.message}
          onRetry={() => answerMutation.variables && submitAnswer(answerMutation.variables)}
        />
      )}

      <div className="grid grid-cols-1 items-start gap-gutter-lg lg:grid-cols-12">
        <div className="lg:col-span-8">
          {generateMutation.isPending ? (
            <div aria-label="Generating exercises" className="flex min-h-80 animate-pulse flex-col gap-gutter-md rounded-default border border-light-outline-variant bg-light-surface-container-lowest p-gutter-lg">
              <div className="h-6 w-40 rounded bg-light-surface-container-high" />
              <div className="h-10 rounded bg-light-surface-container-high" />
              <div className="h-14 rounded bg-light-surface-container-high" />
              <div className="h-14 rounded bg-light-surface-container-high" />
            </div>
          ) : isFinished ? (
            <ExerciseSummary
              correctCount={correctCount}
              onRestart={restartQuiz}
              totalQuestions={questions.length}
            />
          ) : currentQuestion ? (
            <QuestionCard
              answer={answer}
              isAnswering={answerMutation.isPending}
              isLastQuestion={currentQuestionIndex === questions.length - 1}
              onCheckAnswer={checkAnswer}
              onNextQuestion={nextQuestion}
              onSelectOption={(option) => setSelectedOption(option)}
              question={currentQuestion}
              selectedOptionId={selectedOption}
            />
          ) : (
            <Card className="flex min-h-80 flex-col items-center justify-center gap-gutter-md text-center" padding="lg">
              <h2 className="font-headline text-headline-md text-light-on-surface">
                {focusCategory ? `Ready to practice ${focusCategory}?` : 'Ready for a focused practice set?'}
              </h2>
              <p className="max-w-md font-body text-body-md text-light-on-surface-variant">
                We’ll create five questions from your most frequent errors, or common B1+ technical grammar if you have none yet.
              </p>
              <Button disabled={weakSpotsQuery.isLoading} onClick={generateSet}>
                {focusCategory ? `Generate 5 ${focusCategory} exercises` : 'Generate 5 exercises'}
              </Button>
            </Card>
          )}
        </div>
        {weakSpotsQuery.isLoading ? (
          <div aria-label="Loading weak spots" className="h-64 animate-pulse rounded-default bg-light-surface-container-high lg:col-span-4" />
        ) : (
          <WeakSpotsQueue
            activeWeakSpotId={activeWeakSpotId}
            weakSpots={weakSpotsQuery.data ?? []}
          />
        )}
      </div>
    </div>
  )
}
